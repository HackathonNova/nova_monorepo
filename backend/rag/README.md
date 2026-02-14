# RAG Chatbot

## Configure Hugging Face

Create or update `backend/.env`:

```
HF_API_BASE=https://api-inference.huggingface.co
HF_API_TOKEN=your_token
HF_MODEL_ID=org/model
HF_TASK=text-generation
HF_MAX_TOKENS=512
HF_TEMPERATURE=0.2
HF_TOP_P=0.95
HF_TIMEOUT_S=30
```

To switch models, change `HF_MODEL_ID` and adjust the inference parameters.

## Initialize Ingestion

```
python -m rag.scripts.init_rag --env-file .env --docs path/to/documents
```

## Run Chatbot (CLI)

```
python -m rag.scripts.run_chatbot --env-file .env --docs path/to/documents --question "Your question"
```

## API Usage

Use `/rag/ingest` to load documents and `/rag/chat` to ask questions.
