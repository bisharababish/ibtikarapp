from cryptography.fernet import Fernet
from .config import settings
import base64

def _normalize_or_generate_fernet_key(value: str) -> bytes:
    """
    Return a valid Fernet key as bytes.
    - Trims surrounding whitespace
    - Attempts urlsafe decode+encode roundtrip
    - Fixes missing padding
    - If still invalid, generates a fresh key (safe for dev/bootstrap)
    """
    s = (value or "").strip()
    if not s:
        return Fernet.generate_key()
    # Ensure proper padding for base64 (length multiple of 4)
    missing = (-len(s)) % 4
    if missing:
        s = s + ("=" * missing)
    try:
        rb = base64.urlsafe_b64decode(s)
        if len(rb) != 32:
            # wrong decoded length; fall back to generate
            return Fernet.generate_key()
        return base64.urlsafe_b64encode(rb)
    except Exception:
        return Fernet.generate_key()

normalized_key = _normalize_or_generate_fernet_key(getattr(settings, "FERNET_KEY", ""))
_f = Fernet(normalized_key)

def enc(s: str) -> bytes:
    return _f.encrypt(s.encode())

def dec(b: bytes) -> str:
    return _f.decrypt(b).decode()
