# MealMix Optimizer — project plan

## Purpose and scope

A production planner at a fictional Australian ready-meal factory chooses weekly quantities of chicken, beef, and seafood meals. The app recommends an integer production mix that maximizes total contribution margin while respecting ingredient, packaging, labour, production-line, and demand limits. Sample figures are fictional.

Target: a local, usable project within one week at 2–3 hours per day. Deployment is outside the initial scope.

## Main workflow and completion criteria

1. The planner reviews or edits product margins, per-unit prep labour minutes, cooking-line minutes, and packaging-line minutes, weekly capacities, and minimum/maximum demand.
2. The planner runs optimization and sees whole-number production quantities, expected margin, and resource use versus capacity.
3. Changing a capacity and rerunning produces a new result. If the inputs are invalid or no plan meets all minimums, the app explains why no recommendation is available.
4. A saved scenario can be reopened locally with its inputs intact.

Completion requires checking these flows in the browser and verifying the solution against a small case with a known optimum. Every displayed recommendation must satisfy the entered constraints.

## Learning goals

Translate user input into an integer linear model; handle infeasible solver results; expose Python optimization through an API; verify a business rule with a focused automated test; explain a numerical result to a nontechnical user.

## Rough screens

- **Scenario editor:** products and margins; resource use and capacity table; demand bounds; Run button; input errors.
- **Results:** quantities per meal, expected margin, capacity usage, and a clear infeasible or solver-failure state.
- **Saved scenarios:** list, reopen, and save inputs. Build after the core solve flow works.

## Rules and failure cases

- Quantities are nonnegative integers. Margins, capacities, and resource use must be finite and nonnegative; demand minimum cannot exceed maximum.
- A recommendation must obey every resource and demand constraint. Infeasible and failed solves must never appear as valid recommendations.
- First version has one local planner and fictional data; no shared accounts or real business records.
- Defer multi-week planning, perishability, supplier lead times, uncertainty, scheduling individual production lines, and deployment.

## Feature 1 — solve a predefined scenario (Step 1 defined)

- **Action and result:** The planner opens a sample scenario for chicken, beef, and seafood meals and runs optimization. The app shows whole-number quantities, total contribution margin, and use of prep labour, cooking-line, and packaging-line minutes against weekly capacity.
- **Acceptance:** The returned quantities satisfy all three resource limits and product demand bounds. The displayed margin equals the sum of each meal's quantity times its per-unit margin. The result persists on screen until rerun or page refresh; saving is a later feature.
- **Failure:** A solver error or infeasible scenario shows a clear non-result state, never invented quantities.
- **Access:** One local planner, no accounts or ownership rules in this feature.
- **Flow:** Run action → server validates predefined scenario and solves integer model → result returned → browser displays quantities and capacity use.
- **Dependency:** Choose a small numerical scenario with a known optimum before designing data and interfaces. No database is required for this first feature.

### Sample model and oracle

| Meal | Margin ($/meal) | Prep (min/meal) | Cooking (min/meal) | Packaging (min/meal) | Maximum demand |
| --- | ---: | ---: | ---: | ---: | ---: |
| Chicken | 5 | 6 | 10 | 2 | 50 |
| Beef | 7 | 8 | 12 | 2 | 40 |
| Seafood | 8 | 7 | 8 | 3 | 30 |

Weekly capacities: prep 600 minutes; cooking line 900 minutes; packaging line 240 minutes. Decision variables are nonnegative integers. Maximize `5c + 7b + 8s` under the three resource inequalities and demand limits.

Independent exhaustive enumeration of all bounded integer combinations found a unique optimum of **13 chicken, 39 beef, 30 seafood**, total margin **$578**. Resource use: prep **600/600**, cooking **838/900**, packaging **194/240** minutes. This is a planned test oracle, not evidence that application code exists.

## Technical foundation — provisional

React/TypeScript browser UI, Python API, and a Python integer-programming solver are candidates because the solver is the central learning goal. Choose the exact libraries and local persistence method after inspecting setup. The browser collects inputs and renders results; the server validates the scenario, builds and solves the model, and returns a typed result. Persist scenarios only after the solve flow is verified. Keep solver logic independent of HTTP handling so it can be tested directly.

## Feature roadmap and status

| Order | Feature | Current cycle step | Status |
| --- | --- | --- | --- |
| 1 | Solve one predefined scenario and show a valid result | Step 2 — Design the data and interfaces | Step 1 defined; numerical example pending |
| 2 | Edit scenario inputs and handle invalid/infeasible cases | Step 1 — Define the feature | Planned |
| 3 | Save and reopen scenarios | Step 1 — Define the feature | Planned |
| 4 | Review full app, usability, and one known-optimum test | Phase 5 | Planned |

## Checkpoints and next task

No application code or runtime checks yet. Phase 2 behavior brief drafted on 2026-11-07. Allen selected chicken, beef, and seafood meals and prep labour, cooking-line, and packaging-line minutes. On 2026-11-08, the illustrative model was solved by independent enumeration as recorded above. Next: design Feature 1's request/response and results UI, then inspect setup before choosing libraries.
