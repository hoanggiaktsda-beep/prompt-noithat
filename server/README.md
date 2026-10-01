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


## Spatial Blueprint Geometry Guard
Before generation, HOANGGIA AI extracts wall/opening/ceiling/floor/furniture/camera geometry into a normalized Spatial Blueprint. The blueprint becomes an immutable Geometry Contract. After generation, the result is checked against that contract; structural drift can trigger a geometry-only repair pass.
