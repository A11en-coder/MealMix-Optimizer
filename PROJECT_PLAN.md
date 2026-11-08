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

React/TypeScript browser UI, a FastAPI Python server, RSOME modeling, and its Gurobi solver are the current choices. Allen selected RSOME and `grb_solver` based on his course experience. The browser collects inputs and renders results; the server validates the scenario, builds and solves the model, and returns a typed result. Persist scenarios only after the solve flow is verified. Keep solver logic independent of HTTP handling so it can be tested directly. The local Python project uses uv.

## Feature roadmap and status

| Order | Feature | Current cycle step | Status |
| --- | --- | --- | --- |
| 1 | Solve one predefined scenario and show a valid result | Step 7 — Verify, review, and consolidate | Model and endpoint implemented; Postman and browser quantity/margin paths reported working; error recovery confirmed; loading and resource display implemented; known-optimum pytest passed; final browser resource check pending |
| 2 | Edit weekly resource capacities | Step 7 — Verify, review, and consolidate | React form and validated FastAPI request implemented; solver uses entered capacities; backend tests and client lint/type checks pass; browser flow confirmed by Allen |
| 2b | Edit maximum demand for each meal | Step 7 — Verify, review, and consolidate | React form, validated request, and dynamic solver constraints implemented; seven backend tests and client lint/type checks pass; browser cases confirmed by Allen |
| 2c | Edit contribution margin for each meal | Step 7 — Verify, review, and consolidate | React form, validated request, and dynamic RSOME objective implemented; nine backend tests and client lint/type checks pass; browser check pending |
| 2d | Edit per-meal resource use; handle minimum orders and infeasible scenarios | Step 1 — Define the feature | Planned |
| 3 | Save and reopen scenarios | Step 1 — Define the feature | Planned |
| 4 | Review full app, usability, and one known-optimum test | Phase 5 | Planned |

## Checkpoints and next task

Phase 2 behavior brief drafted on 2026-11-07. Allen selected chicken, beef, and seafood meals and prep labour, cooking-line, and packaging-line minutes. On 2026-11-08, the illustrative model was solved by independent enumeration as recorded above. Allen then set up a FastAPI server with uv, wrote the RSOME/Gurobi model, connected `POST /api/optimize`, and reported the expected result in Postman. Code inspection confirms the route calls the solver and returns quantities, margin, and resource usage. Allen reports the React button displays the quantities and margin; he also confirmed the error clears after a failed request followed by a successful request. Loading feedback and resource display are implemented; the assistant fixed the resource shape and units. TypeScript and lint passed. Allen reports that `uv run python -m pytest` passes the known-optimum test; the test source checks 13/39/30 and $578. The assistant's direct local socket check was blocked by workspace permissions, so runtime behavior is user-reported. Feature 1 has no persistence (not applicable: the scenario is predefined). On 2026-11-08, the assistant implemented editable prep, cooking, and packaging capacities through the React form, FastAPI/Pydantic validation, and RSOME solver. Shared resource coefficients now drive both constraints and displayed usage. Allen confirmed the capacity flow in the browser. The assistant then implemented editable maximum demand for each meal through the same layers. Seven Python tests pass, as do client lint and type checks. The HTTP TestClient stalled in this workspace, so direct request-model and route tests were used. Next: browser check of default demand, seafood cap 10, and invalid demand; then define the next feature. Defer: remove unused Vite starter CSS during UI polish. Infeasible-scenario handling awaits user-editable minimum demand requirements.

2026-11-08 update: Allen confirmed the browser cases for default demand, seafood cap 10, and invalid demand. Next: define editable contribution margins, then design their request and result behavior before implementation.

2026-11-08 update: Editable nonnegative whole-dollar margins are implemented in React, FastAPI, and the RSOME objective. Nine backend tests pass, including seafood margin  -> 42 chicken, 40 beef, 0 seafood, ; client lint and TypeScript pass. Next: Allen checks defaults, seafood margin , and invalid margin in the browser. Per-meal time coefficients, minimum orders, and saved scenarios remain planned.
