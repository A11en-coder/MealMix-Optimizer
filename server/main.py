from fastapi import FastAPI

app = FastAPI()

# optimizer endpoint check
@app.post("/api/optimize")
def optimize():
    return {
        "status": "optimal",
        "quantities": {
            "chicken": 13,
            "beef": 39,
            "seafood": 30,
        },
        "totalMargin": 578,
    }


# health check endpoint
@app.get("/health")
def health():
    return {"status": "ok"}