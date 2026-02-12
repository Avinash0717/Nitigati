"""
WebSocket consumer for conversational AI onboarding.

Protocol (client → server):
  Binary frame             – audio chunk (webm)
  {"action": "analyze"}    – run LLM extraction on accumulated transcript
  {"action": "reset"}      – clear session state

Protocol (server → client):
  {"type": "transcript",  "text": "..."}                        – whisper result
  {"type": "analysis",    "fields": {...}, "missing": [...], "question": "..."}
  {"type": "audio",       "data": "<base64 mp3>"}               – TTS follow-up
  {"type": "complete",    "fields": {...}}                       – all required fields filled
  {"type": "error",       "message": "..."}                     – error
"""
import json
import asyncio
import base64
import logging
import os
import tempfile
import traceback

from channels.generic.websocket import AsyncWebsocketConsumer

logger = logging.getLogger("onboarding")
logger.setLevel(logging.DEBUG)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter(
        "%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S"
    ))
    logger.addHandler(handler)


class TranscribeConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.transcript = ""          # accumulated transcript
        self.fields = {}              # extracted fields so far
        self._connected = True
        self._bg_tasks: set[asyncio.Task] = set()
        await self.accept()
        logger.info("WebSocket CONNECTED from %s", self.scope.get("client", "?"))

        # Send a greeting TTS on connect
        greeting = (
            "Hi there! Tell me about yourself — your name, age, "
            "what you do, and any skills you have. Just speak naturally."
        )
        await self._safe_send({"type": "greeting", "text": greeting})
        # Generate TTS in background (tracked so we can cancel on disconnect)
        self._spawn_bg(self._send_tts(greeting))

    async def disconnect(self, close_code):
        logger.info("WebSocket DISCONNECTED (code=%s)", close_code)
        self._connected = False
        # Cancel any background tasks still running
        for task in self._bg_tasks:
            if not task.done():
                task.cancel()
                logger.debug("  cancelled bg task: %s", task.get_name())

    async def _safe_send(self, payload: dict):
        """Send JSON only if still connected."""
        if not self._connected:
            logger.debug("  _safe_send skipped (disconnected): type=%s", payload.get("type"))
            return
        try:
            await self.send(text_data=json.dumps(payload))
            logger.debug("  → sent type=%s", payload.get("type"))
        except Exception as e:
            logger.warning("  _safe_send failed: %s", e)

    def _spawn_bg(self, coro) -> asyncio.Task:
        """Launch a background task and track it for cleanup."""
        task = asyncio.ensure_future(coro)
        self._bg_tasks.add(task)
        task.add_done_callback(self._bg_tasks.discard)
        return task

    async def receive(self, text_data=None, bytes_data=None):
        # ── Text commands ──────────────────────────────────────
        if text_data:
            try:
                msg = json.loads(text_data)
            except json.JSONDecodeError:
                logger.warning("  received invalid JSON: %s", text_data[:100])
                return

            action = msg.get("action")
            logger.info("  ← action=%s", action)

            if action == "analyze":
                await self._run_analysis()
            elif action == "re_analyze":
                # Client edited the transcript — override and re-extract
                edited_transcript = msg.get("transcript", "")
                logger.info("  ← re_analyze with edited transcript (%d chars)", len(edited_transcript))
                logger.info("  OLD transcript: '%s'", self.transcript[:100] if self.transcript else '(empty)')
                self.transcript = edited_transcript
                logger.info("  NEW transcript: '%s'", self.transcript[:100])
                self.fields = {}  # reset fields so LLM re-extracts from scratch
                await self._run_analysis()
            elif action == "reset":
                self.transcript = ""
                self.fields = {}
                logger.info("  session RESET")
                await self._safe_send({"type": "reset"})
            return

        # ── Binary audio data ──────────────────────────────────
        if bytes_data and len(bytes_data) > 500:
            logger.info("  ← audio chunk: %d bytes", len(bytes_data))
            text = await asyncio.to_thread(self._transcribe_bytes, bytes_data)
            if text and text.strip():
                self.transcript += " " + text.strip()
                logger.info("  [Whisper] transcribed: '%s'", text.strip()[:80])
                await self._safe_send({"type": "transcript", "text": text.strip()})
            else:
                logger.debug("  [Whisper] no speech detected in chunk")

    # ── Analysis pipeline ──────────────────────────────────────

    async def _run_analysis(self):
        """Run LLM extraction on accumulated transcript."""
        if not self.transcript.strip():
            logger.warning("  analyze requested but transcript is empty")
            await self._safe_send({
                "type": "error",
                "message": "No speech detected yet. Please try speaking again.",
            })
            return

        logger.info("  [LLM] starting extraction (transcript: %d chars)", len(self.transcript))
        try:
            result = await asyncio.to_thread(
                self._extract, self.transcript, self.fields
            )
        except Exception as e:
            logger.error("  [LLM] extraction failed: %s\n%s", e, traceback.format_exc())
            await self._safe_send({
                "type": "error",
                "message": f"Analysis failed: {e}",
            })
            return

        self.fields = result["fields"]
        missing = result["missing"]
        question = result["question"]
        logger.info("  [LLM] extracted fields: %s", list(self.fields.keys()))
        logger.info("  [LLM] missing: %s | question: %s", missing, question[:60] if question else None)

        if not missing:
            logger.info("  ✓ ALL FIELDS COMPLETE — sending 'complete'")
            await self._safe_send({"type": "complete", "fields": self.fields})
        else:
            await self._safe_send({
                "type": "analysis",
                "fields": self.fields,
                "missing": missing,
                "question": question,
            })
            if question:
                self._spawn_bg(self._send_tts(question))

    async def _send_tts(self, text: str):
        """Generate TTS audio and send as base64."""
        if not self._connected:
            logger.debug("  _send_tts skipped (disconnected)")
            return
        logger.info("  [TTS] generating for: '%s'", text[:60])
        try:
            from .tts import generate_speech_async
            audio_bytes = await generate_speech_async(text)
            if not self._connected:
                logger.debug("  [TTS] generated but client disconnected, skipping send")
                return
            b64 = base64.b64encode(audio_bytes).decode("ascii")
            logger.info("  [TTS] sending %d bytes of MP3 audio", len(audio_bytes))
            await self._safe_send({"type": "audio", "data": b64})
        except asyncio.CancelledError:
            logger.debug("  [TTS] task cancelled (client disconnected)")
        except Exception as e:
            logger.error("  [TTS] Error: %s\n%s", e, traceback.format_exc())

    # ── Static helpers (run in thread pool) ────────────────────

    @staticmethod
    def _transcribe_bytes(audio_bytes: bytes) -> str:
        """Whisper transcription of raw audio bytes."""
        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name

            from .transcribe import get_model
            logger.debug("  [Whisper] loading model...")
            model = get_model()
            logger.debug("  [Whisper] transcribing %d bytes...", len(audio_bytes))
            segments, info = model.transcribe(
                tmp_path,
                beam_size=1,
                language="en",
                vad_filter=True,
            )
            text = " ".join(seg.text.strip() for seg in segments)
            logger.info("  [Whisper] result: '%s'", text[:80] if text else "(empty)")
            return text
        except Exception as e:
            logger.error("  [Whisper] Transcription error: %s\n%s", e, traceback.format_exc())
            return ""
        finally:
            if tmp_path:
                try:
                    os.unlink(tmp_path)
                except OSError:
                    pass

    @staticmethod
    def _extract(transcript: str, previous_fields: dict) -> dict:
        """Run Ollama extraction."""
        from .extraction import extract_profile
        logger.info("  [LLM] calling Ollama extract_profile...")
        result = extract_profile(transcript, previous_fields or None)
        logger.info("  [LLM] done — fields=%s missing=%s", list(result.get("fields", {}).keys()), result.get("missing", []))
        return result
