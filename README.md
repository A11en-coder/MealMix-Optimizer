# MealMix Optimizer

MealMix Optimizer is a local production planning app for a fictional ready-meal business. It recommends how many chicken, beef, and seafood meals to make in a week to maximize total contribution margin while staying within available prep labour, cooking-line, and packaging-line minutes.

## Why I built it

After studying linear, integer, and network optimization, I wanted to apply those ideas to a business decision that changes with real constraints. A meal factory may have demand for every product but limited staff and production-line time. Choosing the most profitable mix is more useful than simply producing the maximum possible amount of each meal. This project turns that decision into an integer optimization model and makes it usable through a browser.

The factory and figures are illustrative; this is a learning project, not a live production system.

## What it does

- Lets a planner edit weekly capacities, minimum orders, maximum demand, contribution margins, and the minutes each meal needs on each resource.
- Finds whole-number meal quantities that maximize total contribution margin under those limits.
- Shows the recommended quantities, total margin, and minutes used versus available for each resource.
- Explains when the entered minimum orders cannot fit within the available capacity, and rejects invalid inputs such as a minimum above its maximum demand.
- Saves named input scenarios in browser `localStorage`, then reopens them after a page refresh. Saving clears the current form; reopening restores the inputs so the planner can run a fresh optimization.

With the default example, the optimal plan is **13 chicken, 39 beef, and 30 seafood meals** for a **$578 contribution margin**. It uses **600/600 prep**, **838/900 cooking**, and **194/240 packaging** minutes.

## How the optimization works

The decision variables are the number of meals to make of each type. The objective is to maximize `sum(margin per meal × quantity)`. Constraints limit total minutes used on each resource and keep every meal quantity between its minimum order and maximum demand. Quantities must be nonnegative integers.

The Python server builds this model with RSOME and solves it with Gurobi. FastAPI validates the request and returns either an optimal plan or an infeasible result. The React and TypeScript client collects inputs and displays the response.

## Run locally

You need Python 3.13+, [uv](https://docs.astral.sh/uv/), Node.js with npm, and a working Gurobi setup for your environment.

In one terminal, start the API from the project root:

```bash
cd server
uv sync
uv run uvicorn main:app --reload
```

In a second terminal, start the client:

```bash
cd client
npm ci
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`). The client proxies `/api` requests to the API at `http://127.0.0.1:8000`.

## Checks

Run the Python tests from `server`:

```bash
uv run pytest
```

Run the client checks from `client`:

```bash
npm run lint
npm run build
```

The tests cover the default optimum, changed constraints and margins, input validation, and an infeasible scenario. Saved scenarios stay in the browser for the same site address; they are not shared between devices or stored on the server.
