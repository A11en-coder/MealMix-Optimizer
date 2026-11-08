import { useState, type FormEvent } from "react";
import "./App.css";

type ResourceUsage = {
  used: number;
  available: number;
};

type CapacityKey = "prep" | "cooking" | "packaging";

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

  const updateCapacity = (key: CapacityKey, value: string) => {
    setCapacityInputs((current) => ({ ...current, [key]: value }));
  };

  // create a function to fetch the meal plan data from the backend
  const fetchMealPlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;
    setError(null);
    const values = Object.values(capacityInputs);
    if (values.some((value) => !/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)))) {
      setMealPlan(null);
      setError("Enter a nonnegative whole number of minutes for each capacity.");
      return;
    }

    const capacities = {
      prep: Number(capacityInputs.prep),
      cooking: Number(capacityInputs.cooking),
      packaging: Number(capacityInputs.packaging),
    };
    setMealPlan(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capacities }),
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
