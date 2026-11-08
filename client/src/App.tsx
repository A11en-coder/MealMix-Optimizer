import { useState, type FormEvent } from "react";
import "./App.css";

type ResourceUsage = {
  used: number;
  available: number;
};

type CapacityKey = "prep" | "cooking" | "packaging";
type MealKey = "chicken" | "beef" | "seafood";

function App() {
  // define the meal plan data structure
  type MealPlan = {
    quantities: {
      chicken: number;
      beef: number;
      seafood: number;
    };
    totalMargin: number;
    resources: {
      prep: ResourceUsage;
      cooking: ResourceUsage;
      packaging: ResourceUsage;
    };
  };

  // create a state variable to hold the meal plan data
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [capacityInputs, setCapacityInputs] = useState<Record<CapacityKey, string>>({
    prep: "600",
    cooking: "900",
    packaging: "240",
  });
  const [demandInputs, setDemandInputs] = useState<Record<MealKey, string>>({
    chicken: "50",
    beef: "40",
    seafood: "30",
  });
  const [marginInputs, setMarginInputs] = useState<Record<MealKey, string>>({
    chicken: "5",
    beef: "7",
    seafood: "8",
  });

  const updateCapacity = (key: CapacityKey, value: string) => {
    setCapacityInputs((current) => ({ ...current, [key]: value }));
  };
  const updateDemand = (key: MealKey, value: string) => {
    setDemandInputs((current) => ({ ...current, [key]: value }));
  };
  const updateMargin = (key: MealKey, value: string) => {
    setMarginInputs((current) => ({ ...current, [key]: value }));
  };

  // create a function to fetch the meal plan data from the backend
  const fetchMealPlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;
    setError(null);
    const values = [
      ...Object.values(capacityInputs),
      ...Object.values(demandInputs),
      ...Object.values(marginInputs),
    ];
    if (values.some((value) => !/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)))) {
      setMealPlan(null);
      setError("Enter a nonnegative whole number for every capacity, demand limit, and margin.");
      return;
    }

    const capacities = {
      prep: Number(capacityInputs.prep),
      cooking: Number(capacityInputs.cooking),
      packaging: Number(capacityInputs.packaging),
    };
    const maxDemand = {
      chicken: Number(demandInputs.chicken),
      beef: Number(demandInputs.beef),
      seafood: Number(demandInputs.seafood),
    };
    const margins = {
      chicken: Number(marginInputs.chicken),
      beef: Number(marginInputs.beef),
      seafood: Number(marginInputs.seafood),
    };
    setMealPlan(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capacities, maxDemand, margins }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setMealPlan(data);
      console.log("Meal plan data:", data);
    } catch (error) {
      setMealPlan(null);
      setError("Failed to fetch meal plan. Please try again.");
      console.error("Error fetching meal plan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  


  return (
    <>
      <h1>MealMix Optimizer</h1>
      <form onSubmit={fetchMealPlan} noValidate>
        <label htmlFor="prep-capacity">Prep labour minutes</label>
        <input
          id="prep-capacity"
          type="number"
          min="0"
          step="1"
          value={capacityInputs.prep}
          onChange={(event) => updateCapacity("prep", event.target.value)}
        />
        <label htmlFor="cooking-capacity">Cooking-line minutes</label>
        <input
          id="cooking-capacity"
          type="number"
          min="0"
          step="1"
          value={capacityInputs.cooking}
          onChange={(event) => updateCapacity("cooking", event.target.value)}
        />
        <label htmlFor="packaging-capacity">Packaging-line minutes</label>
        <input
          id="packaging-capacity"
          type="number"
          min="0"
          step="1"
          value={capacityInputs.packaging}
          onChange={(event) => updateCapacity("packaging", event.target.value)}
        />
        <fieldset>
          <legend>Maximum weekly demand (meals)</legend>
          <label htmlFor="chicken-demand">Chicken</label>
          <input
            id="chicken-demand"
            type="number"
            min="0"
            step="1"
            value={demandInputs.chicken}
            onChange={(event) => updateDemand("chicken", event.target.value)}
          />
          <label htmlFor="beef-demand">Beef</label>
          <input
            id="beef-demand"
            type="number"
            min="0"
            step="1"
            value={demandInputs.beef}
            onChange={(event) => updateDemand("beef", event.target.value)}
          />
          <label htmlFor="seafood-demand">Seafood</label>
          <input
            id="seafood-demand"
            type="number"
            min="0"
            step="1"
            value={demandInputs.seafood}
            onChange={(event) => updateDemand("seafood", event.target.value)}
          />
        </fieldset>
        <fieldset>
          <legend>Contribution margin per meal ($)</legend>
          <label htmlFor="chicken-margin">Chicken</label>
          <input
            id="chicken-margin"
            type="number"
            min="0"
            step="1"
            value={marginInputs.chicken}
            onChange={(event) => updateMargin("chicken", event.target.value)}
          />
          <label htmlFor="beef-margin">Beef</label>
          <input
            id="beef-margin"
            type="number"
            min="0"
            step="1"
            value={marginInputs.beef}
            onChange={(event) => updateMargin("beef", event.target.value)}
          />
          <label htmlFor="seafood-margin">Seafood</label>
          <input
            id="seafood-margin"
            type="number"
            min="0"
            step="1"
            value={marginInputs.seafood}
            onChange={(event) => updateMargin("seafood", event.target.value)}
          />
        </fieldset>
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Generating…" : "Generate Meal Plan"}
        </button>
      </form>

      {mealPlan && (
        <div>
          <h2>Meal Plan</h2>
          <p>Chicken: {mealPlan.quantities.chicken} units</p>
          <p>Beef: {mealPlan.quantities.beef} units</p>
          <p>Seafood: {mealPlan.quantities.seafood} units</p>
          <p>Total Margin: ${mealPlan.totalMargin.toFixed(2)}</p>
          <h3>Resource Usage</h3>
          <p>Prep: {mealPlan.resources.prep.used} / {mealPlan.resources.prep.available} minutes</p>
          <p>Cooking: {mealPlan.resources.cooking.used} / {mealPlan.resources.cooking.available} minutes</p>
          <p>Packaging: {mealPlan.resources.packaging.used} / {mealPlan.resources.packaging.available} minutes</p>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
    </>
  );
}

export default App;
