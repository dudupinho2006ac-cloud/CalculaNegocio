const EPSILON = 1e-10;

export function parseBrazilianNumber(value) {
  const raw = String(value).trim().replace(/\s/g, '').replace(/^R\$/i, '');
  if (!raw) return NaN;
  if (raw.includes(',')) return Number(raw.replace(/\./g, '').replace(',', '.'));
  if (/^[+-]?\d{1,3}(\.\d{3})+$/.test(raw)) return Number(raw.replace(/\./g, ''));
  return Number(raw);
}

export function requireFinite(value, label = 'Valor') {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) throw new RangeError(`${label} deve ser um número válido.`);
  return number;
}

export function requireNonNegative(value, label = 'Valor') {
  const number = requireFinite(value, label);
  if (number < 0) throw new RangeError(`${label} não pode ser negativo.`);
  return number;
}

function requirePositive(value, label = 'Valor') {
  const number = requireFinite(value, label);
  if (number <= 0) throw new RangeError(`${label} deve ser maior que zero.`);
  return number;
}

export function roundMoney(value) {
  value = requireFinite(value);
  const absolute = Math.abs(value);
  const rounded = Math.round((absolute + Number.EPSILON * Math.max(1, absolute)) * 100) / 100;
  return Object.is(value, -0) || value < 0 ? -rounded : rounded;
}

function requireFiniteResult(value) {
  if (!Number.isFinite(value)) {
    throw new RangeError('Os valores informados são grandes demais para um cálculo confiável.');
  }
  return value;
}

export function calculateProfit(cost, salePrice) {
  cost = requireNonNegative(cost, 'Custo');
  salePrice = requireNonNegative(salePrice, 'Preço de venda');
  const profit = roundMoney(salePrice - cost);
  return {
    profit,
    margin: salePrice === 0 ? null : requireFiniteResult((profit / salePrice) * 100),
    markup: cost === 0 ? null : requireFiniteResult((profit / cost) * 100)
  };
}

export function calculateSalePrice(cost, expenses, feesPercent, desiredMargin) {
  cost = requireNonNegative(cost, 'Custo');
  expenses = requireNonNegative(expenses, 'Despesas');
  feesPercent = requireNonNegative(feesPercent, 'Taxas');
  desiredMargin = requireNonNegative(desiredMargin, 'Margem');
  if (feesPercent + desiredMargin >= 100 - EPSILON) {
    throw new RangeError('A soma das taxas e da margem deve ser menor que 100%.');
  }
  const baseCost = roundMoney(requireFiniteResult(cost + expenses));
  const salePrice = roundMoney(requireFiniteResult(baseCost / (1 - (feesPercent + desiredMargin) / 100)));
  return {
    baseCost,
    salePrice,
    feesValue: roundMoney(salePrice * (feesPercent / 100)),
    profit: roundMoney(salePrice * (desiredMargin / 100))
  };
}

export function calculateMargin(revenue, totalCost) {
  revenue = requireNonNegative(revenue, 'Receita');
  totalCost = requireNonNegative(totalCost, 'Custo total');
  const profit = roundMoney(revenue - totalCost);
  return {
    profit,
    margin: revenue === 0 ? null : requireFiniteResult((profit / revenue) * 100),
    markup: totalCost === 0 ? null : requireFiniteResult((profit / totalCost) * 100)
  };
}

export function percentOf(percent, value) {
  percent = requireFinite(percent, 'Porcentagem');
  value = requireFinite(value, 'Valor');
  return roundMoney(requireFiniteResult(value * (percent / 100)));
}

export function percentChange(initial, final) {
  initial = requireFinite(initial, 'Valor inicial');
  final = requireFinite(final, 'Valor final');
  if (initial === 0) throw new RangeError('O valor inicial não pode ser zero.');
  return requireFiniteResult(((final - initial) / Math.abs(initial)) * 100);
}

export function percentRatio(part, total) {
  part = requireFinite(part, 'Primeiro valor');
  total = requireFinite(total, 'Valor total');
  if (total === 0) throw new RangeError('O valor total não pode ser zero.');
  return requireFiniteResult((part / total) * 100);
}

export function calculateDiscount(original, discountPercent) {
  original = requireNonNegative(original, 'Valor original');
  discountPercent = requireNonNegative(discountPercent, 'Desconto');
  if (discountPercent > 100) throw new RangeError('O desconto não pode ser maior que 100%.');
  const discountValue = roundMoney(original * (discountPercent / 100));
  return { discountValue, finalPrice: roundMoney(original - discountValue) };
}

export function effectiveMonthlyRate(ratePercent, rateUnit = 'mensal') {
  const rate = requireFinite(ratePercent, 'Taxa de juros') / 100;
  if (rate <= -1) throw new RangeError('A taxa deve ser maior que -100%.');
  if (rateUnit === 'mensal') return rate;
  if (rateUnit !== 'anual') throw new RangeError('A unidade da taxa deve ser mensal ou anual.');
  return requireFiniteResult(Math.pow(1 + rate, 1 / 12) - 1);
}

export function normalizeMonths(period, periodUnit = 'meses') {
  period = requirePositive(period, 'Período');
  if (!['meses', 'anos'].includes(periodUnit)) throw new RangeError('A unidade do período deve ser meses ou anos.');
  const months = periodUnit === 'anos' ? period * 12 : period;
  if (!Number.isInteger(months)) throw new RangeError('O período deve corresponder a uma quantidade inteira de meses.');
  if (months > 1200) throw new RangeError('O período máximo para a simulação é de 1.200 meses.');
  return months;
}

export function calculateCompoundInterest(initialCapital, monthlyContribution, ratePercent, rateUnit, period, periodUnit) {
  initialCapital = requireNonNegative(initialCapital, 'Capital inicial');
  monthlyContribution = requireNonNegative(monthlyContribution, 'Aporte mensal');
  if (initialCapital === 0 && monthlyContribution === 0) throw new RangeError('Informe um capital inicial ou um aporte mensal maior que zero.');
  const monthlyRate = effectiveMonthlyRate(ratePercent, rateUnit);
  const months = normalizeMonths(period, periodUnit);
  let balance = initialCapital;
  const evolution = [];
  for (let month = 1; month <= months; month += 1) {
    const openingBalance = balance;
    const interest = requireFiniteResult(openingBalance * monthlyRate);
    balance = requireFiniteResult(openingBalance + interest + monthlyContribution);
    evolution.push({ month, interest: roundMoney(interest), contribution: roundMoney(monthlyContribution), balance: roundMoney(balance) });
  }
  const totalInvested = requireFiniteResult(initialCapital + monthlyContribution * months);
  return {
    months,
    monthlyRate,
    finalAmount: roundMoney(balance),
    totalInvested: roundMoney(totalInvested),
    totalInterest: roundMoney(balance - totalInvested),
    evolution
  };
}

export function simulateInvestmentScenarios(initialValue, monthlyContribution, rates, rateUnit, period, periodUnit) {
  if (!Array.isArray(rates) || rates.length !== 3) throw new RangeError('Informe exatamente três cenários de rentabilidade.');
  return rates.map((rate, index) => ({
    name: `Cenário ${index + 1}`,
    rate: requireFinite(rate, `Rentabilidade do cenário ${index + 1}`),
    ...calculateCompoundInterest(initialValue, monthlyContribution, rate, rateUnit, period, periodUnit)
  }));
}

export function calculatePriceFinancing(principal, ratePercent, rateUnit, installments) {
  principal = requirePositive(principal, 'Valor financiado');
  ratePercent = requireNonNegative(ratePercent, 'Taxa de juros');
  installments = requirePositive(installments, 'Quantidade de parcelas');
  if (!Number.isInteger(installments)) throw new RangeError('A quantidade de parcelas deve ser um número inteiro.');
  if (installments > 1200) throw new RangeError('A quantidade máxima é de 1.200 parcelas.');
  const monthlyRate = effectiveMonthlyRate(ratePercent, rateUnit);
  const factor = monthlyRate === 0 ? installments : requireFiniteResult((1 - Math.pow(1 + monthlyRate, -installments)) / monthlyRate);
  const payment = roundMoney(requireFiniteResult(principal / factor));
  let balance = roundMoney(principal);
  const schedule = [];
  for (let installment = 1; installment <= installments; installment += 1) {
    const interest = roundMoney(balance * monthlyRate);
    let amortization = roundMoney(payment - interest);
    let installmentPayment = payment;
    if (installment === installments) {
      amortization = balance;
      installmentPayment = roundMoney(amortization + interest);
    }
    balance = roundMoney(Math.max(0, balance - amortization));
    schedule.push({ installment, payment: installmentPayment, interest, amortization, balance });
  }
  const totalPaid = requireFiniteResult(schedule.reduce((sum, row) => sum + row.payment, 0));
  return {
    monthlyRate,
    payment,
    totalPaid: roundMoney(totalPaid),
    totalInterest: roundMoney(totalPaid - principal),
    schedule
  };
}
