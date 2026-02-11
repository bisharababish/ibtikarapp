"""
Example app.py for your Hugging Face Space: Bisharababish/arabert-toxic-classifier

Upload this to your Space (replace or merge with your current app.py) so that:
1. The Gradio Python client can call predict(text=..., api_name="/predict")
2. The API is properly exposed (fixes 405 "No form actions exist")

Requirements on the Space: gradio, transformers, torch, and your model files.
"""

import gradio as gr
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

# Load model once (use your model name)
MODEL_NAME = "Bisharababish/arabert-toxic-classifier"  # or local path
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
model.eval()

# Map label index to harmful/safe (check your model's id2label)
id2label = getattr(model.config, "id2label", {}) or {}
toxic_idx = 1
for i, name in id2label.items():
    if "toxic" in str(name).lower() or "1" in str(name):
        toxic_idx = int(i)
        break


def classify(text: str):
    """Single text -> dict with label and score. LABEL_0 = safe, LABEL_1 = harmful."""
    if not text or not text.strip():
        return {"label": "LABEL_0", "score": 0.0}
    enc = tokenizer(
        text.strip(),
        padding=True,
        truncation=True,
        max_length=128,
        return_tensors="pt",
    )
    with torch.no_grad():
        out = model(**enc)
        probs = out.logits.softmax(dim=-1).cpu()[0]
    toxic_prob = float(probs[toxic_idx])
    label = "LABEL_1" if toxic_prob >= 0.5 else "LABEL_0"
    return {"label": label, "score": toxic_prob}


# IMPORTANT: api_name="predict" exposes the function for the Gradio client and API
demo = gr.Interface(
    fn=classify,
    inputs=gr.Textbox(label="Text", placeholder="Enter text to classify..."),
    outputs=gr.JSON(label="Prediction"),
    title="AraBERT Toxic Classifier",
    description="Classify text as harmful or safe. LABEL_0 = safe, LABEL_1 = harmful.",
    api_name="predict",  # <-- This fixes "No form actions exist" / 405
)

if __name__ == "__main__":
    demo.launch()
