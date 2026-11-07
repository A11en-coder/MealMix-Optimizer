from rsome import ro
from gurobipy import grb_solver as grb

# defines a function to solve the optimization problem using Gurobi
def solve_sample():
    model = ro.Model()
    meals = model.dvar(3, vtype = "I", name = "meals")


