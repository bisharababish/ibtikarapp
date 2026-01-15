import time, secrets
from typing import Optional, Dict, Any

# state -> {"verifier": str, "user_id": int, "exp": int}
_state_store: Dict[str, Dict[str, Any]] = {}

def new_state() -> str:
    return secrets.token_urlsafe(24)

def put_state(state: str, verifier: str, user_id: int, ttl_seconds: int = 1800) -> None:
    """Store OAuth state with 30 minute TTL (increased from 10 minutes)"""
    _state_store[state] = {"verifier": verifier, "user_id": int(user_id), "exp": int(time.time()) + ttl_seconds}

def pop_state(state: str) -> Optional[Dict[str, Any]]:
    """Retrieve and remove state, checking expiration first"""
    item = _state_store.get(state)
    if not item:
        return None
    # Check expiration before removing
    if item["exp"] < time.time():
        # Clean up expired state
        _state_store.pop(state, None)
        return None
    # Remove state after successful validation
    return _state_store.pop(state, None)
