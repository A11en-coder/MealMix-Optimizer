from fastapi import FastAPI
from pydantic import BaseModel, Field, model_validator
from solver import RESOURCE_MINUTES, solve_sample, calculate_usage

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


class MealResourceMinutes(BaseModel):
    prep: int = Field(ge=0, strict=True)
    cooking: int = Field(ge=0, strict=True)
    packaging: int = Field(ge=0, strict=True)


class ResourceMinutes(BaseModel):
    chicken: MealResourceMinutes
    beef: MealResourceMinutes
    seafood: MealResourceMinutes


def default_resource_minutes() -> ResourceMinutes:
    return ResourceMinutes.model_validate(
        {
            meal: dict(zip(("prep", "cooking", "packaging"), minutes))
            for meal, minutes in zip(("chicken", "beef", "seafood"), RESOURCE_MINUTES)
        }
    )


class OptimizeRequest(BaseModel):
    capacities: Capacities
    maxDemand: MaxDemand
    minDemand: MinDemand
    margins: Margins
    resourceMinutes: ResourceMinutes = Field(default_factory=default_resource_minutes)

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
    resource_minutes = tuple(
        (meal.prep, meal.cooking, meal.packaging)
        for meal in (
            request.resourceMinutes.chicken,
            request.resourceMinutes.beef,
            request.resourceMinutes.seafood,
        )
    )
    solution = solve_sample(
        capacities.prep,
        capacities.cooking,
        capacities.packaging,
        (max_demand.chicken, max_demand.beef, max_demand.seafood),
        (margins.chicken, margins.beef, margins.seafood),
        (min_demand.chicken, min_demand.beef, min_demand.seafood),
        resource_minutes,
    )
    if solution is None:
        return {
            "status": "infeasible",
            "message": "No production plan meets the minimum orders within the available time.",
        }

    quantities, total_margin = solution
    chicken, beef, seafood = (int(round(value)) for value in quantities)
    usage = calculate_usage(chicken, beef, seafood, resource_minutes)

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
