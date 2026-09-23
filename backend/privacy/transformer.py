import re
import unicodedata


# Direct identifiers
EMAIL_PATTERN = re.compile(
    r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b",
    re.IGNORECASE,
)

PHONE_PATTERN = re.compile(
    r"(?<!\d)(?:\+?91[\s-]?)?[6-9]\d{9}(?!\d)"
)

URL_PATTERN = re.compile(
    r"\b(?:https?://|www\.)\S+\b",
    re.IGNORECASE,
)

# Common identifier labels
ID_LABEL_PATTERN = re.compile(
    r"\b(?:roll\s*(?:no|number)|rollno|student\s*id|"
    r"enrollment\s*(?:no|number)|registration\s*(?:no|number))"
    r"\s*[:#-]?\s*[A-Za-z0-9/-]+\b",
    re.IGNORECASE,
)

# Social/media handles
HANDLE_PATTERN = re.compile(
    r"(?<!\w)@[A-Za-z0-9_.-]{2,}\b"
)

# Long numeric identifiers
LONG_NUMBER_PATTERN = re.compile(
    r"(?<!\d)\d{8,}(?!\d)"
)


# Contextual identifiers
PERSON_PATTERN = re.compile(
    r"\b(?:professor|prof|sir|ma'am|madam|mr|mrs|ms|dr)\s+"
    r"[A-Za-z]+(?:\s+[A-Za-z]+){0,2}\b",
    re.IGNORECASE,
)

ROOM_PATTERN = re.compile(
    r"\b(?:room|rm)\s*[-#: ]?\s*\d{1,4}\b",
    re.IGNORECASE,
)

ACADEMIC_CONTEXT_PATTERN = re.compile(
    r"\b(?:te|be|fe|se)\s+"
    r"(?:aiml|cse|ece|it|me|civil|eee)\s+"
    r"(?:division|div)\s+[a-z]\b",
    re.IGNORECASE,
)

DIVISION_PATTERN = re.compile(
    r"\b(?:division|div)\s+[a-z]\b",
    re.IGNORECASE,
)


def _mask_direct_identifiers(text: str) -> str:
    text = EMAIL_PATTERN.sub("[EMAIL]", text)
    text = PHONE_PATTERN.sub("[PHONE]", text)
    text = URL_PATTERN.sub("[URL]", text)
    text = ID_LABEL_PATTERN.sub("[STUDENT_ID]", text)
    text = HANDLE_PATTERN.sub("[HANDLE]", text)
    text = LONG_NUMBER_PATTERN.sub("[NUMBER_ID]", text)

    return text


def _mask_contextual_identifiers(text: str) -> str:
    text = PERSON_PATTERN.sub("[PERSON]", text)
    text = ROOM_PATTERN.sub("[LOCATION]", text)
    text = ACADEMIC_CONTEXT_PATTERN.sub("[ACADEMIC_CONTEXT]", text)
    text = DIVISION_PATTERN.sub("[ACADEMIC_CONTEXT]", text)

    return text


def _normalize_unicode(text: str) -> str:
    return unicodedata.normalize("NFKC", text)


def _normalize_punctuation(text: str) -> str:
    # Collapse repeated punctuation that can act as a writing-style fingerprint.
    text = re.sub(r"!{2,}", "!", text)
    text = re.sub(r"\?{2,}", "?", text)
    text = re.sub(r"\.{2,}", ".", text)

    # Remove decorative punctuation commonly used as stylistic fingerprints.
    text = re.sub(r"[~`]+", " ", text)

    # Normalize repeated whitespace.
    text = re.sub(r"\s+", " ", text)

    return text.strip()


def _normalize_capitalization(text: str) -> str:
    # Lowercase normal text while preserving privacy placeholders.
    parts = re.split(r"(\[[A-Z_]+\])", text)

    for i in range(len(parts)):
        if not re.fullmatch(r"\[[A-Z_]+\]", parts[i]):
            parts[i] = parts[i].lower()

    return "".join(parts)


def transform_for_privacy(text: str) -> str:
    """
    Convert raw complaint text into a privacy-reduced representation.

    The transformation is deterministic and happens before any downstream
    normalization, model inference, external API call, or persistence.
    """
    if not isinstance(text, str):
        raise TypeError("text must be a string")

    text = text.strip()

    if not text:
        return ""

    text = _normalize_unicode(text)
    text = _mask_direct_identifiers(text)
    text = _mask_contextual_identifiers(text)
    text = _normalize_punctuation(text)
    text = _normalize_capitalization(text)

    return text