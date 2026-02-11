from typing import List, Dict, Any

import httpx
from ..core.config import settings

# When IBTIKAR_URL is not set, use this Space.
DEFAULT_HF_SPACE_URL = "https://bisharababish-arabert-toxic-classifier.hf.space"
DEFAULT_HF_SPACE_NAME = "Bisharababish/arabert-toxic-classifier"


def _stub_only_on_failure(texts: List[str]) -> List[Dict]:
    """Only when request actually fails (timeout, connection). Never fake safe."""
    return [{"label": "unknown", "score": 0.0} for _ in texts]


def _api_label_to_ours(label: str, score: float) -> str:
    """Map whatever the API sends to 'harmful' or 'safe'."""
    s = (label or "").strip().lower()
    if s in ("harmful", "toxic"):
        return "harmful"
    if s in ("safe", "non-toxic", "nontoxic"):
        return "safe"
    if s in ("label_0", "0"):
        return "safe"
    if s in ("label_1", "1"):
        return "harmful"
    return "harmful" if score >= 0.5 else "safe"


def _parse_single_result(result: Any) -> Dict:
    """Parse a single prediction result from the Space into {label, score}."""
    if isinstance(result, dict):
        label = str(result.get("label", result.get("prediction", "")) or "")
        score = float(result.get("score", result.get("confidence", 0.0)))
        return {"label": _api_label_to_ours(label, score), "score": score}

    if isinstance(result, (list, tuple)):
        # Space returns [{"label": "harmful"|"safe", "score": float}]
        if len(result) == 1 and isinstance(result[0], dict):
            d = result[0]
            label = str(d.get("label", "") or "")
            score = float(d.get("score", 0.0))
            return {"label": _api_label_to_ours(label, score), "score": score}
        if len(result) >= 2:
            label = str(result[0] or "")
            try:
                score = float(result[1])
            except (TypeError, ValueError):
                score = 0.0
            return {"label": _api_label_to_ours(label, score), "score": score}

    if isinstance(result, str):
        return {"label": _api_label_to_ours(result, 0.5), "score": 0.5}

    return {"label": "unknown", "score": 0.0}


async def _call_gradio_api(base_url: str, text: str, timeout: float = 120.0) -> Dict | None:
    """
    Call Gradio 5.x HTTP API (two-step: POST /call/predict -> GET /call/predict/<event_id>).
    Returns parsed {label, score} or None on failure.
    """
    call_url = f"{base_url}/call/predict"
    alt_call_url = f"{base_url}/gradio_api/call/predict"

    for url in [call_url, alt_call_url]:
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                # Step 1: POST to initiate the call
                r = await client.post(url, json={"data": [text]})
                if r.status_code == 404:
                    print(f"⚠️ 404 at {url}, trying next...")
                    continue
                r.raise_for_status()
                resp = r.json()
                event_id = resp.get("event_id")
                if not event_id:
                    print(f"⚠️ No event_id in response from {url}: {resp}")
                    continue

                print(f"  📨 Got event_id={event_id} from {url}")

                # Step 2: GET the result (SSE stream)
                result_url = f"{url}/{event_id}"
                r2 = await client.get(result_url, timeout=timeout)
                r2.raise_for_status()

                # Parse SSE response - look for "data:" lines with JSON
                body = r2.text
                result_data = None
                for line in body.strip().split("\n"):
                    line = line.strip()
                    if line.startswith("data:"):
                        json_str = line[5:].strip()
                        if json_str:
                            import json
                            try:
                                result_data = json.loads(json_str)
                            except json.JSONDecodeError:
                                continue

                if result_data and isinstance(result_data, list) and len(result_data) > 0:
                    return _parse_single_result(result_data[0])
                elif result_data:
                    return _parse_single_result(result_data)

                print(f"⚠️ Could not parse SSE response from {result_url}: {body[:500]}")
                return None

        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                print(f"⚠️ 404 at {url}, trying next...")
                continue
            print(f"❌ HTTP {e.response.status_code} at {url}: {e}")
        except httpx.TimeoutException:
            print(f"⏱️ Timeout at {url}")
        except Exception as e:
            print(f"❌ Error calling {url}: {e}")

    return None


async def analyze_texts(texts: List[str]) -> List[Dict]:
    """Analyze a list of texts for toxicity using the HF Space."""
    base = (settings.IBTIKAR_URL or DEFAULT_HF_SPACE_URL).strip().rstrip("/")
    if not base:
        print("⚠️ No IBTIKAR_URL and default missing")
        return _stub_only_on_failure(texts)

    # Clean base URL (remove any trailing path fragments)
    for suffix in ["/predict", "/api", "/run", "/call"]:
        if base.endswith(suffix):
            base = base[: -len(suffix)].rstrip("/")

    print(f"🔍 Calling Gradio 5.x API at {base}/call/predict for {len(texts)} texts...")

    results = []
    for i, text in enumerate(texts):
        if not text or not text.strip():
            results.append({"label": "safe", "score": 0.5})
            continue

        parsed = await _call_gradio_api(base, text, timeout=120.0)
        if parsed:
            results.append(parsed)
            print(f"  ✅ Text {i+1}/{len(texts)}: label={parsed['label']} score={parsed['score']:.3f}")
        else:
            results.append({"label": "unknown", "score": 0.0})
            print(f"  ❌ Text {i+1}/{len(texts)}: failed, marking unknown")

    harmful = sum(1 for r in results if r["label"] == "harmful")
    safe = sum(1 for r in results if r["label"] == "safe")
    unknown = sum(1 for r in results if r["label"] == "unknown")
    print(f"📊 Results: {harmful} harmful, {safe} safe, {unknown} unknown out of {len(texts)}")

    return results