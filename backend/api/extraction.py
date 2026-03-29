"""
LLM-powered extraction service using Gemini.

Takes a transcript and extracts structured profile fields + semantic skill tags.
Identifies missing required fields and generates conversational follow-up questions.
"""
import json
import logging
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

logger = logging.getLogger("onboarding")

_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.0-flash")
_GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()

REQUIRED_FIELDS = ["name", "age", "gender", "skills"]
OPTIONAL_FIELDS = ["location", "phone_number", "email"]

SYSTEM_PROMPT = """You are an AI assistant that extracts structured profile information from a person's spoken description of themselves.

Given a transcript, extract as many of the following fields as possible:
- name (string)
- age (integer)
- gender (string: male/female/other)
- location (string: city or area)
- phone_number (string)
- email (string)
- skills (array of strings: explicit and implied/related skills)

For the "skills" field, be generous — extract both explicitly stated skills AND strongly implied ones.
For example, if someone says "I manage newer carpenters", infer skills like:
  carpentry, woodworking, team management, leadership, mentoring, training,
  project coordination, quality control, craftsmanship, etc.

You MUST respond with valid JSON only. No markdown, no explanation, no extra text.

Response format:
{
  "fields": {
    "name": "John" or null,
    "age": 23 or null,
    "gender": "male" or null,
    "location": "Mumbai" or null,
    "phone_number": "9876543210" or null,
    "email": "john@example.com" or null,
    "skills": ["carpentry", "leadership", ...] or []
  },
  "missing": ["name", "age"],
  "question": "A natural conversational question asking for the missing information. Keep it short and friendly. If nothing is missing, set to null."
}

Rules:
1. "missing" should list required fields (name, age, gender, skills) that are null or empty.
2. If ALL required fields are filled, set "missing" to [] and "question" to null.
3. The "question" should ask for AT MOST 2 missing things at once to keep it conversational.
4. Only output the JSON object. Nothing else."""


def extract_profile(transcript: str, previous_fields: dict | None = None) -> dict:
    """
    Extract structured fields from transcript text.
    
    Args:
        transcript: The full accumulated transcript so far.
        previous_fields: Previously extracted fields to merge with (for multi-turn).
    
    Returns:
        dict with keys: fields, missing, question, tags
    """
    user_message = f"Transcript:\n\"{transcript}\""
    
    if previous_fields:
        user_message += f"\n\nPreviously extracted (merge and update with new info):\n{json.dumps(previous_fields)}"

    try:
        if not _GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY is not configured")

        logger.info("  [Gemini] calling model=%s ...", _MODEL)
        result = _call_gemini_json(user_message)
        
        # Validate structure
        fields = result.get("fields", {})
        missing = result.get("missing", [])
        question = result.get("question")
        
        # Ensure skills is always a list
        if not isinstance(fields.get("skills"), list):
            fields["skills"] = []
        
        # Recompute missing based on actual field values
        actual_missing = []
        for f in REQUIRED_FIELDS:
            val = fields.get(f)
            if val is None or val == "" or (isinstance(val, list) and len(val) == 0):
                actual_missing.append(f)
        
        return {
            "fields": fields,
            "missing": actual_missing,
            "question": question if actual_missing else None,
        }
        
    except Exception as e:
        logger.error("  [Gemini] extraction error: %s", e, exc_info=True)
        return {
            "fields": previous_fields or {},
            "missing": REQUIRED_FIELDS,
            "question": "Sorry, I had trouble understanding. Could you tell me your name, age, and what you do?",
        }


def _call_gemini_json(user_message: str) -> dict:
    endpoint = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{_MODEL}:generateContent"
        f"?key={_GEMINI_API_KEY}"
    )

    payload = {
        "system_instruction": {
            "parts": [
                {"text": SYSTEM_PROMPT}
            ]
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": user_message}],
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 1024,
            "responseMimeType": "application/json",
        },
    }

    req = Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(req, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
    except HTTPError as e:
        detail = e.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Gemini HTTP {e.code}: {detail[:300]}") from e
    except URLError as e:
        raise RuntimeError(f"Gemini network error: {e.reason}") from e

    candidates = data.get("candidates") or []
    if not candidates:
        raise RuntimeError("Gemini returned no candidates")

    parts = (((candidates[0] or {}).get("content") or {}).get("parts")) or []
    text = ""
    for part in parts:
        if "text" in part:
            text += part["text"]

    text = text.strip()
    if not text:
        raise RuntimeError("Gemini returned empty text")

    # Gemini may still wrap JSON in markdown fences in edge cases.
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:]
        text = text.strip()

    logger.info("  [Gemini] raw response: %s", text[:200])
    return json.loads(text)
