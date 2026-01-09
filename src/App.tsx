import { useState, useMemo, useEffect } from "react";
import {
  calculateAllScenarios,
  formatCurrency,
  formatDuration,
  type CalculatorInputs,
  type ScenarioResult,
} from "./utils/mortgageCalculator";
import "./App.css";

function ScenarioSummary({
  scenarios,
  inputs,
}: {
  scenarios: ScenarioResult[];
  inputs: CalculatorInputs;
}) {
  const extraNoRefi = scenarios[1];
  const refiNoExtraAfter = scenarios[2];
  const refiWithExtraAfter = scenarios[3];

  const years = Math.floor(inputs.loanTermMonths / 12);
  const refiYears = Math.floor(inputs.refiTermMonths / 12);

  return (
    <div style={{ lineHeight: "1.6" }}>
      <p>
        If you have a {years}-year loan of {formatCurrency(inputs.loanAmount)}{" "}
        at {inputs.interestRate}% and plan to pay{" "}
        {formatCurrency(inputs.extraPayment)} extra each month, here's how
        refinancing looks:
      </p>

      <p>
        <strong>If you refinance after {inputs.refiAfterMonths} months</strong>{" "}
        to a {refiYears}-year term at {inputs.refiRate}% and{" "}
        <strong>stop the extra payments</strong> (Scenario 3): It will cost you{" "}
        {formatCurrency(refiNoExtraAfter.totalPaid)} total, where you're paying{" "}
        {formatCurrency(refiNoExtraAfter.totalInterest)} in interest. Your total
        monthly payment drops to{" "}
        {formatCurrency(refiNoExtraAfter.monthlyPayment)}, but you'll be paying
        for {formatDuration(refiNoExtraAfter.durationMonths)} instead of{" "}
        {formatDuration(extraNoRefi.durationMonths)}. Compared to staying
        aggressive without refi, you'd pay about{" "}
        {formatCurrency(refiNoExtraAfter.totalPaid - extraNoRefi.totalPaid)}{" "}
        more total and take{" "}
        {formatDuration(
          refiNoExtraAfter.durationMonths - extraNoRefi.durationMonths
        )}{" "}
        longer to pay off.
      </p>

      <p>
        <strong>
          If you refinance and keep paying{" "}
          {formatCurrency(inputs.extraPaymentAfterRefi)} extra per month
        </strong>{" "}
        (Scenario 4): It will cost you{" "}
        {formatCurrency(refiWithExtraAfter.totalPaid)} total, where you're
        paying {formatCurrency(refiWithExtraAfter.totalInterest)} in interest.
        Your total monthly payment is{" "}
        {formatCurrency(
          refiWithExtraAfter.refiMonthlyPayment! + inputs.extraPaymentAfterRefi
        )}{" "}
        ({formatCurrency(refiWithExtraAfter.refiMonthlyPayment!)} P&I +{" "}
        {formatCurrency(inputs.extraPaymentAfterRefi)} extra). Compared to
        Scenario 2, you pay about{" "}
        {formatCurrency(refiWithExtraAfter.totalPaid - extraNoRefi.totalPaid)}{" "}
        more total and take{" "}
        {formatDuration(
          Math.abs(
            refiWithExtraAfter.durationMonths - extraNoRefi.durationMonths
          )
        )}{" "}
        {refiWithExtraAfter.durationMonths > extraNoRefi.durationMonths
          ? "longer"
          : "less"}{" "}
        to pay off.
      </p>

      <p>
        <strong>Bottom line:</strong> If you can keep paying extra after refi,
        Scenario 4 gets you close to Scenario 2's total cost. If you want to
        make total interest payment lower, consider taking refi with a shorter
        term since it might also give you a better rate, but the key is keeping
        those extra payments going after refi—stopping them costs significantly
        more.
      </p>
    </div>
  );
}

function ScenarioCard({
  scenario,
  index,
}: {
  scenario: ScenarioResult;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const isRefiScenario = scenario.refiMonthlyPayment !== undefined;

  return (
    <div className="scenario-card">
      <div className="scenario-number">{index + 1})</div>
      <div className="scenario-content">
        <h3>{scenario.name}:</h3>
        <div className="scenario-stats">
          <div className="stat">
            <span className="stat-label">Total paid:</span>
            <span className="stat-value">
              {formatCurrency(scenario.totalPaid)} (
              {formatCurrency(scenario.totalInterest)} int)
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Duration:</span>
            <span className="stat-value duration">
              {formatDuration(scenario.durationMonths)}
            </span>
          </div>
        </div>

        <button
          className="show-more-btn"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>

        {expanded && (
          <div className="expanded-details">
            {isRefiScenario ? (
              <>
                <div className="stat">
                  <span className="stat-label">Monthly P&I:</span>
                  <span className="stat-value">
                    {formatCurrency(scenario.refiMonthlyPayment!)}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Total payment:</span>
                  <span className="stat-value">
                    {formatCurrency(
                      scenario.refiMonthlyPayment! +
                        (scenario.extraPaymentAfterRefi || 0)
                    )}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="stat">
                  <span className="stat-label">Monthly P&I:</span>
                  <span className="stat-value">
                    {formatCurrency(scenario.monthlyPayment)}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Total payment:</span>
                  <span className="stat-value">
                    {formatCurrency(
                      scenario.monthlyPayment + scenario.extraPayment
                    )}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const defaultInputs: CalculatorInputs = {
  loanAmount: 500000,
  interestRate: 6,
  loanTermMonths: 360,
  extraPayment: 1000,
  lumpSumAtStart: 0,
  refiAfterMonths: 60,
  refiTermMonths: 360,
  refiRate: 6,
  extraPaymentAfterRefi: 1000,
  lumpSumAfterRefi: 0,
};

function loadInputsFromQueryString(): CalculatorInputs {
  const params = new URLSearchParams(window.location.search);
  const inputs: Partial<CalculatorInputs> = {};

  // Parse each field from query string
  const loanAmount = params.get("loanAmount");
  if (loanAmount) inputs.loanAmount = parseFloat(loanAmount);

  const interestRate = params.get("interestRate");
  if (interestRate) inputs.interestRate = parseFloat(interestRate);

  const loanTermMonths = params.get("loanTermMonths");
  if (loanTermMonths) inputs.loanTermMonths = parseFloat(loanTermMonths);

  const extraPayment = params.get("extraPayment");
  if (extraPayment) inputs.extraPayment = parseFloat(extraPayment);

  const lumpSumAtStart = params.get("lumpSumAtStart");
  if (lumpSumAtStart) inputs.lumpSumAtStart = parseFloat(lumpSumAtStart);

  const refiAfterMonths = params.get("refiAfterMonths");
  if (refiAfterMonths) inputs.refiAfterMonths = parseFloat(refiAfterMonths);

  const refiTermMonths = params.get("refiTermMonths");
  if (refiTermMonths) inputs.refiTermMonths = parseFloat(refiTermMonths);

  const refiRate = params.get("refiRate");
  if (refiRate) inputs.refiRate = parseFloat(refiRate);

  const extraPaymentAfterRefi = params.get("extraPaymentAfterRefi");
  if (extraPaymentAfterRefi)
    inputs.extraPaymentAfterRefi = parseFloat(extraPaymentAfterRefi);

  const lumpSumAfterRefi = params.get("lumpSumAfterRefi");
  if (lumpSumAfterRefi) inputs.lumpSumAfterRefi = parseFloat(lumpSumAfterRefi);

  // Merge with defaults, only including valid parsed values
  return { ...defaultInputs, ...inputs };
}

function updateQueryString(inputs: CalculatorInputs): void {
  const params = new URLSearchParams();

  // Store all values in query string for easy sharing
  params.set("loanAmount", inputs.loanAmount.toString());
  params.set("interestRate", inputs.interestRate.toString());
  params.set("loanTermMonths", inputs.loanTermMonths.toString());
  params.set("extraPayment", inputs.extraPayment.toString());
  params.set("lumpSumAtStart", inputs.lumpSumAtStart.toString());
  params.set("refiAfterMonths", inputs.refiAfterMonths.toString());
  params.set("refiTermMonths", inputs.refiTermMonths.toString());
  params.set("refiRate", inputs.refiRate.toString());
  params.set("extraPaymentAfterRefi", inputs.extraPaymentAfterRefi.toString());
  params.set("lumpSumAfterRefi", inputs.lumpSumAfterRefi.toString());

  const newUrl =
    window.location.pathname + `?${params.toString()}` + window.location.hash;

  window.history.replaceState({}, "", newUrl);
}

function App() {
  const [inputs, setInputs] = useState<CalculatorInputs>(() =>
    loadInputsFromQueryString()
  );

  // Update query string whenever inputs change
  useEffect(() => {
    updateQueryString(inputs);
  }, [inputs]);

  const scenarios = useMemo(() => calculateAllScenarios(inputs), [inputs]);

  const handleInputChange =
    (field: keyof CalculatorInputs) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value) || 0;
      setInputs((prev) => ({ ...prev, [field]: value }));
    };

  return (
    <div className="container">
      <h1>Mortgage Scenario Calculator</h1>

      <div className="input-section">
        <h2>Loan Parameters</h2>
        <div className="input-grid">
          <div className="input-group">
            <label htmlFor="loanAmount">Loan Amount ($)</label>
            <input
              id="loanAmount"
              type="number"
              value={inputs.loanAmount}
              onChange={handleInputChange("loanAmount")}
              step="10000"
            />
          </div>

          <div className="input-group">
            <label htmlFor="loanTermMonths">Loan Term (months)</label>
            <input
              id="loanTermMonths"
              type="number"
              value={inputs.loanTermMonths}
              onChange={handleInputChange("loanTermMonths")}
              step="1"
            />
          </div>

          <div className="input-group">
            <label htmlFor="interestRate">Interest Rate (%)</label>
            <input
              id="interestRate"
              type="number"
              value={inputs.interestRate}
              onChange={handleInputChange("interestRate")}
              step="0.125"
            />
          </div>

          <div className="input-group">
            <label htmlFor="extraPayment">Extra Monthly Payment ($)</label>
            <input
              id="extraPayment"
              type="number"
              value={inputs.extraPayment}
              onChange={handleInputChange("extraPayment")}
              step="100"
            />
          </div>

          <div className="input-group">
            <label htmlFor="lumpSumAtStart">Lump Sum at Start ($)</label>
            <input
              id="lumpSumAtStart"
              type="number"
              value={inputs.lumpSumAtStart}
              onChange={handleInputChange("lumpSumAtStart")}
              step="1000"
            />
          </div>
        </div>

        <h2>Refinance Parameters</h2>
        <div className="input-grid">
          <div className="input-group">
            <label htmlFor="refiAfterMonths">Refi After (months)</label>
            <input
              id="refiAfterMonths"
              type="number"
              value={inputs.refiAfterMonths}
              onChange={handleInputChange("refiAfterMonths")}
              step="1"
            />
          </div>

          <div className="input-group">
            <label htmlFor="refiTermMonths">New Loan Term (months)</label>
            <input
              id="refiTermMonths"
              type="number"
              value={inputs.refiTermMonths}
              onChange={handleInputChange("refiTermMonths")}
              step="1"
            />
          </div>

          <div className="input-group">
            <label htmlFor="refiRate">New Interest Rate (%)</label>
            <input
              id="refiRate"
              type="number"
              value={inputs.refiRate}
              onChange={handleInputChange("refiRate")}
              step="0.125"
            />
          </div>

          <div className="input-group">
            <label htmlFor="extraPaymentAfterRefi">
              Extra Monthly Payment ($)
            </label>
            <input
              id="extraPaymentAfterRefi"
              type="number"
              value={inputs.extraPaymentAfterRefi}
              onChange={handleInputChange("extraPaymentAfterRefi")}
              step="100"
            />
          </div>

          <div className="input-group">
            <label htmlFor="lumpSumAfterRefi">Lump Sum After Refi ($)</label>
            <input
              id="lumpSumAfterRefi"
              type="number"
              value={inputs.lumpSumAfterRefi}
              onChange={handleInputChange("lumpSumAfterRefi")}
              step="1000"
            />
          </div>
        </div>
      </div>

      <div className="results-section">
        <h2>=== Mortgage Scenarios ({inputs.refiTermMonths}m ReFi) ===</h2>

        <div className="scenarios">
          {scenarios.map((scenario: ScenarioResult, index: number) => (
            <ScenarioCard key={index} scenario={scenario} index={index} />
          ))}
        </div>

        <div className="savings-summary">
          <h3>Summary</h3>
          <ScenarioSummary scenarios={scenarios} inputs={inputs} />
        </div>
      </div>
    </div>
  );
}

export default App;
