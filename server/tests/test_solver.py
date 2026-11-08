from solver import solve_sample
from math import isclose

def test_sample_optimum():
    quantities, margin = solve_sample()
    # Add assertions for the quantities and margin here.
    assert [int(round(value)) for value in quantities] == [13, 39, 30]
    assert isclose(float(margin), 578, abs_tol=1e-6)