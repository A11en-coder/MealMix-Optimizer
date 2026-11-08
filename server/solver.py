from rsome import ro
from rsome import grb_solver as grb
from gurobipy import GRB

MARGINS = (5, 7, 8)
PREP_MINUTES = (6, 8, 7)
COOKING_MINUTES = (10, 12, 8)
PACKAGING_MINUTES = (2, 2, 3)
MAX_DEMAND = (50, 40, 30)

# defines a function to solve the optimization problem using Gurobi
def solve_sample(
    prep_capacity=600,
    cooking_capacity=900,
    packaging_capacity=240,
    max_demand=MAX_DEMAND,
    margins=MARGINS,
    min_demand=(0, 0, 0),
):
    # initialize the model
    model = ro.Model()

    # define decision variables
    meals = model.dvar(3, vtype = "I", name = "meals")

    # set the objective function to maximize the profit margin
    model.max(sum(margins[i] * meals[i] for i in range(3)))

    # add the constraints for preparation, cooking, and packaging time
    model.st(sum(PREP_MINUTES[i] * meals[i] for i in range(3)) <= prep_capacity)
    model.st(sum(COOKING_MINUTES[i] * meals[i] for i in range(3)) <= cooking_capacity)
    model.st(sum(PACKAGING_MINUTES[i] * meals[i] for i in range(3)) <= packaging_capacity)

    # add the constraints for the maximum number of meals that can be produced
    model.st(meals[0] <= max_demand[0])  # chicken
    model.st(meals[1] <= max_demand[1])  # beef
    model.st(meals[2] <= max_demand[2])  # seafood
    model.st(meals[0] >= min_demand[0])  # chicken
    model.st(meals[1] >= min_demand[1])  # beef
    model.st(meals[2] >= min_demand[2])  # seafood
    model.st(meals >= 0)

    # solve the model using Gurobi
    model.solve(grb, display=False, params={"DualReductions": 0})
    if model.solution is None:
        raise RuntimeError("The solver did not return a result.")
    if model.solution.status == GRB.INFEASIBLE:
        return None
    if model.solution.status != GRB.OPTIMAL:
        raise RuntimeError(f"The solver stopped with status {model.solution.status}.")

    return meals.get(), model.get()

def calculate_usage(chicken, beef, seafood):
    # calculate the total preparation, cooking, and packaging time used
    quantities = (chicken, beef, seafood)
    prep_time = sum(PREP_MINUTES[i] * quantities[i] for i in range(3))
    cook_time = sum(COOKING_MINUTES[i] * quantities[i] for i in range(3))
    pack_time = sum(PACKAGING_MINUTES[i] * quantities[i] for i in range(3))

    return {
        "prepTime": prep_time,
        "cookTime": cook_time,
        "packTime": pack_time,
    }

if __name__ == "__main__":
    print(calculate_usage(13, 39, 30))
    print(solve_sample())
