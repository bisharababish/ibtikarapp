from typing import List, Dict, Any

import httpx
from ..core.config import settings

# When IBTIKAR_URL is not set, use this Space. Gradio on HF uses /api/predict (not bare /predict).
DEFAULT_HF_SPACE_URL = "https://bisharababish-arabert-toxic-classifier.hf.space"
# Try these in order: /api/predict (Gradio HTTP API), then /run/predict (Gradio internal)
HF_SPACE_PATHS = ("/api/predict", "/run/predict")


def _stub_only_on_failure(texts: List[str]) -> List[Dict]:
    """Only when request actually fails (timeout, connection). Never fake safe."""
    return [{"label": "unknown", "score": 0.0} for _ in texts]


def _is_hf_space(base_url: str) -> bool:
    u = (base_url or "").lower()
    return "hf.space" in u or "huggingface.co" in u


def _extract_preds(data: Any, expected_len: int) -> List[Dict] | None:
    """Get list of {label, score} from API. Handles preds, data, and Gradio shapes."""
    if not data or not isinstance(data, dict):
        return None
    # 1) { "preds": [ { "label": "...", "score": float }, ... ] }
    preds = data.get("preds")
    if isinstance(preds, list) and len(preds) >= expected_len:
        return preds[:expected_len]
    # 2) Gradio / custom: { "data": [ ... ] } – can be list of preds or list of one batch
    payload = data.get("data")
    if isinstance(payload, list):
        if len(payload) >= expected_len and payload and isinstance(payload[0], dict):
            return payload[:expected_len]
        if len(payload) == 1 and isinstance(payload[0], list) and len(payload[0]) >= expected_len:
            return payload[0][:expected_len]
    return None


def _api_label_to_ours(label: str, score: float) -> str:
    """Map whatever the API sends to 'harmful' or 'safe'. API decides – we only normalize names."""
    s = (label or "").strip().lower()
    if s in ("harmful", "toxic"):
        return "harmful"
    if s in ("safe", "non-toxic", "nontoxic"):
        return "safe"
    # LABEL_0 / LABEL_1: common convention 0 = safe, 1 = harmful (transformers default)
    if s in ("label_0", "0"):
        return "safe"
    if s in ("label_1", "1"):
        return "harmful"
    # Unknown: use score so we don't force everything to safe
    return "harmful" if score >= 0.5 else "safe"


def _parse_response_and_build_out(data: Any, expected_len: int) -> List[Dict] | None:
    """Parse API response and return list of {label, score}; None if invalid."""
    preds = _extract_preds(data, expected_len)
    if not preds or len(preds) < expected_len:
        return None
    preds = preds[:expected_len]
    out = []
    for p in preds:
        if not isinstance(p, dict):
            out.append({"label": "unknown", "score": 0.0})
            continue
        label_raw = p.get("label")
        score = float(p.get("score", 0.0))
        final_label = _api_label_to_ours(str(label_raw or ""), score)
        out.append({"label": final_label, "score": score})
    return out


async def analyze_texts(texts: List[str]) -> List[Dict]:
    # Base URL: env or default HF Space (no path – we add path below)
    base = (settings.IBTIKAR_URL or DEFAULT_HF_SPACE_URL).strip().rstrip("/")
    if not base:
        print("⚠️ No IBTIKAR_URL and default missing")
        return _stub_only_on_failure(texts)

    is_hf = _is_hf_space(base)
    if is_hf:
        # Strip any path so we only have scheme+host (e.g. https://xxx.hf.space)
        base_root = base.split("/predict")[0].split("/api")[0].split("/run")[0].rstrip("/")
        # Try /api/predict first (Gradio HTTP API), then /run/predict
        urls_to_try = [(base_root + path, {"texts": texts}) for path in HF_SPACE_PATHS]
        # For /run/predict Gradio expects body {"data": [inputs]}
        urls_to_try[1] = (base_root + HF_SPACE_PATHS[1], {"data": [texts]})
    else:
        url = base + "/predict" if not base.endswith("/predict") else base
        urls_to_try = [(url, {"texts": texts})]

    last_error: Exception | None = None
    for attempt in range(3):
        for url, body in urls_to_try:
            try:
                async with httpx.AsyncClient(timeout=60.0) as client:
                    print(f"🔍 Hugging Face API (attempt {attempt + 1}) POST {url} with {len(texts)} texts")
                    r = await client.post(url, json=body)
                    if r.status_code == 404:
                        print(f"⚠️ 404 at {url}, trying next path...")
                        continue
                    r.raise_for_status()
                    data = r.json()
                    keys = list(data.keys()) if isinstance(data, dict) else []
                    print(f"🔍 HF response keys: {keys}")

                    out = _parse_response_and_build_out(data, len(texts))
                    if not out or len(out) < len(texts):
                        print(f"⚠️ HF response shape wrong: need {len(texts)} preds. Response sample: {str(data)[:600]}")
                        continue
                    print(f"✅ HF API OK: {len(out)} preds, first: label={out[0]['label']} score={out[0]['score']}")
                    return out
            except httpx.TimeoutException:
                last_error = httpx.TimeoutException()
                print(f"⏱️ Timeout at {url}")
                break
            except httpx.HTTPStatusError as e:
                last_error = e
                if e.response.status_code == 404:
                    continue
                print(f"❌ HTTP {e.response.status_code} at {url}: {e}")
                break
            except httpx.RequestError as e:
                last_error = e
                print(f"❌ Request error: {e}")
                break
            except Exception as e:
                last_error = e
                print(f"❌ Error: {e}")
                break

        if attempt < 2:
            import asyncio
            await asyncio.sleep(5 * (attempt + 1))

    print(f"❌ All HF attempts failed. Set IBTIKAR_URL to your Space base URL (e.g. https://YOUR-SPACE.hf.space) or full /api/predict URL.")
    return _stub_only_on_failure(texts)
