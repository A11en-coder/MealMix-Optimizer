from fastapi import FastAPI
from pydantic import BaseModel, Field, model_validator
from solver import solve_sample, calculate_usage

app = FastAPI()

class Capacities(BaseModel):
    prep: int = Field(ge=0, strict=True)
    cooking: int = Field(ge=0, strict=True)
    packaging: int = Field(ge=0, strict=True)


class MaxDemand(BaseModel):
    chicken: int = Field(ge=0, strict=True)
    beef: int = Field(ge=0, strict=True)
    seafood: int = Field(ge=0, strict=True)


class MinDemand(BaseModel):
    chicken: int = Field(ge=0, strict=True)
    beef: int = Field(ge=0, strict=True)
    seafood: int = Field(ge=0, strict=True)


class Margins(BaseModel):
    chicken: int = Field(ge=0, strict=True)
    beef: int = Field(ge=0, strict=True)
    seafood: int = Field(ge=0, strict=True)


class OptimizeRequest(BaseModel):
    capacities: Capacities
    maxDemand: MaxDemand
    minDemand: MinDemand
    margins: Margins

    @model_validator(mode="after")
    def minimums_do_not_exceed_maximums(self):
        for meal in ("chicken", "beef", "seafood"):
            if getattr(self.minDemand, meal) > getattr(self.maxDemand, meal):
                raise ValueError(f"{meal.title()} minimum cannot exceed maximum demand.")
        return self


@app.post("/api/optimize")
def optimize(request: OptimizeRequest):
    capacities = request.capacities
    max_demand = request.maxDemand
    min_demand = request.minDemand
    margins = request.margins
    solution = solve_sample(
        capacities.prep,
        capacities.cooking,
        capacities.packaging,
        (max_demand.chicken, max_demand.beef, max_demand.seafood),
        (margins.chicken, margins.beef, margins.seafood),
        (min_demand.chicken, min_demand.beef, min_demand.seafood),
    )
    if solution is None:
        return {
            "status": "infeasible",
            "message": "No production plan meets the minimum orders within the available time.",
        }

    quantities, total_margin = solution
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
