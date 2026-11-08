from fastapi import FastAPI
from pydantic import BaseModel, Field
from solver import solve_sample, calculate_usage

app = FastAPI()

class Capacities(BaseModel):
    prep: int = Field(ge=0, strict=True)
    cooking: int = Field(ge=0, strict=True)
    packaging: int = Field(ge=0, strict=True)


class OptimizeRequest(BaseModel):
    capacities: Capacities


@app.post("/api/optimize")
def optimize(request: OptimizeRequest):
    capacities = request.capacities
    quantities, total_margin = solve_sample(
        capacities.prep, capacities.cooking, capacities.packaging
    )
    chicken, beef, seafood = (int(round(value)) for value in quantities)
    usage = calculate_usage(chicken, beef, seafood)

    return {
        "status": "optimal",
        "quantities": {
            "chicken": chicken,
            "beef": beef,
            "seafood": seafood,
        },
        "totalMargin": float(total_margin),
        "resources": {
            "prep": {"used": usage["prepTime"], "available": capacities.prep},
            "cooking": {"used": usage["cookTime"], "available": capacities.cooking},
            "packaging": {"used": usage["packTime"], "available": capacities.packaging},
        },
    }


# health check endpoint
@app.get("/health")
def health():
    return {"status": "ok"}