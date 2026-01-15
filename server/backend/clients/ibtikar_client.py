from typing import List, Dict

import httpx
from ..core.config import settings


BAD_LOCAL = ["hate", "kys", "die", "kill", "dumb", "trash", "terror"]


def _stub(texts: List[str]) -> List[Dict]:
    # Fallback if IBTIKAR_URL is not set or service is down
    out: List[Dict] = []
    for t in texts:
        lower = (t or "").lower()
        harmful = any(w in lower for w in BAD_LOCAL)
        out.append(
            {
                "label": "harmful" if harmful else "safe",
                "score": 0.85 if harmful else 0.70,
            }
        )
    return out


async def analyze_texts(texts: List[str]) -> List[Dict]:
    # If no URL configured, use stub
    if not settings.IBTIKAR_URL:
        print("⚠️ IBTIKAR_URL not configured, using stub fallback")
        return _stub(texts)

    url = settings.IBTIKAR_URL.rstrip("/") + "/predict"
    
    # Retry logic for sleeping Hugging Face Spaces
    max_retries = 3
    retry_delay = 5  # seconds
    
    for attempt in range(max_retries):
        try:
            # Increase timeout to allow space to wake up (60 seconds)
            async with httpx.AsyncClient(timeout=60.0) as client:
                print(f"🔍 Calling Hugging Face API (attempt {attempt + 1}/{max_retries})...")
                r = await client.post(url, json={"texts": texts})
                r.raise_for_status()
                data = r.json()
                
                preds = data.get("preds")
                if not isinstance(preds, list):
                    print("⚠️ Invalid response format, using stub fallback")
                    return _stub(texts)
                
                print(f"✅ Hugging Face API responded successfully with {len(preds)} predictions")
                
                # Make sure each item has label + score
                cleaned = []
                for p in preds:
                    cleaned.append(
                        {
                            "label": str(p.get("label", "unknown")),
                            "score": float(p.get("score", 0.0)),
                        }
                    )
                return cleaned
                
        except httpx.TimeoutException:
            print(f"⏱️ Request timeout (attempt {attempt + 1}/{max_retries}) - Space may be waking up...")
            if attempt < max_retries - 1:
                print(f"🔄 Retrying in {retry_delay} seconds...")
                import asyncio
                await asyncio.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            else:
                print("❌ Max retries reached, using stub fallback")
                return _stub(texts)
                
        except httpx.RequestError as e:
            print(f"❌ Request error: {e}")
            if attempt < max_retries - 1:
                print(f"🔄 Retrying in {retry_delay} seconds...")
                import asyncio
                await asyncio.sleep(retry_delay)
                retry_delay *= 2
            else:
                print("❌ Max retries reached, using stub fallback")
                return _stub(texts)
                
        except Exception as e:
            print(f"❌ Unexpected error: {e}")
            return _stub(texts)
    
    # Should never reach here, but just in case
    return _stub(texts)
