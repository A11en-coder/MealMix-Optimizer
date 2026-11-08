import { useRef, useState, type FormEvent } from "react";
import "./App.css";

type ResourceUsage = {
  used: number;
  available: number;
};

type ResourceKey = "prep" | "cooking" | "packaging";
type MealKey = "chicken" | "beef" | "seafood";
type ResourceMinuteInputs = Record<MealKey, Record<ResourceKey, string>>;
const meals: MealKey[] = ["chicken", "beef", "seafood"];
const resources: ResourceKey[] = ["prep", "cooking", "packaging"];
const scenarioStorageKey = "mealmix.scenarios.v1";

type ScenarioInputs = {
  capacities: Record<ResourceKey, string>;
  maxDemand: Record<MealKey, string>;
  minDemand: Record<MealKey, string>;
  margins: Record<MealKey, string>;
  resourceMinutes: ResourceMinuteInputs;
};

type SavedScenario = {
  name: string;
  inputs: ScenarioInputs;
};

function hasStringFields(value: unknown, keys: string[]): boolean {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const fields = value as Record<string, unknown>;
  return keys.every((key) => typeof fields[key] === "string");
}

function isSavedScenario(value: unknown): value is SavedScenario {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const scenario = value as Record<string, unknown>;
  if (typeof scenario.name !== "string" || !scenario.name.trim()) return false;
  if (typeof scenario.inputs !== "object" || scenario.inputs === null || Array.isArray(scenario.inputs)) return false;
  const inputs = scenario.inputs as Record<string, unknown>;
  if (!hasStringFields(inputs.capacities, resources)) return false;
  if (!hasStringFields(inputs.maxDemand, meals)) return false;
  if (!hasStringFields(inputs.minDemand, meals)) return false;
  if (!hasStringFields(inputs.margins, meals)) return false;
  if (typeof inputs.resourceMinutes !== "object" || inputs.resourceMinutes === null || Array.isArray(inputs.resourceMinutes)) return false;
  const minuteInputs = inputs.resourceMinutes as Record<string, unknown>;
  return meals.every((meal) => hasStringFields(minuteInputs[meal], resources));
}

function readSavedScenarios(): SavedScenario[] {
  try {
    const stored = window.localStorage.getItem(scenarioStorageKey);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter(isSavedScenario) : [];
  } catch {
    return [];
  }
}

function App() {
  // define the meal plan data structure
  type MealPlan = {
    status: "optimal";
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
  const [infeasibleMessage, setInfeasibleMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>(readSavedScenarios);
  const [scenarioMessage, setScenarioMessage] = useState<string | null>(null);
  const inputVersion = useRef(0);
  const [capacityInputs, setCapacityInputs] = useState<Record<ResourceKey, string>>({
    prep: "600",
    cooking: "900",
    packaging: "240",
  });
  const [demandInputs, setDemandInputs] = useState<Record<MealKey, string>>({
    chicken: "50",
    beef: "40",
    seafood: "30",
  });
  const [minimumInputs, setMinimumInputs] = useState<Record<MealKey, string>>({
    chicken: "0",
    beef: "0",
    seafood: "0",
  });
  const [marginInputs, setMarginInputs] = useState<Record<MealKey, string>>({
    chicken: "5",
    beef: "7",
    seafood: "8",
  });
  const [resourceMinuteInputs, setResourceMinuteInputs] = useState<ResourceMinuteInputs>({
    chicken: { prep: "6", cooking: "10", packaging: "2" },
    beef: { prep: "8", cooking: "12", packaging: "2" },
    seafood: { prep: "7", cooking: "8", packaging: "3" },
  });

  const invalidateResult = () => {
    inputVersion.current += 1;
    setMealPlan(null);
    setInfeasibleMessage(null);
    setError(null);
    setScenarioMessage(null);
  };

  const updateCapacity = (key: ResourceKey, value: string) => {
    invalidateResult();
    setCapacityInputs((current) => ({ ...current, [key]: value }));
  };
  const updateDemand = (key: MealKey, value: string) => {
    invalidateResult();
    setDemandInputs((current) => ({ ...current, [key]: value }));
  };
  const updateMinimum = (key: MealKey, value: string) => {
    invalidateResult();
    setMinimumInputs((current) => ({ ...current, [key]: value }));
  };
  const updateMargin = (key: MealKey, value: string) => {
    invalidateResult();
    setMarginInputs((current) => ({ ...current, [key]: value }));
  };
  const updateResourceMinute = (meal: MealKey, resource: ResourceKey, value: string) => {
    invalidateResult();
    setResourceMinuteInputs((current) => ({
      ...current,
      [meal]: { ...current[meal], [resource]: value },
    }));
  };

  const getInputError = (): string | null => {
    const values = [
      ...Object.values(capacityInputs),
      ...Object.values(demandInputs),
      ...Object.values(minimumInputs),
      ...Object.values(marginInputs),
      ...Object.values(resourceMinuteInputs).flatMap((minuteInputs) => Object.values(minuteInputs)),
    ];
    if (values.some((value) => !/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)))) {
      return "Enter a nonnegative whole number for every capacity, order limit, margin, and minute value.";
    }
    if (meals.some((meal) => Number(minimumInputs[meal]) > Number(demandInputs[meal]))) {
      return "A minimum order cannot exceed that meal's maximum demand.";
    }
    return null;
  };

  const saveScenario = () => {
    if (isLoading) return;
    setError(null);
    setScenarioMessage(null);
    const name = scenarioName.trim();
    if (!name) {
      setError("Enter a scenario name before saving.");
      return;
    }
    const inputError = getInputError();
    if (inputError) {
      setMealPlan(null);
      setError(inputError);
      return;
    }
    if (savedScenarios.some((scenario) => scenario.name.toLowerCase() === name.toLowerCase())) {
      setError("A scenario with that name already exists.");
      return;
    }

    const nextScenarios = [
      ...savedScenarios,
      {
        name,
        inputs: {
          capacities: { ...capacityInputs },
          maxDemand: { ...demandInputs },
          minDemand: { ...minimumInputs },
          margins: { ...marginInputs },
          resourceMinutes: {
            chicken: { ...resourceMinuteInputs.chicken },
            beef: { ...resourceMinuteInputs.beef },
            seafood: { ...resourceMinuteInputs.seafood },
          },
        },
      },
    ];
    try {
      window.localStorage.setItem(scenarioStorageKey, JSON.stringify(nextScenarios));
    } catch {
      setError("Could not save this scenario in the browser. Please check browser storage settings.");
      return;
    }

    setSavedScenarios(nextScenarios);
    setScenarioName("");
    setCapacityInputs({ prep: "", cooking: "", packaging: "" });
    setDemandInputs({ chicken: "", beef: "", seafood: "" });
    setMinimumInputs({ chicken: "", beef: "", seafood: "" });
    setMarginInputs({ chicken: "", beef: "", seafood: "" });
    setResourceMinuteInputs({
      chicken: { prep: "", cooking: "", packaging: "" },
      beef: { prep: "", cooking: "", packaging: "" },
      seafood: { prep: "", cooking: "", packaging: "" },
    });
    setMealPlan(null);
    setInfeasibleMessage(null);
    setScenarioMessage(`Saved ${name}. The form is ready for a new scenario.`);
  };

  const openScenario = (scenario: SavedScenario) => {
    setCapacityInputs({ ...scenario.inputs.capacities });
    setDemandInputs({ ...scenario.inputs.maxDemand });
    setMinimumInputs({ ...scenario.inputs.minDemand });
    setMarginInputs({ ...scenario.inputs.margins });
    setResourceMinuteInputs({
      chicken: { ...scenario.inputs.resourceMinutes.chicken },
      beef: { ...scenario.inputs.resourceMinutes.beef },
      seafood: { ...scenario.inputs.resourceMinutes.seafood },
    });
    setScenarioName("");
    setMealPlan(null);
    setInfeasibleMessage(null);
    setError(null);
    setScenarioMessage(`Opened ${scenario.name}. Generate a meal plan to see its result.`);
  };

  // create a function to fetch the meal plan data from the backend
  const fetchMealPlan = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;
    setError(null);
    setScenarioMessage(null);
    setInfeasibleMessage(null);
    const inputError = getInputError();
    if (inputError) {
      setMealPlan(null);
      setError(inputError);
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
    const minDemand = {
      chicken: Number(minimumInputs.chicken),
      beef: Number(minimumInputs.beef),
      seafood: Number(minimumInputs.seafood),
    };
    const margins = {
      chicken: Number(marginInputs.chicken),
      beef: Number(marginInputs.beef),
      seafood: Number(marginInputs.seafood),
    };
    const minutesFor = (meal: MealKey) => ({
      prep: Number(resourceMinuteInputs[meal].prep),
      cooking: Number(resourceMinuteInputs[meal].cooking),
      packaging: Number(resourceMinuteInputs[meal].packaging),
    });
    const resourceMinutes = {
      chicken: minutesFor("chicken"),
      beef: minutesFor("beef"),
      seafood: minutesFor("seafood"),
    };
    setMealPlan(null);
    setIsLoading(true);
    const requestInputVersion = inputVersion.current;
    try {
      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capacities, maxDemand, minDemand, margins, resourceMinutes }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = (await response.json()) as
        | MealPlan
        | { status: "infeasible"; message: string };
      if (inputVersion.current !== requestInputVersion) return;
      if (data.status === "infeasible") {
        setInfeasibleMessage(data.message);
      } else {
        setMealPlan(data);
      }
    } catch (error) {
      if (inputVersion.current === requestInputVersion) {
        setMealPlan(null);
        setError("Failed to fetch meal plan. Please try again.");
        console.error("Error fetching meal plan:", error);
      }
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
          {meals.map((meal) => (
            <div key={meal}>
              <label htmlFor={`${meal}-demand`}>
                {meal[0].toUpperCase() + meal.slice(1)}
              </label>
              <input
                id={`${meal}-demand`}
                type="number"
                min="0"
                step="1"
                value={demandInputs[meal]}
                onChange={(event) => updateDemand(meal, event.target.value)}
              />
            </div>
          ))}
        </fieldset>
        <fieldset>
          <legend>Minimum weekly orders (meals)</legend>
          {meals.map((meal) => (
            <div key={meal}>
              <label htmlFor={`${meal}-minimum`}>
                {meal[0].toUpperCase() + meal.slice(1)}
              </label>
              <input
                id={`${meal}-minimum`}
                type="number"
                min="0"
                step="1"
                value={minimumInputs[meal]}
                onChange={(event) => updateMinimum(meal, event.target.value)}
              />
            </div>
          ))}
        </fieldset>
        <fieldset>
          <legend>Contribution margin per meal ($)</legend>
          {meals.map((meal) => (
            <div key={meal}>
              <label htmlFor={`${meal}-margin`}>
                {meal[0].toUpperCase() + meal.slice(1)}
              </label>
              <input
                id={`${meal}-margin`}
                type="number"
                min="0"
                step="1"
                value={marginInputs[meal]}
                onChange={(event) => updateMargin(meal, event.target.value)}
              />
            </div>
          ))}
        </fieldset>
        <fieldset>
          <legend>Minutes needed for one meal</legend>
          <div className="resource-minute-groups">
            {meals.map((meal) => (
              <fieldset key={meal}>
                <legend>{meal[0].toUpperCase() + meal.slice(1)}</legend>
                {resources.map((resource) => (
                  <div key={resource}>
                    <label htmlFor={`${meal}-${resource}-minutes`}>
                      {resource === "prep" ? "Prep labour" : resource === "cooking" ? "Cooking line" : "Packaging line"}
                    </label>
                    <input
                      id={`${meal}-${resource}-minutes`}
                      type="number"
                      min="0"
                      step="1"
                      value={resourceMinuteInputs[meal][resource]}
                      onChange={(event) => updateResourceMinute(meal, resource, event.target.value)}
                    />
                  </div>
                ))}
              </fieldset>
            ))}
          </div>
        </fieldset>
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Generating…" : "Generate Meal Plan"}
        </button>
      </form>

      <section aria-labelledby="save-scenario-heading">
        <h2 id="save-scenario-heading">Save scenario</h2>
        <label htmlFor="scenario-name">Scenario name</label>
        <input
          id="scenario-name"
          type="text"
          maxLength={60}
          value={scenarioName}
          onChange={(event) => setScenarioName(event.target.value)}
        />
        <button type="button" onClick={saveScenario} disabled={isLoading}>
          Save scenario
        </button>
      </section>

      <section aria-labelledby="saved-scenarios-heading">
        <h2 id="saved-scenarios-heading">Saved scenarios</h2>
        {savedScenarios.length === 0 ? (
          <p>No scenarios saved yet.</p>
        ) : (
          <ul>
            {savedScenarios.map((scenario) => (
              <li key={scenario.name}>
                <button type="button" onClick={() => openScenario(scenario)} disabled={isLoading}>
                  Open {scenario.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {scenarioMessage && <p role="status">{scenarioMessage}</p>}

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
      {infeasibleMessage && (
        <section role="status">
          <h2>No feasible plan</h2>
          <p>{infeasibleMessage}</p>
        </section>
      )}
      {error && <p role="alert">{error}</p>}
    </>
  );
}

export default App;
