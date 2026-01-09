import { useState, useMemo, useEffect } from 'react';
import {
  calculateAllScenarios,
  formatCurrency,
  formatDuration,
  type CalculatorInputs,
  type ScenarioResult,
} from './utils/mortgageCalculator';
import './App.css';

function ScenarioCard({ scenario, index }: { scenario: ScenarioResult; index: number }) {
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
            <span className="stat-value">{formatCurrency(scenario.totalPaid)}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Duration:</span>
            <span className="stat-value duration">{formatDuration(scenario.durationMonths)}</span>
          </div>
        </div>
        
        <button 
          className="show-more-btn"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
        
        {expanded && (
          <div className="expanded-details">
            {isRefiScenario ? (
              <div className="stat">
                <span className="stat-label">Monthly P&I after refi:</span>
                <span className="stat-value">{formatCurrency(scenario.refiMonthlyPayment!)}</span>
              </div>
            ) : (
              <div className="stat">
                <span className="stat-label">Monthly P&I:</span>
                <span className="stat-value">{formatCurrency(scenario.monthlyPayment)}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const STORAGE_KEY = 'mortgageCalculatorInputs';

const defaultInputs: CalculatorInputs = {
  loanAmount: 500000,
  interestRate: 6,
  loanTermMonths: 360,
  extraPayment: 1000,
  lumpSumAtStart: 0,
  refiAfterMonths: 60,
  refiTermMonths: 150,
  refiRate: 6,
  lumpSumAfterRefi: 0,
};

function loadInputsFromStorage(): CalculatorInputs {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate and merge with defaults to handle missing fields
      return { ...defaultInputs, ...parsed };
    }
  } catch (error) {
    console.error('Failed to load inputs from localStorage:', error);
  }
  return defaultInputs;
}

function saveInputsToStorage(inputs: CalculatorInputs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  } catch (error) {
    console.error('Failed to save inputs to localStorage:', error);
  }
}

function App() {
  const [inputs, setInputs] = useState<CalculatorInputs>(() => loadInputsFromStorage());

  // Save to localStorage whenever inputs change
  useEffect(() => {
    saveInputsToStorage(inputs);
  }, [inputs]);

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
            <label htmlFor="loanTermMonths">Loan Term (months)</label>
            <input
              id="loanTermMonths"
              type="number"
              value={inputs.loanTermMonths}
              onChange={handleInputChange('loanTermMonths')}
              step="1"
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
          
          <div className="input-group">
            <label htmlFor="lumpSumAtStart">Lump Sum at Start ($)</label>
            <input
              id="lumpSumAtStart"
              type="number"
              value={inputs.lumpSumAtStart}
              onChange={handleInputChange('lumpSumAtStart')}
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
              onChange={handleInputChange('refiAfterMonths')}
              step="1"
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="refiTermMonths">New Loan Term (months)</label>
            <input
              id="refiTermMonths"
              type="number"
              value={inputs.refiTermMonths}
              onChange={handleInputChange('refiTermMonths')}
              step="1"
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
          
          <div className="input-group">
            <label htmlFor="lumpSumAfterRefi">Lump Sum After Refi ($)</label>
            <input
              id="lumpSumAfterRefi"
              type="number"
              value={inputs.lumpSumAfterRefi}
              onChange={handleInputChange('lumpSumAfterRefi')}
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
