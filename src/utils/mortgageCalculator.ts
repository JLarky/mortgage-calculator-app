export interface MortgageParams {
  principal: number;
  annualRate: number;
  termYears: number;
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
  termYears: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;
  
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
  termYears: number,
  extraMonthlyPayment: number = 0,
  lumpSumAtStart: number = 0
): MortgageResult {
  const monthlyRate = annualRate / 100 / 12;
  
  // Apply lump sum at start
  let balance = principal - lumpSumAtStart;
  let totalPaid = lumpSumAtStart;
  
  if (balance <= 0) {
    return {
      totalPaid: Math.round(principal),
      durationMonths: 0,
      monthlyPayment: 0,
    };
  }
  
  const baseMonthlyPayment = calculateMonthlyPayment(principal, annualRate, termYears);
  let months = 0;
  
  while (balance > 0.01 && months < termYears * 12) {
    months++;
    const interestPayment = balance * monthlyRate;
    const actualPayment = Math.min(balance + interestPayment, baseMonthlyPayment + extraMonthlyPayment);
    totalPaid += actualPayment;
    balance -= (actualPayment - interestPayment);
    
    if (balance < 0) balance = 0;
  }
  
  return {
    totalPaid: Math.round(totalPaid),
    durationMonths: months,
    monthlyPayment: baseMonthlyPayment,
  };
}

// Simulate mortgage with refinance option
export function simulateMortgageWithRefi(
  principal: number,
  annualRate: number,
  termYears: number,
  extraMonthlyPayment: number,
  lumpSumAtStart: number,
  refiAfterYears: number,
  refiTermYears: number,
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
      totalPaid: Math.round(principal),
      durationMonths: 0,
      monthlyPayment: 0,
    };
  }
  
  const baseMonthlyPayment = calculateMonthlyPayment(principal, annualRate, termYears);
  let months = 0;
  const refiAfterMonths = refiAfterYears * 12;
  
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
      totalPaid: Math.round(totalPaid),
      durationMonths: months,
      monthlyPayment: baseMonthlyPayment,
    };
  }
  
  // Phase 2: After refinance - apply lump sum first
  balance -= lumpSumAfterRefi;
  totalPaid += lumpSumAfterRefi;
  
  if (balance <= 0.01) {
    return {
      totalPaid: Math.round(totalPaid),
      durationMonths: months,
      monthlyPayment: baseMonthlyPayment,
    };
  }
  
  const refiMonthlyRate = refiRate / 100 / 12;
  const refiMonthlyPayment = calculateMonthlyPayment(balance, refiRate, refiTermYears);
  const maxRefiMonths = refiTermYears * 12;
  let refiMonths = 0;
  
  while (balance > 0.01 && refiMonths < maxRefiMonths) {
    months++;
    refiMonths++;
    const interestPayment = balance * refiMonthlyRate;
    const actualPayment = Math.min(balance + interestPayment, refiMonthlyPayment + extraAfterRefi);
    totalPaid += actualPayment;
    balance -= (actualPayment - interestPayment);
    if (balance < 0) balance = 0;
  }
  
  return {
    totalPaid: Math.round(totalPaid),
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
    maximumFractionDigits: 0,
  }).format(amount);
}

export interface CalculatorInputs {
  loanAmount: number;
  interestRate: number;
  loanTermYears: number;
  extraPayment: number;
  lumpSumAtStart: number;
  refiAfterYears: number;
  refiTermYears: number;
  refiRate: number;
  lumpSumAfterRefi: number;
}

export function calculateAllScenarios(inputs: CalculatorInputs): ScenarioResult[] {
  const { loanAmount, interestRate, loanTermYears, extraPayment, lumpSumAtStart, refiAfterYears, refiTermYears, refiRate, lumpSumAfterRefi } = inputs;
  
  // Scenario 1: Standard mortgage
  const standard = simulateMortgage(loanAmount, interestRate, loanTermYears, 0, 0);
  
  // Scenario 2: Extra payment + lump sum, no refi
  const extraNoRefi = simulateMortgage(loanAmount, interestRate, loanTermYears, extraPayment, lumpSumAtStart);
  
  // Scenario 3: Extra payment before refi, no extra after
  const refiNoExtraAfter = simulateMortgageWithRefi(
    loanAmount,
    interestRate,
    loanTermYears,
    extraPayment,
    lumpSumAtStart,
    refiAfterYears,
    refiTermYears,
    refiRate,
    0,
    lumpSumAfterRefi
  );
  
  // Scenario 4: Extra payment before and after refi
  const refiWithExtraAfter = simulateMortgageWithRefi(
    loanAmount,
    interestRate,
    loanTermYears,
    extraPayment,
    lumpSumAtStart,
    refiAfterYears,
    refiTermYears,
    refiRate,
    extraPayment,
    lumpSumAfterRefi
  );
  
  // Build description for lump sums
  const lumpStartDesc = lumpSumAtStart > 0 ? ` + ${formatCurrency(lumpSumAtStart)} upfront` : '';
  const lumpRefiDesc = lumpSumAfterRefi > 0 ? ` + ${formatCurrency(lumpSumAfterRefi)} at refi` : '';
  
  return [
    {
      name: `Standard ${loanTermYears}y`,
      totalPaid: standard.totalPaid,
      durationMonths: standard.durationMonths,
      description: `No extra payments, full ${loanTermYears}-year term`,
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
      name: `+${formatCurrency(extraPayment)}${lumpStartDesc}, refi -> ${refiTermYears}y${lumpRefiDesc}, no extra after`,
      totalPaid: refiNoExtraAfter.totalPaid,
      durationMonths: refiNoExtraAfter.durationMonths,
      description: `Extra payments for ${refiAfterYears} years, then refi to ${refiTermYears}y at ${refiRate}%`,
      monthlyPayment: refiNoExtraAfter.monthlyPayment,
      refiMonthlyPayment: refiNoExtraAfter.refiMonthlyPayment,
    },
    {
      name: `+${formatCurrency(extraPayment)}${lumpStartDesc}, refi -> ${refiTermYears}y${lumpRefiDesc}, +${formatCurrency(extraPayment)} continues`,
      totalPaid: refiWithExtraAfter.totalPaid,
      durationMonths: refiWithExtraAfter.durationMonths,
      description: `Extra payments continue after refinance`,
      monthlyPayment: refiWithExtraAfter.monthlyPayment,
      refiMonthlyPayment: refiWithExtraAfter.refiMonthlyPayment,
    },
  ];
}
