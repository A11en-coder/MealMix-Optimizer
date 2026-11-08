import pytest
from pydantic import ValidationError

from main import OptimizeRequest, optimize

DEFAULT_CAPACITIES = {"prep": 600, "cooking": 900, "packaging": 240}
DEFAULT_DEMAND = {"chicken": 50, "beef": 40, "seafood": 30}
DEFAULT_MARGINS = {"chicken": 5, "beef": 7, "seafood": 8}


def test_requested_capacities_reach_solver_and_response():
    request = OptimizeRequest.model_validate(
        {
            "capacities": {**DEFAULT_CAPACITIES, "prep": 300},
            "maxDemand": DEFAULT_DEMAND,
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
                "margins": DEFAULT_MARGINS,
            }
        )


def test_rejects_fractional_capacity():
    with pytest.raises(ValidationError):
        OptimizeRequest.model_validate(
            {
                "capacities": {**DEFAULT_CAPACITIES, "prep": 600.5},
                "maxDemand": DEFAULT_DEMAND,
                "margins": DEFAULT_MARGINS,
            }
        )


def test_rejects_negative_demand():
    with pytest.raises(ValidationError):
        OptimizeRequest.model_validate(
            {
                "capacities": DEFAULT_CAPACITIES,
                "maxDemand": {**DEFAULT_DEMAND, "seafood": -1},
                "margins": DEFAULT_MARGINS,
            }
        )


def test_rejects_negative_margin():
    with pytest.raises(ValidationError):
        OptimizeRequest.model_validate(
            {
                "capacities": DEFAULT_CAPACITIES,
                "maxDemand": DEFAULT_DEMAND,
                "margins": {**DEFAULT_MARGINS, "seafood": -1},
            }
        )
