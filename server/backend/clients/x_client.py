import base64, hashlib, os
from typing import Dict, Any
import httpx
from ..core.config import settings

AUTH_URL = "https://twitter.com/i/oauth2/authorize"
TOKEN_URL = "https://api.twitter.com/2/oauth2/token"

def _b64url(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode("ascii")

def generate_pkce() -> tuple[str, str]:
    verifier = _b64url(os.urandom(32))
    challenge = _b64url(hashlib.sha256(verifier.encode()).digest())
    return verifier, challenge

def build_auth_url(state: str, code_challenge: str) -> str:
    params = {
        "response_type": "code",
        "client_id": settings.X_CLIENT_ID,
        "redirect_uri": str(settings.X_REDIRECT_URI),
        "scope": settings.X_SCOPES,
        "state": state,
        "code_challenge": code_challenge,
        "code_challenge_method": "S256",
        "force_login": "true",  # Force login screen to appear (allows account switching)
    }
    qp = httpx.QueryParams(params)
    auth_url = f"{AUTH_URL}?{qp}"
    print(f"🔗 Built OAuth URL with force_login=true (allows account switching)")
    print(f"   URL (first 150 chars): {auth_url[:150]}...")
    return auth_url

async def exchange_code_for_token(code: str, code_verifier: str) -> Dict[str, Any]:
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": str(settings.X_REDIRECT_URI),
        "code_verifier": code_verifier,
    }
    
    # Twitter OAuth 2.0 requires Basic Auth with client_id:client_secret
    import base64
    credentials = f"{settings.X_CLIENT_ID}:{settings.X_CLIENT_SECRET}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode()
    
    headers = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": f"Basic {encoded_credentials}",
    }
    
    print(f"🔐 Exchanging code for token with client_id: {settings.X_CLIENT_ID[:20]}...")
    
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.post(
            TOKEN_URL,
            data=data,
            headers=headers,
        )
        
        if r.status_code != 200:
            print(f"❌ Token exchange failed: Status {r.status_code}")
            print(f"   Response: {r.text[:200]}")
        
        r.raise_for_status()
        return r.json()
