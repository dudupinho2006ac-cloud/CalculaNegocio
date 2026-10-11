import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateProfit, calculateSalePrice, calculateMargin, percentOf,
  percentChange, percentRatio, calculateDiscount, roundMoney, parseBrazilianNumber,
  effectiveMonthlyRate, normalizeMonths, calculateCompoundInterest,
  simulateInvestmentScenarios, calculatePriceFinancing
} from '../assets/js/calculations.mjs';

test('lucro calcula lucro, margem e markup', () => {
  const result = calculateProfit(80, 120);
  assert.equal(result.profit, 40);
  assert.ok(Math.abs(result.margin - 33.3333333333) < 1e-8);
  assert.equal(result.markup, 50);
  assert.equal(calculateProfit(120, 80).profit, -40);
});

test('lucro evita divisões por zero', () => {
  assert.equal(calculateProfit(0, 0).margin, null);
  assert.equal(calculateProfit(0, 100).markup, null);
});

test('preço de venda usa margem e taxas por dentro', () => {
  assert.deepEqual(calculateSalePrice(50, 10, 10, 20), { baseCost: 60, salePrice: 85.71, feesValue: 8.57, profit: 17.14 });
});

test('preço rejeita soma percentual inviável', () => {
  assert.throws(() => calculateSalePrice(10, 0, 50, 50), /menor que 100/);
  assert.throws(() => calculateSalePrice(10, 0, 80, 30), /menor que 100/);
});

test('margem distingue margem de markup e aceita prejuízo', () => {
  const result = calculateMargin(200, 140);
  assert.equal(result.profit, 60);
  assert.equal(result.margin, 30);
  assert.ok(Math.abs(result.markup - 42.8571428571) < 1e-8);
  assert.equal(calculateMargin(50, 70).margin, -40);
});

test('margem com receita zero não divide por zero', () => {
  assert.equal(calculateMargin(0, 10).margin, null);
});

test('operações de porcentagem retornam valores esperados', () => {
  assert.equal(percentOf(15, 200), 30);
  assert.equal(percentChange(80, 100), 25);
  assert.equal(percentChange(100, 80), -20);
  assert.equal(percentRatio(30, 120), 25);
});

test('porcentagem rejeita divisores zero', () => {
  assert.throws(() => percentChange(0, 10), /não pode ser zero/);
  assert.throws(() => percentRatio(10, 0), /não pode ser zero/);
});

test('desconto calcula economia e preço final', () => {
  assert.deepEqual(calculateDiscount(250, 15), { discountValue: 37.5, finalPrice: 212.5 });
  assert.deepEqual(calculateDiscount(99.99, 100), { discountValue: 99.99, finalPrice: 0 });
});

test('valida valores negativos, não numéricos e desconto excessivo', () => {
  assert.throws(() => calculateProfit(-1, 2), /negativo/);
  assert.throws(() => calculateDiscount(100, 101), /maior que 100/);
  assert.throws(() => percentOf('abc', 2), /número válido/);
});

test('arredonda dinheiro para centavos', () => {
  assert.equal(roundMoney(10.005), 10.01);
  assert.equal(roundMoney(-10.005), -10.01);
  assert.equal(roundMoney(10.075), 10.08);
  assert.equal(roundMoney(0.1 + 0.2), 0.3);
});

test('rejeita resultados que excedem a capacidade numérica', () => {
  assert.throws(() => percentOf(Number.MAX_VALUE, Number.MAX_VALUE), /grandes demais/);
  assert.throws(() => calculateSalePrice(Number.MAX_VALUE, Number.MAX_VALUE, 1, 1), /grandes demais/);
  assert.throws(() => percentChange(-Number.MAX_VALUE, Number.MAX_VALUE), /grandes demais/);
});

test('aceita limites válidos sem produzir NaN ou Infinity', () => {
  const free = calculateSalePrice(0, 0, 0, 0);
  assert.deepEqual(free, { baseCost: 0, salePrice: 0, feesValue: 0, profit: 0 });
  assert.deepEqual(calculateDiscount(100, 0), { discountValue: 0, finalPrice: 100 });
});

test('interpreta entradas no formato brasileiro', () => {
  assert.equal(parseBrazilianNumber('R$ 1.234,56'), 1234.56);
  assert.equal(parseBrazilianNumber('1.000'), 1000);
  assert.equal(parseBrazilianNumber('10.5'), 10.5);
  assert.ok(Number.isNaN(parseBrazilianNumber('')));
  assert.ok(Number.isNaN(parseBrazilianNumber('dez')));
});

test('converte taxa anual efetiva em taxa mensal equivalente', () => {
  const monthly = effectiveMonthlyRate(12, 'anual');
  assert.ok(Math.abs(Math.pow(1 + monthly, 12) - 1.12) < 1e-12);
  assert.equal(effectiveMonthlyRate(1, 'mensal'), 0.01);
  assert.throws(() => effectiveMonthlyRate(-100, 'mensal'), /maior que -100/);
});

test('normaliza anos em meses inteiros e aplica limites', () => {
  assert.equal(normalizeMonths(2, 'anos'), 24);
  assert.equal(normalizeMonths(1.5, 'anos'), 18);
  assert.throws(() => normalizeMonths(1.1, 'meses'), /inteira de meses/);
  assert.throws(() => normalizeMonths(1201, 'meses'), /máximo/);
});

test('juros compostos consideram aportes no fim do mês', () => {
  const result = calculateCompoundInterest(1000, 100, 1, 'mensal', 2, 'meses');
  assert.equal(result.finalAmount, 1221.1);
  assert.equal(result.totalInvested, 1200);
  assert.equal(result.totalInterest, 21.1);
  assert.deepEqual(result.evolution.map(row => row.balance), [1110, 1221.1]);
});

test('juros compostos validam ausência de capital e estouro numérico', () => {
  assert.throws(() => calculateCompoundInterest(0, 0, 1, 'mensal', 1, 'meses'), /capital inicial ou um aporte/);
  assert.throws(() => calculateCompoundInterest(Number.MAX_VALUE, 0, 100, 'mensal', 2, 'meses'), /grandes demais/);
  assert.equal(calculateCompoundInterest(100, 0, -50, 'mensal', 1, 'meses').finalAmount, 50);
});

test('simulador compara exatamente três cenários informados', () => {
  const scenarios = simulateInvestmentScenarios(1000, 0, [0, 10, 20], 'anual', 1, 'anos');
  assert.equal(scenarios.length, 3);
  assert.equal(scenarios[0].finalAmount, 1000);
  assert.equal(scenarios[1].finalAmount, 1100);
  assert.equal(scenarios[2].finalAmount, 1200);
  assert.throws(() => simulateInvestmentScenarios(100, 0, [1, 2], 'anual', 1, 'anos'), /três cenários/);
});

test('Sistema Price calcula prestação e tabela de amortização', () => {
  const result = calculatePriceFinancing(1000, 1, 'mensal', 2);
  assert.equal(result.payment, 507.51);
  assert.equal(result.totalPaid, 1015.02);
  assert.equal(result.totalInterest, 15.02);
  assert.deepEqual(result.schedule.map(row => row.balance), [502.49, 0]);
});

test('Sistema Price trata taxa zero e ajusta a última parcela', () => {
  const result = calculatePriceFinancing(1000, 0, 'mensal', 3);
  assert.equal(result.payment, 333.33);
  assert.equal(result.totalPaid, 1000);
  assert.equal(result.totalInterest, 0);
  assert.equal(result.schedule.at(-1).payment, 333.34);
});

test('financiamento rejeita taxa negativa e parcelas inválidas', () => {
  assert.throws(() => calculatePriceFinancing(1000, -1, 'mensal', 12), /negativo/);
  assert.throws(() => calculatePriceFinancing(1000, 1, 'mensal', 12.5), /inteiro/);
  assert.throws(() => calculatePriceFinancing(0, 1, 'mensal', 12), /maior que zero/);
});
