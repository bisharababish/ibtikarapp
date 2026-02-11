#!/usr/bin/env bash
# Render build: install deps and ensure gradio-client is present for HF toxicity API.
set -e
if [ -f server/requirements.txt ]; then
  pip install -r server/requirements.txt
else
  pip install -r requirements.txt
fi
pip install "gradio-client>=0.15.0"
