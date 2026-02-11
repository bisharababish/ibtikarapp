# Render build: ensure gradio-client is installed

If deployment logs show **gradio-client is not** in "Successfully installed", the HF toxicity API will fail.

**Fix in Render dashboard (do this once):**

1. Open your **Web Service** (ibtikar-backend) → **Settings**.
2. **Build Command** → set to exactly:
   ```bash
   chmod +x build.sh && ./build.sh
   ```
   (This runs the repo’s `build.sh`, which installs from `server/requirements.txt` then runs `pip install gradio-client`.)
3. Leave **Root Directory** as-is (blank or `.` for repo root).
4. Save → **Manual Deploy** → **Clear build cache & deploy**.

After the next deploy, the build log should list **gradio-client** in "Successfully installed".
