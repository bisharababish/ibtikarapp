# Render build: ensure gradio-client is installed

**Current setup (no change needed):**  
Build: `pip install -r requirements-prod.txt`  
Start: `sh -c "cd /opt/render/project/src && ... uvicorn server.backend.api.main:app ..."`

`requirements-prod.txt` at repo root now includes **gradio-client>=0.15.0**, so the next deploy will install it and the HF toxicity API can use the Gradio client.

If you ever see **gradio-client** missing from "Successfully installed", either redeploy (clear build cache) or add this to Build Command: `pip install -r requirements-prod.txt && pip install gradio-client`.
