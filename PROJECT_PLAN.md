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

Independent exhaustive enumeration of all bounded integer combinations found a unique optimum of **13 chicken, 39 beef, 30 seafood**, total margin **$578**. Resource use: prep **600/600**, cooking **838/900**, packaging **194/240** minutes. This oracle is covered by a server test and was confirmed in the browser by Allen.

## Technical foundation — provisional

React/TypeScript browser UI, a FastAPI Python server, RSOME modeling, and its Gurobi solver are the current choices. Allen selected RSOME and `grb_solver` based on his course experience. The browser collects inputs and renders results; the server validates the scenario, builds and solves the model, and returns a typed result. Persist scenarios only after the solve flow is verified. Keep solver logic independent of HTTP handling so it can be tested directly. The local Python project uses uv.

## Feature roadmap and status

| Order | Feature | Current cycle step | Status |
| --- | --- | --- | --- |
| 1 | Solve one predefined scenario and show a valid result | Step 7 — Verify, review, and consolidate | Verified: Postman and browser flow, known-optimum test, error recovery, loading, and default quantities, margin, and all three resource-usage figures |
| 2 | Edit weekly resource capacities | Step 7 — Verify, review, and consolidate | React form and validated FastAPI request implemented; solver uses entered capacities; backend tests and client lint/type checks pass; browser flow confirmed by Allen |
| 2b | Edit maximum demand for each meal | Step 7 — Verify, review, and consolidate | React form, validated request, and dynamic solver constraints implemented; seven backend tests and client lint/type checks pass; browser cases confirmed by Allen |
| 2c | Edit contribution margin for each meal | Step 7 — Verify, review, and consolidate | Verified: React form, validated request, and dynamic RSOME objective; backend and client checks pass; Allen confirmed seafood margin $1 gives 42 chicken, 40 beef, 0 seafood, $490 in browser |
| 2d | Add minimum weekly orders and handle infeasible scenarios | Step 7 — Verify, review, and consolidate | Verified: 12 backend tests and client lint/type checks pass; Allen confirmed infeasible, minimum-over-maximum, and original-default-result browser cases |
| 2e | Edit per-meal resource use | Step 7 — Verify, review, and consolidate | Verified: nine React inputs and request payload, server validation, dynamic constraints, and response usage; 17 server tests and client lint/type checks pass; Allen confirmed changed-coefficient result and invalid-minute browser error |
| 3 | Save and reopen scenarios | Step 7 — Verify, review, and consolidate | Verified: client lint and build pass; Allen confirmed save/clear/refresh/reopen, duplicate-name rejection, and generation from restored inputs in browser |
| 4 | Review full app, usability, and one known-optimum test | Phase 5 | Complete locally: 17 server tests, client lint/build, and browser checks for defaults, edited inputs, validation, infeasibility, saved scenarios, and stale-result clearing |

## Checkpoints and next task

Phase 2 behavior brief drafted on 2026-11-07. Allen selected chicken, beef, and seafood meals and prep labour, cooking-line, and packaging-line minutes. On 2026-11-08, the illustrative model was solved by independent enumeration as recorded above. Allen then set up a FastAPI server with uv, wrote the RSOME/Gurobi model, connected `POST /api/optimize`, and reported the expected result in Postman. Code inspection confirms the route calls the solver and returns quantities, margin, and resource usage. Allen reports the React button displays the quantities and margin; he also confirmed the error clears after a failed request followed by a successful request. Loading feedback and resource display are implemented; the assistant fixed the resource shape and units. TypeScript and lint passed. Allen reports that `uv run python -m pytest` passes the known-optimum test; the test source checks 13/39/30 and $578. The assistant's direct local socket check was blocked by workspace permissions, so runtime behavior is user-reported. Feature 1 has no persistence (not applicable: the scenario is predefined). On 2026-11-08, the assistant implemented editable prep, cooking, and packaging capacities through the React form, FastAPI/Pydantic validation, and RSOME solver. Shared resource coefficients now drive both constraints and displayed usage. Allen confirmed the capacity flow in the browser. The assistant then implemented editable maximum demand for each meal through the same layers. Seven Python tests pass, as do client lint and type checks. The HTTP TestClient stalled in this workspace, so direct request-model and route tests were used. Next: browser check of default demand, seafood cap 10, and invalid demand; then define the next feature. Defer: remove unused Vite starter CSS during UI polish. Infeasible-scenario handling awaits user-editable minimum demand requirements.

2026-11-08 update: Allen confirmed the browser cases for default demand, seafood cap 10, and invalid demand. Next: define editable contribution margins, then design their request and result behavior before implementation.

2026-11-08 update: Editable nonnegative whole-dollar margins are implemented in React, FastAPI, and the RSOME objective. Nine backend tests pass, including seafood margin  -> 42 chicken, 40 beef, 0 seafood, ; client lint and TypeScript pass. Next: Allen checks defaults, seafood margin , and invalid margin in the browser. Per-meal time coefficients, minimum orders, and saved scenarios remain planned.

2026-11-09 update: Minimum weekly orders are now entered in the React form and sent as `minDemand`. Pydantic rejects negative or fractional minimums and minimums above maximum demand before the solver runs. The RSOME model applies the lower bounds. Gurobi runs with `DualReductions=0` so an infeasible model has a distinct status; the API returns `status: infeasible` with an explanation and no quantities. Twelve backend tests pass, including minimum-over-maximum rejection, a feasible minimum, and a capacity-driven infeasible scenario. Client lint and TypeScript checks pass. The RSOME warning in the infeasible test is expected because it warns whenever no optimum exists. Next: Allen checks the default plan, beef minimum 41 against maximum 40, and prep capacity 0 with beef minimum 1 in the browser. Editable per-meal resource use and saved scenarios remain planned.

2026-11-09 browser checkpoint: Allen verified that prep capacity 0 with beef minimum 1 displays the infeasible result without a meal plan. Next: check beef minimum 41 with maximum 40 in the browser, then restore defaults and confirm the original optimum.

2026-11-09 browser checkpoint: Allen confirmed that beef minimum 41 with maximum 40 displays an input error without a meal plan. Next: restore default capacities and zero minimums, then confirm the original 13 chicken, 39 beef, 30 seafood plan and $578 margin.

2026-11-09 browser checkpoint: Allen confirmed that the default inputs still return 13 chicken, 39 beef, 30 seafood and $578. Minimum-order feature is verified. Next feature: allow editing the nine per-meal resource-minute values, starting with behavior and acceptance criteria before changing the request or solver.

2026-11-09 update: Allen chose a `resourceMinutes` request object with chicken, beef, and seafood, each containing prep, cooking, and packaging minutes. The Pydantic request model now accepts and validates all nine values as nonnegative integers. The field defaults to the original coefficients so the existing React request remains valid during implementation. Sixteen server tests pass; pytest also reports the expected RSOME infeasible warning and a cache-write warning from the workspace permission boundary. The API currently validates custom minutes but the solver and displayed usage still use fixed coefficients. Next: pass the validated values into the solver and resource-use calculation, then test that a changed coefficient changes the actual recommendation and usage.

2026-11-09 update: The route passes all nine validated minute values to both `solve_sample` and `calculate_usage`, so constraints and displayed usage use the same inputs. The original constants remain the default for existing clients. A changed chicken prep value of 12 yields 5 chicken, 40 beef, 30 seafood, $545 margin, and 590 prep minutes, matching an independent enumeration. Seventeen server tests pass; the expected RSOME infeasible warning remains. Next: add nine controlled inputs to React and include `resourceMinutes` in the request, then check the changed-value result in the browser.

2026-11-09 update: React now displays nine labeled minute inputs grouped by meal, validates whole nonnegative numbers, and sends `resourceMinutes` to the API. Default values match the original model. Client lint and TypeScript checks pass. Next browser check: change chicken prep to 12 and confirm 5 chicken, 40 beef, 30 seafood, $545 margin, and 590/600 prep minutes; then confirm an invalid minute value is rejected before sending.

2026-11-09 update: Allen confirmed the changed chicken-prep browser result. At his request, the nine minute inputs were extracted into `ResourceMinutesFields`, with shared meal/resource key types in `mealTypes.ts`. `App` continues to own form state, validation, and API submission. Client lint and TypeScript checks pass after extraction. Next: recheck the changed-value result in the browser and confirm an invalid minute value is rejected, then consider another focused component extraction only if it improves readability.

2026-11-09 refactor checkpoint: Extracted maximum demand, minimum orders, and margins into one reusable `MealValueFields` component. The three sections retain their distinct headings and input IDs; `App` retains each section's state, validation, and request construction. Client lint and TypeScript checks pass. Next: verify in the browser that editing each section still changes the request and result, then complete the pending invalid-minute check before closing feature 2e.

2026-11-09 decision: Allen prefers the first working version in one `App.tsx` for now. The `MealValueFields` and `ResourceMinutesFields` extractions were reverted, and their source files and shared type file were removed. All current input fields, validation, API payloads, and result rendering remain in `App.tsx`; lint and TypeScript checks pass. Defer component splitting until a concrete maintenance need arises. Next: check the existing form in the browser and finish the invalid-minute case for feature 2e.

2026-11-09 browser checkpoint: Allen confirmed that a blank chicken prep minute input shows a validation error and no meal plan. Feature 2e is verified. Next: Step 1 for saving and reopening named scenarios locally; define what is saved and what happens when a scenario is reopened.

2026-11-09 saved-scenario feature: Allen specified local browser storage for capacities, maximum demand, minimum orders, margins, and per-meal minutes. A valid named save must clear the current form and show the scenario in a list that survives refresh. Reopening restores the inputs, then the planner can run optimization. Empty names, invalid inputs, and duplicate names are rejected; persistence to a server is not applicable to this local version. Implemented in `App.tsx` using a versioned localStorage key and shape checks when reading saved data. Storage-write failure leaves the current form intact and displays an error. Client lint and production build pass. Next: browser verification of save, clear, refresh, reopen, and duplicate-name rejection; then check the restored scenario's optimization result.

2026-11-09 browser checkpoint: Allen confirmed that saving a scenario clears the form, the saved item appears, and it survives refresh and reopens with its inputs. Next: try saving a second scenario with the same name and verify the duplicate error without losing the existing item; then generate a result from a reopened scenario.

2026-11-09 browser checkpoint: Allen confirmed that a duplicate scenario name is rejected while the original saved item remains available and current inputs remain intact. Next: reopen a known scenario and generate a meal plan to verify its stored inputs reach the solver and produce the expected result.

2026-11-09 browser checkpoint: Allen confirmed that a reopened scenario generates the expected meal plan from its restored inputs. Saved-scenario feature is verified. Phase 5 review began. First finding (must fix before completion): after generating a plan, editing any input leaves the old result visible while the form shows new values. In `App.tsx`, input change handlers update form state but do not invalidate `mealPlan` or the infeasible message.

2026-11-09 review fix: All five optimization input change handlers now call `invalidateResult`, clearing the old plan, infeasible state, and stale feedback. An input-version check also prevents a pending API response from displaying a result calculated before a user edit. Client lint and production build pass. Allen confirmed in the browser that editing an input hides the old result until a new solve. Full review reran the server suite: 17 tests pass with the expected RSOME infeasible warning. Next: complete the remaining browser checks for editable margins and default resource usage before closing the project. Defer: remove unused Vite starter CSS and improve placement of generic form errors during later UI polish; Allen prefers the first working version over further component splitting.

2026-11-09 browser checkpoint: Allen confirmed that changing seafood margin to $1 yields 42 chicken, 40 beef, 0 seafood and $490. Editable-margin feature is verified. Final review check: with all defaults restored, confirm quantities, total margin, and all three displayed resource-usage figures against the known optimum.

2026-11-09 completion: Allen confirmed the default plan of 13 chicken, 39 beef, 30 seafood, $578 margin, and resource usage of prep 600/600, cooking 838/900, and packaging 194/240 minutes. The local first version is complete. Server suite: 17 passed, with the expected RSOME warning for an infeasible model. Client lint and production build pass. Browser checks covered edited capacities, maximum demand, margins, per-meal minutes, minimum-order infeasibility, invalid inputs, save/clear/refresh/reopen, duplicate-name rejection, restored optimization, and stale-result clearing. Deferred: deploy, improve placement of generic form errors, remove unused starter CSS, optional saved-scenario management such as deletion, and component splitting when a concrete maintenance need appears. No shared accounts or real business data are in scope.
