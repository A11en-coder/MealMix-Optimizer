import pytest
from pydantic import ValidationError

from main import OptimizeRequest, optimize


def test_requested_capacities_reach_solver_and_response():
    request = OptimizeRequest.model_validate(
        {"capacities": {"prep": 300, "cooking": 900, "packaging": 240}}
    )
    result = optimize(request)
    assert result["quantities"] == {"chicken": 3, "beef": 9, "seafood": 30}
    assert result["totalMargin"] == 318
    assert result["resources"]["prep"] == {"used": 300, "available": 300}


def test_rejects_invalid_capacity():
    with pytest.raises(ValidationError):
        OptimizeRequest.model_validate(
            {"capacities": {"prep": -1, "cooking": 900, "packaging": 240}}
        )


def test_rejects_fractional_capacity():
    with pytest.raises(ValidationError):
        OptimizeRequest.model_validate(
            {"capacities": {"prep": 600.5, "cooking": 900, "packaging": 240}}
        )
