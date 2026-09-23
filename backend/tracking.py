import hashlib
import secrets


def generate_tracking_token() -> str:
    return secrets.token_urlsafe(24)


def hash_tracking_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()