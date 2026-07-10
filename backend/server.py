# Stub — this project is fully static (index.html at /app). Backend not used.
from fastapi import FastAPI
app = FastAPI()
@app.get("/api/health")
def health(): return {"ok": True}
