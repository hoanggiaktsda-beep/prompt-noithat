# HOANGGIA AI Image Pipeline Backend

Real pipeline:
1. Target + Reference ingestion
2. Vision analysis
3. Six-layer transfer plan
4. Controlled image edit
5. Geometry verification

## Run

npm install
cp .env.example .env
# add OPENAI_API_KEY
npm run dev

POST /api/sync as multipart/form-data:
- target: image
- reference: image
- state: JSON string

The API key stays server-side. Never place it in GitHub Pages frontend code.

The backend is provider-adaptable: the orchestration layer is independent from the UI, while the current adapter uses OpenAI vision + image generation/editing.
