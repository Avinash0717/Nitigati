"""
Audio transcription service using faster-whisper.
Downloads the model on first use (~150MB for 'base' model).
Runs entirely offline on CPU after that.
"""
import os
import tempfile
from faster_whisper import WhisperModel
from torch.cuda import is_available as torch_cuda_available
# Lazy-loaded model (loads once on first transcription request)
_model = None
_MODEL_SIZE = os.environ.get("WHISPER_MODEL_SIZE", "base")


def get_model():
    global _model
    if _model is None:
        print(f"[Whisper] Loading '{_MODEL_SIZE}' model (first request, may take a moment)...")
        _model = WhisperModel(
            _MODEL_SIZE,
            device="cpu",
            compute_type="int8",  # Fast on CPU
        )
        print("[Whisper] Model loaded.")
    return _model


def transcribe_audio(audio_file) -> str:
    """
    Accepts a Django UploadedFile (or file-like object with .read()),
    writes to a temp file, transcribes with Whisper, returns text.
    """
    model = get_model()

    # Write uploaded audio to a temp file (Whisper needs a file path)
    suffix = ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        for chunk in audio_file.chunks() if hasattr(audio_file, 'chunks') else [audio_file.read()]:
            tmp.write(chunk)
        tmp_path = tmp.name

    try:
        segments, info = model.transcribe(
            tmp_path,
            beam_size=1,        # Faster, slightly less accurate
            language="en",
            vad_filter=True,    # Skip silence
        )
        text = " ".join(seg.text.strip() for seg in segments)
        return text
    finally:
        os.unlink(tmp_path)
