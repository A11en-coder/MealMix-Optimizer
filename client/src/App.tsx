import { useState } from "react";
import "./App.css";

type ResourceUsage = {
  used: number;
  available: number;
};

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

  // create a function to fetch the meal plan data from the backend
  const fetchMealPlan = async () => {
    if (isLoading) return;
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/optimize", { method: "POST" });
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
      <button type="button" onClick={fetchMealPlan} disabled={isLoading}>
        {isLoading ? "Generating…" : "Generate Meal Plan"}
      </button>

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
