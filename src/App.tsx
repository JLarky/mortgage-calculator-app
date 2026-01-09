import { useState, useMemo } from 'react';
import {
  calculateAllScenarios,
  formatCurrency,
  formatDuration,
  type CalculatorInputs,
  type ScenarioResult,
} from './utils/mortgageCalculator';
import './App.css';

function App() {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    loanAmount: 500000,
    interestRate: 6,
    loanTermYears: 30,
    extraPayment: 1000,
    refiAfterYears: 5,
    refiTermYears: 12.5,
    refiRate: 6,
  });

  const scenarios = useMemo(() => calculateAllScenarios(inputs), [inputs]);

  const handleInputChange = (field: keyof CalculatorInputs) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
              onChange={handleInputChange('loanAmount')}
              step="10000"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="interestRate">Interest Rate (%)</label>
            <input
              id="interestRate"
              type="number"
              value={inputs.interestRate}
              onChange={handleInputChange('interestRate')}
              step="0.125"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="loanTermYears">Loan Term (years)</label>
            <input
              id="loanTermYears"
              type="number"
              value={inputs.loanTermYears}
              onChange={handleInputChange('loanTermYears')}
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="extraPayment">Extra Monthly Payment ($)</label>
            <input
              id="extraPayment"
              type="number"
              value={inputs.extraPayment}
              onChange={handleInputChange('extraPayment')}
              step="100"
            />
          </div>
        </div>
        
        <h2>Refinance Parameters</h2>
        <div className="input-grid">
          <div className="input-group">
            <label htmlFor="refiAfterYears">Refi After (years)</label>
            <input
              id="refiAfterYears"
              type="number"
              value={inputs.refiAfterYears}
              onChange={handleInputChange('refiAfterYears')}
              step="0.5"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="refiTermYears">New Loan Term (years)</label>
            <input
              id="refiTermYears"
              type="number"
              value={inputs.refiTermYears}
              onChange={handleInputChange('refiTermYears')}
              step="0.5"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="refiRate">New Interest Rate (%)</label>
            <input
              id="refiRate"
              type="number"
              value={inputs.refiRate}
              onChange={handleInputChange('refiRate')}
              step="0.125"
            />
          </div>
        </div>
      </div>
      
      <div className="results-section">
        <h2>=== Mortgage Scenarios ({inputs.refiTermYears}y ReFi) ===</h2>
        
        <div className="scenarios">
          {scenarios.map((scenario: ScenarioResult, index: number) => (
            <div key={index} className="scenario-card">
              <div className="scenario-number">{index + 1})</div>
              <div className="scenario-content">
                <h3>{scenario.name}:</h3>
                <div className="scenario-stats">
                  <div className="stat">
                    <span className="stat-label">Total paid:</span>
                    <span className="stat-value">{formatCurrency(scenario.totalPaid)}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Duration:</span>
                    <span className="stat-value duration">{formatDuration(scenario.durationMonths)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="savings-summary">
          <h3>Potential Savings</h3>
          <p>
            Best scenario saves{' '}
            <strong>
              {formatCurrency(
                scenarios[0].totalPaid - Math.min(...scenarios.map((s) => s.totalPaid))
              )}
            </strong>{' '}
            compared to standard mortgage
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
