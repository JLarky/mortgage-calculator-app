export interface MortgageParams {
  principal: number;
  annualRate: number;
  termMonths: number;
  extraMonthlyPayment?: number;
}

export interface MortgageResult {
  totalPaid: number;
  durationMonths: number;
  monthlyPayment: number;
  refiMonthlyPayment?: number;
}

export interface ScenarioResult {
  name: string;
  totalPaid: number;
  durationMonths: number;
  description: string;
  monthlyPayment: number;
  refiMonthlyPayment?: number;
}

// Calculate monthly payment for a mortgage (P&I only)
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termMonths;
  
  if (monthlyRate === 0) {
    return principal / numPayments;
  }
  
  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  return payment;
}

// Simulate mortgage payoff and return total paid and duration
export function simulateMortgage(
  principal: number,
  annualRate: number,
  termMonths: number,
  extraMonthlyPayment: number = 0,
  lumpSumAtStart: number = 0
): MortgageResult {
  const monthlyRate = annualRate / 100 / 12;
  
  // Apply lump sum at start
  let balance = principal - lumpSumAtStart;
  let totalPaid = lumpSumAtStart;
  
  if (balance <= 0) {
    return {
      totalPaid: Math.round(principal * 100) / 100,
      durationMonths: 0,
      monthlyPayment: 0,
    };
  }
  
  const baseMonthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  let months = 0;
  
  while (balance > 0.01 && months < termMonths) {
    months++;
    const interestPayment = balance * monthlyRate;
    const actualPayment = Math.min(balance + interestPayment, baseMonthlyPayment + extraMonthlyPayment);
    totalPaid += actualPayment;
    balance -= (actualPayment - interestPayment);
    
    if (balance < 0) balance = 0;
  }
  
  return {
    totalPaid: Math.round(totalPaid * 100) / 100,
    durationMonths: months,
    monthlyPayment: baseMonthlyPayment,
  };
}

// Simulate mortgage with refinance option
export function simulateMortgageWithRefi(
  principal: number,
  annualRate: number,
  termMonths: number,
  extraMonthlyPayment: number,
  lumpSumAtStart: number,
  refiAfterMonths: number,
  refiTermMonths: number,
  refiRate: number,
  extraAfterRefi: number,
  lumpSumAfterRefi: number
): MortgageResult {
  const monthlyRate = annualRate / 100 / 12;
  
  // Apply lump sum at start
  let balance = principal - lumpSumAtStart;
  let totalPaid = lumpSumAtStart;
  
  if (balance <= 0) {
    return {
      totalPaid: Math.round(principal * 100) / 100,
      durationMonths: 0,
      monthlyPayment: 0,
    };
  }
  
  const baseMonthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  let months = 0;
  
  // Phase 1: Before refinance
  while (balance > 0.01 && months < refiAfterMonths) {
    months++;
    const interestPayment = balance * monthlyRate;
    const actualPayment = Math.min(balance + interestPayment, baseMonthlyPayment + extraMonthlyPayment);
    totalPaid += actualPayment;
    balance -= (actualPayment - interestPayment);
    if (balance < 0) balance = 0;
  }
  
  if (balance <= 0.01) {
    return {
      totalPaid: Math.round(totalPaid * 100) / 100,
      durationMonths: months,
      monthlyPayment: baseMonthlyPayment,
    };
  }
  
  // Phase 2: After refinance - apply lump sum first
  balance -= lumpSumAfterRefi;
  totalPaid += lumpSumAfterRefi;
  
  if (balance <= 0.01) {
    return {
      totalPaid: Math.round(totalPaid * 100) / 100,
      durationMonths: months,
      monthlyPayment: baseMonthlyPayment,
    };
  }
  
  const refiMonthlyRate = refiRate / 100 / 12;
  const refiMonthlyPayment = calculateMonthlyPayment(balance, refiRate, refiTermMonths);
  let refiMonths = 0;
  
  while (balance > 0.01 && refiMonths < refiTermMonths) {
    months++;
    refiMonths++;
    const interestPayment = balance * refiMonthlyRate;
    const actualPayment = Math.min(balance + interestPayment, refiMonthlyPayment + extraAfterRefi);
    totalPaid += actualPayment;
    balance -= (actualPayment - interestPayment);
    if (balance < 0) balance = 0;
  }
  
  return {
    totalPaid: Math.round(totalPaid * 100) / 100,
    durationMonths: months,
    monthlyPayment: baseMonthlyPayment,
    refiMonthlyPayment: refiMonthlyPayment,
  };
}

export function formatDuration(months: number): string {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return `${years}y ${remainingMonths}m`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export interface CalculatorInputs {
  loanAmount: number;
  interestRate: number;
  loanTermMonths: number;
  extraPayment: number;
  lumpSumAtStart: number;
  refiAfterMonths: number;
  refiTermMonths: number;
  refiRate: number;
  lumpSumAfterRefi: number;
}

export function calculateAllScenarios(inputs: CalculatorInputs): ScenarioResult[] {
  const { loanAmount, interestRate, loanTermMonths, extraPayment, lumpSumAtStart, refiAfterMonths, refiTermMonths, refiRate, lumpSumAfterRefi } = inputs;
  
  // Scenario 1: Standard mortgage
  const standard = simulateMortgage(loanAmount, interestRate, loanTermMonths, 0, 0);
  
  // Scenario 2: Extra payment + lump sum, no refi
  const extraNoRefi = simulateMortgage(loanAmount, interestRate, loanTermMonths, extraPayment, lumpSumAtStart);
  
  // Scenario 3: Extra payment before refi, no extra after
  const refiNoExtraAfter = simulateMortgageWithRefi(
    loanAmount,
    interestRate,
    loanTermMonths,
    extraPayment,
    lumpSumAtStart,
    refiAfterMonths,
    refiTermMonths,
    refiRate,
    0,
    lumpSumAfterRefi
  );
  
  // Scenario 4: Extra payment before and after refi
  const refiWithExtraAfter = simulateMortgageWithRefi(
    loanAmount,
    interestRate,
    loanTermMonths,
    extraPayment,
    lumpSumAtStart,
    refiAfterMonths,
    refiTermMonths,
    refiRate,
    extraPayment,
    lumpSumAfterRefi
  );
  
  // Build description for lump sums
  const lumpStartDesc = lumpSumAtStart > 0 ? ` + ${formatCurrency(lumpSumAtStart)} upfront` : '';
  const lumpRefiDesc = lumpSumAfterRefi > 0 ? ` + ${formatCurrency(lumpSumAfterRefi)} at refi` : '';
  
  return [
    {
      name: `Standard ${loanTermMonths}m`,
      totalPaid: standard.totalPaid,
      durationMonths: standard.durationMonths,
      description: `No extra payments, full ${loanTermMonths}-month term`,
      monthlyPayment: standard.monthlyPayment,
    },
    {
      name: `+${formatCurrency(extraPayment)} extra monthly${lumpStartDesc} (no refi)`,
      totalPaid: extraNoRefi.totalPaid,
      durationMonths: extraNoRefi.durationMonths,
      description: `Extra ${formatCurrency(extraPayment)} towards principal each month`,
      monthlyPayment: extraNoRefi.monthlyPayment,
    },
    {
      name: `+${formatCurrency(extraPayment)}${lumpStartDesc}, refi -> ${refiTermMonths}m${lumpRefiDesc}, no extra after`,
      totalPaid: refiNoExtraAfter.totalPaid,
      durationMonths: refiNoExtraAfter.durationMonths,
      description: `Extra payments for ${refiAfterMonths} months, then refi to ${refiTermMonths}m at ${refiRate}%`,
      monthlyPayment: refiNoExtraAfter.monthlyPayment,
      refiMonthlyPayment: refiNoExtraAfter.refiMonthlyPayment,
    },
    {
      name: `+${formatCurrency(extraPayment)}${lumpStartDesc}, refi -> ${refiTermMonths}m${lumpRefiDesc}, +${formatCurrency(extraPayment)} continues`,
      totalPaid: refiWithExtraAfter.totalPaid,
      durationMonths: refiWithExtraAfter.durationMonths,
      description: `Extra payments continue after refinance`,
      monthlyPayment: refiWithExtraAfter.monthlyPayment,
      refiMonthlyPayment: refiWithExtraAfter.refiMonthlyPayment,
    },
  ];
}
