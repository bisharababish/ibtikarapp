# Fix 405 "No form actions exist" on your Hugging Face Space

The logs show:
```text
[405] POST /api/predict
Error: POST method not allowed. No form actions exist for this page
```

**Cause:** The Gradio app on the Space is not exposing the predict function as an API.

**Fix (on the Space):**

1. Open your Space repo: **Bisharababish/arabert-toxic-classifier** on Hugging Face.
2. Edit **app.py** and ensure your Gradio Interface has **`api_name="predict"`**:

   ```python
   demo = gr.Interface(
       fn=your_classify_function,
       inputs=gr.Textbox(...),
       outputs=gr.JSON(...),  # or whatever you use
       api_name="predict",   # <-- required so /predict exists
   )
   demo.launch()
   ```

3. If you use **Blocks** instead of Interface, name the submit/button action:

   ```python
   submit_btn.click(fn=classify, inputs=..., outputs=..., api_name="predict")
   ```

4. Save and let the Space rebuild.

**Reference:** See `SPACE_APP_EXAMPLE.py` in this folder for a full minimal app that exposes `api_name="predict"`.

**If you already have `api_name="predict"`** (like in your current app) and still get 405, try enabling the API in `launch()`:

```python
iface.launch(
    server_name="0.0.0.0",
    server_port=7860,
    share=False,
    show_error=True,
    show_api=True,   # <-- add this to expose /api/predict for HTTP
)
```

**Backend:** The backend client now handles your Space’s response format `[{"label": "harmful"|"safe", "score": float}]` correctly.

**Note:** Your backend uses the **Gradio Python client** first (`client.predict(text=..., api_name="/predict")`), which may work even when HTTP POST to `/api/predict` returns 405. Fixing the Space as above makes both the client and direct HTTP work.
