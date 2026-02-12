"""
LLM-powered extraction service using Ollama.

Takes a transcript and extracts structured profile fields + semantic skill tags.
Identifies missing required fields and generates conversational follow-up questions.
"""
import json
import logging
import ollama

logger = logging.getLogger("onboarding")

_MODEL = "gemma3:1b"

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
        logger.info("  [Ollama] calling model=%s ...", _MODEL)
        response = ollama.chat(
            model=_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message},
            ],
            format="json",
            options={
                "temperature": 0.1,  # Low temp for deterministic extraction
                "num_predict": 1024,
            },
        )
        
        raw = response.message.content.strip()
        logger.info("  [Ollama] raw response: %s", raw[:200])
        result = json.loads(raw)
        
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
        
    except (json.JSONDecodeError, Exception) as e:
        logger.error("  [Ollama] extraction error: %s", e, exc_info=True)
        return {
            "fields": previous_fields or {},
            "missing": REQUIRED_FIELDS,
            "question": "Sorry, I had trouble understanding. Could you tell me your name, age, and what you do?",
        }
