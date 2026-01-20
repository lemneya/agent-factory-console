from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import runs

app = FastAPI(title="AFC Adapter Host", version="0.1.0")

# Local-dev only
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "service": "AFC Adapter Host"}

app.include_router(runs.router, prefix="/runs", tags=["runs"])
