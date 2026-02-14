import os
import requests
from dotenv import load_dotenv

# Load env directly to verify what the process sees
load_dotenv(".env")

api_token = os.getenv("HF_API_TOKEN")
api_base = os.getenv("HF_API_BASE")
model_id = os.getenv("HF_MODEL_ID")

print(f"--- Config Check ---")
print(f"Base: {api_base}")
print(f"Model: {model_id}")
print(f"Token: {api_token[:4]}...{api_token[-4:] if api_token else 'None'}")

# Override model ID to check a known working model
model_id = "microsoft/Phi-3-mini-4k-instruct"
url = f"https://router.huggingface.co/hf-inference/models/{model_id}/v1/chat/completions"

print(f"\nTarget URL: {url}")

headers = {"Authorization": f"Bearer {api_token}"}
payload = {
    "model": model_id,
    "messages": [{"role": "user", "content": "Status check."}],
    "max_tokens": 10
}

try:
    print("\nSending request...")
    response = requests.post(url, headers=headers, json=payload, timeout=10)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")