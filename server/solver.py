from rsome import ro
from rsome import grb_solver as grb

# defines a function to solve the optimization problem using Gurobi
def solve_sample():
    # initialize the model
    model = ro.Model()

    # define decision variables
    meals = model.dvar(3, vtype = "I", name = "meals")

    # set the objective function to maximize the profit margin
    model.max(5 * meals[0] + 7 * meals[1] + 8 * meals[2])

    # add the constraints for preparation, cooking, and packaging time
    model.st(6 * meals[0] + 8 * meals[1] + 7 * meals[2] <= 600)   # prep
    model.st(10 * meals[0] + 12 * meals[1] + 8 * meals[2] <= 900) # cooking
    model.st(2 * meals[0] + 2 * meals[1] + 3 * meals[2] <= 240)   # packaging

    # add the constraints for the maximum number of meals that can be produced
    model.st(meals[0] <= 50)  # chicken
    model.st(meals[1] <= 40)  # beef
    model.st(meals[2] <= 30)  # seafood
    model.st(meals >= 0)

    # solve the model using Gurobi
    model.solve(grb)
    
    return meals.get(), model.get()

if __name__ == "__main__":
    print(solve_sample())