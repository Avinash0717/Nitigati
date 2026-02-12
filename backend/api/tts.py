"""
Text-to-Speech service using Microsoft Edge TTS.

Generates natural-sounding speech audio (MP3) from text.
Free, no API key required.
"""
import asyncio
import io
import logging
import edge_tts

logger = logging.getLogger("onboarding")

# Natural-sounding English voice
_VOICE = "en-US-JennyNeural"


async def _generate_speech_async(text: str) -> bytes:
    """Generate speech audio bytes from text (async)."""
    logger.debug("  [EdgeTTS] generating speech for: '%s'", text[:60])
    communicate = edge_tts.Communicate(text, _VOICE)
    buffer = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            buffer.write(chunk["data"])
    result = buffer.getvalue()
    logger.info("  [EdgeTTS] generated %d bytes of MP3", len(result))
    return result


def generate_speech(text: str) -> bytes:
    """
    Synchronous wrapper — generates MP3 audio bytes from text.
    Safe to call from sync code or via asyncio.to_thread().
    """
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(_generate_speech_async(text))
    finally:
        loop.close()


async def generate_speech_async(text: str) -> bytes:
    """
    Async version — generates MP3 audio bytes from text.
    Use this from async consumers.
    """
    return await _generate_speech_async(text)
