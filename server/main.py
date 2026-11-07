from fastapi import FastAPI
from solver import solve_sample, calculate_usage

app = FastAPI()

# optimizer endpoint check
@app.post("/api/optimize")
def optimize():

    quantities, total_margin = solve_sample()
    chicken, beef, seafood = (int(round(value)) for value in quantities)
    usage = calculate_usage(chicken, beef, seafood)

    return {
        "status": "optimal",
        "quantities": {
            "chicken": chicken,
            "beef": beef,
            "seafood": seafood,
        },
        "totalMargin": total_margin,
        "resources": {
            "prep": {"used": usage["prepTime"], "available": 600},
            "cooking": {"used": usage["cookTime"], "available": 900},
            "packaging": {"used": usage["packTime"], "available": 240},
        },
    }


# health check endpoint
@app.get("/health")
def health():
    return {"status": "ok"}