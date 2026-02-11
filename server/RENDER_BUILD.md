# Render build: ensure gradio-client is installed

If deployment logs show **gradio-client is not** in "Successfully installed", the HF toxicity API will fail.

**Fix in Render dashboard:**

1. Open your **Web Service** → **Settings**.
2. **Build Command:** use one of:
   - `pip install -r requirements.txt && pip install gradio-client`  
     (if Root Directory is `server`)
   - `pip install -r requirements.txt && pip install gradio-client`  
     (if Root Directory is repo root)
3. Save and **Manual Deploy** → **Clear build cache & deploy**.

Or set **Root Directory** to `server` and **Build Command** to:
`pip install -r requirements-render.txt`

Then redeploy.
