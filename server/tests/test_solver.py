from solver import solve_sample
from math import isclose

def test_sample_optimum():
    quantities, margin = solve_sample()
    assert [int(round(value)) for value in quantities] == [13, 39, 30]
    assert isclose(float(margin), 578, abs_tol=1e-6)


def test_lower_prep_capacity_changes_the_best_mix():
    quantities, margin = solve_sample(prep_capacity=300)
    assert [int(round(value)) for value in quantities] == [3, 9, 30]
    assert isclose(float(margin), 318, abs_tol=1e-6)
