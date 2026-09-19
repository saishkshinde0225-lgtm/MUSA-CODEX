import json
import os
import urllib.error
import urllib.request

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = os.getenv(
    "OPENROUTER_MODEL",
    "qwen/qwen3-8b"
)
SYSTEM_PROMPT = """You are the language normalization layer for OMNITRIX.

Convert the student's message into clear natural English for the downstream emotion-classification model.

Rules:
- Preserve the exact meaning, emotional tone, intent, and important details.
- Understand English, Hindi, Hinglish, Marathi, and common regional/code-mixed phrasing.
- Fix spelling, grammar, transliteration, and obvious writing issues.
- Translate regional-language content when necessary.
- Do not summarize.
- Do not add facts, emotions, diagnoses, or interpretations.
- Return ONLY the normalized text.
"""


def normalize_text(text: str) -> str:
    text = text.strip()

    if not text:
        return text

    api_key = os.getenv("OPENROUTER_API_KEY")

    # Keep existing ML pipeline functional without an API key.
    if not api_key:
        return text

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": text
            }
        ],
        "temperature": 0.6,
        "max_tokens": 256
    }

    request = urllib.request.Request(
        OPENROUTER_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/saishkshinde0225-lgtm/MUSA-CODEX",
            "X-Title": "OMNITRIX"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            data = json.loads(
                response.read().decode("utf-8")
            )

        normalized = (
            data["choices"][0]["message"]["content"]
            .strip()
        )

        return normalized or text

    except (
        urllib.error.URLError,
        urllib.error.HTTPError,
        TimeoutError,
        KeyError,
        IndexError,
        ValueError
    ):
        return text