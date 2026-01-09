import { useState, useMemo, useEffect } from "react";
import {
  calculateAllScenarios,
  calculateMonthlyPayment,
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
  const [expanded, setExpanded] = useState(false);
  const standard = scenarios[0];
  const extraNoRefi = scenarios[1];
  const refiNoExtraAfter = scenarios[2];
  const refiWithExtraAfter = scenarios[3];

  // Find the best scenario (lowest total paid)
  const bestScenario = scenarios.reduce((best, current) =>
    current.totalPaid < best.totalPaid ? current : best
  );
  const bestIndex = scenarios.findIndex((s) => s === bestScenario);

  const years = Math.floor(inputs.loanTermMonths / 12);

  // Format term - use months if it doesn't divide evenly by 12
  const formatTerm = (months: number) => {
    if (months % 12 === 0) {
      return `${months / 12}-year`;
    }
    return `${months}-month`;
  };

  // Calculate differences compared to Scenario 2 (no refi)
  const refiNoExtraDiff = refiNoExtraAfter.totalPaid - extraNoRefi.totalPaid;
  const refiWithExtraDiff =
    refiWithExtraAfter.totalPaid - extraNoRefi.totalPaid;
  const durationDiffNoExtra =
    refiNoExtraAfter.durationMonths - extraNoRefi.durationMonths;
  const durationDiffWithExtra =
    refiWithExtraAfter.durationMonths - extraNoRefi.durationMonths;

  // Calculate differences compared to Scenario 1 (standard)
  const refiNoExtraDiffVsStandard =
    refiNoExtraAfter.totalPaid - standard.totalPaid;
  const refiWithExtraDiffVsStandard =
    refiWithExtraAfter.totalPaid - standard.totalPaid;
  const durationDiffNoExtraVsStandard =
    refiNoExtraAfter.durationMonths - standard.durationMonths;
  const durationDiffWithExtraVsStandard =
    refiWithExtraAfter.durationMonths - standard.durationMonths;

  // Check if refi rate is better
  const refiRateBetter = inputs.refiRate < inputs.interestRate;
  const refiRateWorse = inputs.refiRate > inputs.interestRate;

  // Check if there are extra payments
  const hasExtraPayments = inputs.extraPayment > 0;
  const hasExtraAfterRefi = inputs.extraPaymentAfterRefi > 0;
  const hasLumpSumAfterRefi = inputs.lumpSumAfterRefi > 0;
  const isScenario4DifferentFrom3 = hasExtraAfterRefi || hasLumpSumAfterRefi;

  // Check if differences are significant (more than $1000)
  const isSignificantDiff = (diff: number) => Math.abs(diff) > 1000;

  // Check if difference is trivial (less than 1% of total interest)
  const isTrivialDiff = (diff: number, totalInterest: number) => {
    if (totalInterest === 0) return false;
    return Math.abs(diff) < totalInterest * 0.01;
  };

  // Helper to get color class for a difference
  // diff: the difference amount (positive = costs more, negative = saves)
  // totalInterest: total interest for context
  // isGoodWhenNegative: true if negative diff is good (saves money), false if positive diff is good
  const getDiffColor = (
    diff: number,
    totalInterest: number,
    isGoodWhenNegative: boolean = true
  ) => {
    if (isTrivialDiff(Math.abs(diff), totalInterest)) return "";
    const isGood = isGoodWhenNegative ? diff < 0 : diff > 0;
    return isGood ? "summary-good" : "summary-bad";
  };

  // Calculate initial monthly P&I payment
  const initialMonthlyPayment = calculateMonthlyPayment(
    inputs.loanAmount,
    inputs.interestRate,
    inputs.loanTermMonths
  );
  const totalMonthlyPayment = initialMonthlyPayment + inputs.extraPayment;
  const hasLumpSumAtStart = inputs.lumpSumAtStart > 0;

  // Calculate payment difference between Scenario 4 and Scenario 2
  const scenario4TotalPayment = refiWithExtraAfter.refiMonthlyPayment
    ? refiWithExtraAfter.refiMonthlyPayment + inputs.extraPaymentAfterRefi
    : 0;
  const scenario2TotalPayment = initialMonthlyPayment + inputs.extraPayment;
  const paymentDiffScenario4Vs2 = scenario4TotalPayment - scenario2TotalPayment;

  // Calculate payment difference between Scenario 4 and Scenario 1
  const scenario1TotalPayment = initialMonthlyPayment;
  const paymentDiffScenario4Vs1 = scenario4TotalPayment - scenario1TotalPayment;

  return (
    <div style={{ lineHeight: "1.6" }}>
      <p>
        If you have a {years}-year loan of {formatCurrency(inputs.loanAmount)}{" "}
        at {inputs.interestRate}% and plan to pay{" "}
        {hasExtraPayments ? (
          <>
            {formatCurrency(totalMonthlyPayment)} (
            {formatCurrency(initialMonthlyPayment)} +{" "}
            {formatCurrency(inputs.extraPayment)})
          </>
        ) : (
          formatCurrency(initialMonthlyPayment)
        )}{" "}
        each month
        {hasLumpSumAtStart ? (
          <> with {formatCurrency(inputs.lumpSumAtStart)} lump sum payment</>
        ) : null}
        , here's how refinancing looks:
      </p>

      {/* Scenario 3 Analysis */}
      {hasExtraPayments ? (
        <p>
          <strong>
            If you refinance after {inputs.refiAfterMonths} months
          </strong>{" "}
          to a {formatTerm(inputs.refiTermMonths)} term at {inputs.refiRate}%
          and <strong>stop the extra payments</strong> (Scenario 3): It will
          cost you {formatCurrency(refiNoExtraAfter.totalPaid)} total, where
          you're paying {formatCurrency(refiNoExtraAfter.totalInterest)} in
          interest. Your total monthly payment drops to{" "}
          {formatCurrency(refiNoExtraAfter.monthlyPayment)}, but you'll be
          paying for {formatDuration(refiNoExtraAfter.durationMonths)} instead
          of {formatDuration(extraNoRefi.durationMonths)}.
          {isSignificantDiff(refiNoExtraDiff) ? (
            <>
              {" "}
              Compared to staying aggressive without refi, you'd pay about{" "}
              <span
                className={getDiffColor(
                  refiNoExtraDiff,
                  refiNoExtraAfter.totalInterest,
                  true
                )}
              >
                {formatCurrency(refiNoExtraDiff)}
              </span>{" "}
              more total and take {formatDuration(durationDiffNoExtra)} longer
              to pay off.
            </>
          ) : (
            " The cost difference is minimal, but you'll take significantly longer to pay off."
          )}
        </p>
      ) : (
        <p>
          <strong>
            If you refinance after {inputs.refiAfterMonths} months
          </strong>{" "}
          to a {formatTerm(inputs.refiTermMonths)} term at {inputs.refiRate}%
          (Scenario 3): It will cost you{" "}
          {formatCurrency(refiNoExtraAfter.totalPaid)} total, where you're
          paying {formatCurrency(refiNoExtraAfter.totalInterest)} in interest.
          Your monthly payment after refinancing is{" "}
          {formatCurrency(refiNoExtraAfter.monthlyPayment)}, and you'll be
          paying for {formatDuration(refiNoExtraAfter.durationMonths)}.
          {!hasExtraPayments && (
            <>
              {" "}
              Compared to not refinancing (Scenario 2), you'll pay about{" "}
              <span
                className={getDiffColor(
                  refiNoExtraDiff,
                  refiNoExtraAfter.totalInterest,
                  true
                )}
              >
                {formatCurrency(refiNoExtraDiff)}
              </span>{" "}
              more total.
            </>
          )}
          {refiRateBetter
            ? " The lower rate helps reduce your interest costs."
            : refiRateWorse
            ? " Note that your rate is actually higher than your original rate."
            : " The rate is similar to your original rate."}
        </p>
      )}

      {/* Scenario 4 Analysis */}
      {isScenario4DifferentFrom3 ? (
        <p>
          <strong>
            If you refinance
            {hasExtraAfterRefi
              ? ` and keep paying ${formatCurrency(
                  inputs.extraPaymentAfterRefi
                )} extra per month`
              : ""}
            {hasLumpSumAfterRefi
              ? hasExtraAfterRefi
                ? ` and pay a ${formatCurrency(
                    inputs.lumpSumAfterRefi
                  )} lump sum at refi`
                : ` and pay a ${formatCurrency(
                    inputs.lumpSumAfterRefi
                  )} lump sum at refi`
              : ""}
          </strong>{" "}
          (Scenario 4): It will cost you{" "}
          {formatCurrency(refiWithExtraAfter.totalPaid)} total, where you're
          paying {formatCurrency(refiWithExtraAfter.totalInterest)} in interest.
          {hasExtraAfterRefi ? (
            <>
              {" "}
              Your total monthly payment after refinancing is{" "}
              {formatCurrency(
                refiWithExtraAfter.refiMonthlyPayment! +
                  inputs.extraPaymentAfterRefi
              )}{" "}
              ({formatCurrency(refiWithExtraAfter.refiMonthlyPayment!)} P&I +{" "}
              {formatCurrency(inputs.extraPaymentAfterRefi)} extra).
            </>
          ) : (
            <>
              {" "}
              Your monthly payment after refinancing is{" "}
              {formatCurrency(refiWithExtraAfter.refiMonthlyPayment!)}.
            </>
          )}
          {hasExtraPayments ? (
            <>
              {" "}
              Compared to Scenario 2,{" "}
              {refiWithExtraDiff > 0 ? (
                <>
                  it costs about{" "}
                  <span
                    className={getDiffColor(
                      refiWithExtraDiff,
                      refiWithExtraAfter.totalInterest,
                      true
                    )}
                  >
                    {formatCurrency(refiWithExtraDiff)}
                  </span>{" "}
                  more total
                </>
              ) : (
                <>
                  you save about{" "}
                  <span
                    className={getDiffColor(
                      refiWithExtraDiff,
                      refiWithExtraAfter.totalInterest,
                      true
                    )}
                  >
                    {formatCurrency(Math.abs(refiWithExtraDiff))}
                  </span>{" "}
                  total
                </>
              )}{" "}
              and take {formatDuration(Math.abs(durationDiffWithExtra))}{" "}
              {durationDiffWithExtra > 0 ? "longer" : "less"} to pay off.
            </>
          ) : (
            <>
              {" "}
              Compared to not refinancing (Scenario 2),{" "}
              {refiWithExtraDiff > 0 ? (
                <>
                  you'll pay about{" "}
                  <span
                    className={getDiffColor(
                      refiWithExtraDiff,
                      refiWithExtraAfter.totalInterest,
                      true
                    )}
                  >
                    {formatCurrency(refiWithExtraDiff)}
                  </span>{" "}
                  more total
                </>
              ) : (
                <>
                  you'll save about{" "}
                  <span
                    className={getDiffColor(
                      refiWithExtraDiff,
                      refiWithExtraAfter.totalInterest,
                      true
                    )}
                  >
                    {formatCurrency(Math.abs(refiWithExtraDiff))}
                  </span>{" "}
                  total
                </>
              )}{" "}
              and pay off in {formatDuration(refiWithExtraAfter.durationMonths)}
              .
            </>
          )}
        </p>
      ) : (
        <p>
          <strong>If you refinance and don't make extra payments</strong>{" "}
          (Scenario 4): This is the same as Scenario 3 since you're not planning
          to make extra payments after refinancing.
        </p>
      )}

      {/* Bottom Line */}
      <p>
        <strong>Bottom line:</strong>{" "}
        {bestIndex === 1 ? (
          <>
            Scenario 2 (staying aggressive without refi) is your best option,
            saving you{" "}
            <span
              className={getDiffColor(
                -(standard.totalPaid - bestScenario.totalPaid),
                standard.totalInterest,
                true
              )}
            >
              {formatCurrency(standard.totalPaid - bestScenario.totalPaid)}
            </span>{" "}
            compared to the standard mortgage. Refinancing doesn't help much
            here unless you can get a significantly better rate or shorter term.
          </>
        ) : bestIndex === 3 ? (
          <>
            Scenario 4 (refi and keep paying extra) is your best option. The key
            is keeping those extra payments going after refi—stopping them (like
            in Scenario 3) costs significantly more.{" "}
            {refiRateBetter &&
              "The better rate you're getting also helps reduce your interest costs."}
          </>
        ) : bestIndex === 2 ? (
          <>
            Scenario 3 (refi without extra payments) works best for your
            situation, though it takes longer to pay off. If you want to reduce
            total interest further, consider a shorter refi term or continuing
            extra payments after refi.
          </>
        ) : (
          <>
            The standard mortgage (Scenario 1) is actually your baseline.{" "}
            {hasExtraPayments &&
              "Making extra payments or refinancing can save you significant money."}
          </>
        )}
      </p>

      <button
        className="show-more-btn"
        onClick={() => setExpanded(!expanded)}
        style={{ marginTop: "1rem" }}
      >
        {expanded ? "Show less" : "Show more"}
      </button>

      {expanded && (
        <div
          style={{
            marginTop: "1rem",
            paddingTop: "1rem",
            borderTop: "1px solid #333",
          }}
        >
          <p style={{ marginBottom: "1rem", fontWeight: "600" }}>
            Comparison against standard mortgage (Scenario 1):
          </p>
          <p
            style={{ marginBottom: "1rem", fontSize: "0.9rem", color: "#aaa" }}
          >
            Note: Standard mortgage means no lump sum payments or regular extra
            payments—just the base monthly P&I payment.
          </p>

          {/* Scenario 3 vs Scenario 1 */}
          <p>
            <strong>
              If you refinance after {inputs.refiAfterMonths} months
            </strong>{" "}
            to a {formatTerm(inputs.refiTermMonths)} term at {inputs.refiRate}%
            and <strong>stop the extra payments</strong> (Scenario 3): Compared
            to the standard mortgage, you{" "}
            {refiNoExtraDiffVsStandard > 0 ? (
              <>
                pay about{" "}
                <span
                  className={getDiffColor(
                    refiNoExtraDiffVsStandard,
                    standard.totalInterest,
                    true
                  )}
                >
                  {formatCurrency(refiNoExtraDiffVsStandard)}
                </span>{" "}
                more total
              </>
            ) : (
              <>
                save about{" "}
                <span
                  className={getDiffColor(
                    refiNoExtraDiffVsStandard,
                    standard.totalInterest,
                    true
                  )}
                >
                  {formatCurrency(Math.abs(refiNoExtraDiffVsStandard))}
                </span>{" "}
                total
              </>
            )}{" "}
            and take {formatDuration(Math.abs(durationDiffNoExtraVsStandard))}{" "}
            {durationDiffNoExtraVsStandard > 0 ? "longer" : "less"} to pay off.
          </p>

          {/* Scenario 4 vs Scenario 1 */}
          {isScenario4DifferentFrom3 && (
            <p>
              <strong>
                If you refinance
                {hasExtraAfterRefi
                  ? ` and keep paying ${formatCurrency(
                      inputs.extraPaymentAfterRefi
                    )} extra per month`
                  : ""}
                {hasLumpSumAfterRefi
                  ? hasExtraAfterRefi
                    ? ` and pay a ${formatCurrency(
                        inputs.lumpSumAfterRefi
                      )} lump sum at refi`
                    : ` and pay a ${formatCurrency(
                        inputs.lumpSumAfterRefi
                      )} lump sum at refi`
                  : ""}
              </strong>{" "}
              (Scenario 4): Compared to the standard mortgage, you{" "}
              {refiWithExtraDiffVsStandard > 0 ? (
                <>
                  pay about{" "}
                  <span
                    className={getDiffColor(
                      refiWithExtraDiffVsStandard,
                      standard.totalInterest,
                      true
                    )}
                  >
                    {formatCurrency(refiWithExtraDiffVsStandard)}
                  </span>{" "}
                  more total
                </>
              ) : (
                <>
                  save about{" "}
                  <span
                    className={getDiffColor(
                      refiWithExtraDiffVsStandard,
                      standard.totalInterest,
                      true
                    )}
                  >
                    {formatCurrency(Math.abs(refiWithExtraDiffVsStandard))}
                  </span>{" "}
                  total
                </>
              )}{" "}
              and take{" "}
              {formatDuration(Math.abs(durationDiffWithExtraVsStandard))}{" "}
              {durationDiffWithExtraVsStandard > 0 ? "longer" : "less"} to pay
              off.
            </p>
          )}

          {/* Keep in mind section */}
          <p style={{ marginTop: "1rem", fontStyle: "italic" }}>
            Keep in mind that if you{" "}
            {paymentDiffScenario4Vs2 > 0 ? (
              <>
                decrease your extra payment by{" "}
                <strong style={{ color: "inherit" }}>
                  {formatCurrency(paymentDiffScenario4Vs2)}
                </strong>
              </>
            ) : paymentDiffScenario4Vs2 < 0 ? (
              <>
                increase your extra payment by{" "}
                <strong style={{ color: "inherit" }}>
                  {formatCurrency(Math.abs(paymentDiffScenario4Vs2))}
                </strong>
              </>
            ) : (
              <>keep your extra payment the same</>
            )}{" "}
            then your total payment in Scenario 4 (refi with extra payments)
            will be the same as total monthly payment as Scenario 2 (no refi).
            And if you{" "}
            {paymentDiffScenario4Vs1 > 0 ? (
              <>
                decrease your extra payment by{" "}
                <strong style={{ color: "inherit" }}>
                  {formatCurrency(paymentDiffScenario4Vs1)}
                </strong>
              </>
            ) : paymentDiffScenario4Vs1 < 0 ? (
              <>
                increase your extra payment by{" "}
                <strong style={{ color: "inherit" }}>
                  {formatCurrency(Math.abs(paymentDiffScenario4Vs1))}
                </strong>
              </>
            ) : (
              <>keep your extra payment the same</>
            )}{" "}
            your total payment will be the same as Scenario 1 (standard
            mortgage).
          </p>
        </div>
      )}
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
