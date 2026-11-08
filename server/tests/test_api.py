import pytest
from pydantic import ValidationError

from main import OptimizeRequest, optimize

DEFAULT_CAPACITIES = {"prep": 600, "cooking": 900, "packaging": 240}
DEFAULT_DEMAND = {"chicken": 50, "beef": 40, "seafood": 30}
DEFAULT_MINIMUM = {"chicken": 0, "beef": 0, "seafood": 0}
DEFAULT_MARGINS = {"chicken": 5, "beef": 7, "seafood": 8}
DEFAULT_RESOURCE_MINUTES = {
    "chicken": {"prep": 6, "cooking": 10, "packaging": 2},
    "beef": {"prep": 8, "cooking": 12, "packaging": 2},
    "seafood": {"prep": 7, "cooking": 8, "packaging": 3},
}


def test_requested_capacities_reach_solver_and_response():
    request = OptimizeRequest.model_validate(
        {
            "capacities": {**DEFAULT_CAPACITIES, "prep": 300},
            "maxDemand": DEFAULT_DEMAND,
            "minDemand": DEFAULT_MINIMUM,
            "margins": DEFAULT_MARGINS,
        }
    )
    result = optimize(request)
    assert result["quantities"] == {"chicken": 3, "beef": 9, "seafood": 30}
    assert result["totalMargin"] == 318
    assert result["resources"]["prep"] == {"used": 300, "available": 300}


def test_requested_demand_changes_the_best_mix():
    request = OptimizeRequest.model_validate(
        {
            "capacities": DEFAULT_CAPACITIES,
            "maxDemand": {**DEFAULT_DEMAND, "seafood": 10},
            "minDemand": DEFAULT_MINIMUM,
            "margins": DEFAULT_MARGINS,
        }
    )
    result = optimize(request)
    assert result["quantities"] == {"chicken": 34, "beef": 40, "seafood": 10}
    assert result["totalMargin"] == 530


def test_requested_margin_changes_the_best_mix():
    request = OptimizeRequest.model_validate(
        {
            "capacities": DEFAULT_CAPACITIES,
            "maxDemand": DEFAULT_DEMAND,
            "minDemand": DEFAULT_MINIMUM,
            "margins": {**DEFAULT_MARGINS, "seafood": 1},
        }
    )
    result = optimize(request)
    assert result["quantities"] == {"chicken": 42, "beef": 40, "seafood": 0}
    assert result["totalMargin"] == 490


def test_rejects_invalid_capacity():
    with pytest.raises(ValidationError):
        OptimizeRequest.model_validate(
            {
                "capacities": {**DEFAULT_CAPACITIES, "prep": -1},
                "maxDemand": DEFAULT_DEMAND,
                "minDemand": DEFAULT_MINIMUM,
                "margins": DEFAULT_MARGINS,
            }
        )


def test_rejects_fractional_capacity():
    with pytest.raises(ValidationError):
        OptimizeRequest.model_validate(
            {
                "capacities": {**DEFAULT_CAPACITIES, "prep": 600.5},
                "maxDemand": DEFAULT_DEMAND,
                "minDemand": DEFAULT_MINIMUM,
                "margins": DEFAULT_MARGINS,
            }
        )


def test_rejects_negative_demand():
    with pytest.raises(ValidationError):
        OptimizeRequest.model_validate(
            {
                "capacities": DEFAULT_CAPACITIES,
                "maxDemand": {**DEFAULT_DEMAND, "seafood": -1},
                "minDemand": DEFAULT_MINIMUM,
                "margins": DEFAULT_MARGINS,
            }
        )


def test_rejects_negative_margin():
    with pytest.raises(ValidationError):
        OptimizeRequest.model_validate(
            {
                "capacities": DEFAULT_CAPACITIES,
                "maxDemand": DEFAULT_DEMAND,
                "minDemand": DEFAULT_MINIMUM,
                "margins": {**DEFAULT_MARGINS, "seafood": -1},
            }
        )


def test_rejects_minimum_above_maximum():
    with pytest.raises(ValidationError, match="Beef minimum cannot exceed maximum demand"):
        OptimizeRequest.model_validate(
            {
                "capacities": DEFAULT_CAPACITIES,
                "maxDemand": DEFAULT_DEMAND,
                "minDemand": {**DEFAULT_MINIMUM, "beef": 41},
                "margins": DEFAULT_MARGINS,
            }
        )


def test_reports_infeasible_when_minimum_exceeds_capacity():
    request = OptimizeRequest.model_validate(
        {
            "capacities": {**DEFAULT_CAPACITIES, "prep": 0},
            "maxDemand": DEFAULT_DEMAND,
            "minDemand": {**DEFAULT_MINIMUM, "beef": 1},
            "margins": DEFAULT_MARGINS,
        }
    )

    result = optimize(request)

    assert result == {
        "status": "infeasible",
        "message": "No production plan meets the minimum orders within the available time.",
    }


def test_feasible_minimum_is_respected():
    request = OptimizeRequest.model_validate(
        {
            "capacities": DEFAULT_CAPACITIES,
            "maxDemand": DEFAULT_DEMAND,
            "minDemand": {**DEFAULT_MINIMUM, "chicken": 20},
            "margins": DEFAULT_MARGINS,
        }
    )

    result = optimize(request)

    assert result["status"] == "optimal"
    assert result["quantities"]["chicken"] >= 20
    assert result["resources"]["prep"]["used"] <= DEFAULT_CAPACITIES["prep"]


def test_resource_minutes_default_preserves_existing_requests():
    request = OptimizeRequest.model_validate(
        {
            "capacities": DEFAULT_CAPACITIES,
            "maxDemand": DEFAULT_DEMAND,
            "minDemand": DEFAULT_MINIMUM,
            "margins": DEFAULT_MARGINS,
        }
    )

    assert request.resourceMinutes.model_dump() == DEFAULT_RESOURCE_MINUTES


def test_accepts_custom_resource_minutes():
    request = OptimizeRequest.model_validate(
        {
            "capacities": DEFAULT_CAPACITIES,
            "maxDemand": DEFAULT_DEMAND,
            "minDemand": DEFAULT_MINIMUM,
            "margins": DEFAULT_MARGINS,
            "resourceMinutes": {
                **DEFAULT_RESOURCE_MINUTES,
                "chicken": {**DEFAULT_RESOURCE_MINUTES["chicken"], "prep": 12},
            },
        }
    )

    assert request.resourceMinutes.chicken.prep == 12


def test_custom_resource_minutes_change_plan_and_displayed_usage():
    request = OptimizeRequest.model_validate(
        {
            "capacities": DEFAULT_CAPACITIES,
            "maxDemand": DEFAULT_DEMAND,
            "minDemand": DEFAULT_MINIMUM,
            "margins": DEFAULT_MARGINS,
            "resourceMinutes": {
                **DEFAULT_RESOURCE_MINUTES,
                "chicken": {**DEFAULT_RESOURCE_MINUTES["chicken"], "prep": 12},
            },
        }
    )

    result = optimize(request)

    assert result["quantities"] == {"chicken": 5, "beef": 40, "seafood": 30}
    assert result["totalMargin"] == 545
    assert result["resources"]["prep"] == {"used": 590, "available": 600}
    assert result["resources"]["cooking"] == {"used": 770, "available": 900}
    assert result["resources"]["packaging"] == {"used": 180, "available": 240}


@pytest.mark.parametrize("invalid_prep", [-1, 1.5])
def test_rejects_invalid_resource_minutes(invalid_prep):
    with pytest.raises(ValidationError):
        OptimizeRequest.model_validate(
            {
                "capacities": DEFAULT_CAPACITIES,
                "maxDemand": DEFAULT_DEMAND,
                "minDemand": DEFAULT_MINIMUM,
                "margins": DEFAULT_MARGINS,
                "resourceMinutes": {
                    **DEFAULT_RESOURCE_MINUTES,
                    "chicken": {**DEFAULT_RESOURCE_MINUTES["chicken"], "prep": invalid_prep},
                },
            }
        )
