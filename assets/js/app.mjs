import {
  calculateProfit, calculateSalePrice, calculateMargin, percentOf,
  percentChange, percentRatio, calculateDiscount, parseBrazilianNumber,
  calculateCompoundInterest, simulateInvestmentScenarios, calculatePriceFinancing
} from './calculations.mjs';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const percent = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const fmtMoney = value => money.format(value);
const fmtPercent = value => value === null ? 'Não calculável' : `${percent.format(value)}%`;

export function parseBR(value) {
  return parseBrazilianNumber(value);
}

const calculators = {
  lucro(values) {
    const result = calculateProfit(values.custo, values.venda);
    return {
      title: result.profit >= 0 ? 'Lucro da venda' : 'Prejuízo da venda',
      primary: fmtMoney(result.profit),
      rows: [['Margem sobre a venda', fmtPercent(result.margin)], ['Markup sobre o custo', fmtPercent(result.markup)]],
      formula: `Lucro = ${fmtMoney(values.venda)} − ${fmtMoney(values.custo)} = ${fmtMoney(result.profit)}`
    };
  },
  'preco-venda'(values) {
    const result = calculateSalePrice(values.custo, values.despesas, values.taxas, values.margem);
    return {
      title: 'Preço de venda sugerido', primary: fmtMoney(result.salePrice),
      rows: [['Custo total', fmtMoney(result.baseCost)], ['Taxas no preço', fmtMoney(result.feesValue)], ['Lucro desejado', fmtMoney(result.profit)]],
      formula: `Preço = (${fmtMoney(values.custo)} + ${fmtMoney(values.despesas)}) ÷ [1 − (${decimal.format(values.taxas)}% + ${decimal.format(values.margem)}%)] = ${fmtMoney(result.salePrice)}`
    };
  },
  margem(values) {
    const result = calculateMargin(values.receita, values.custo);
    return {
      title: 'Margem de lucro', primary: fmtPercent(result.margin),
      rows: [['Lucro', fmtMoney(result.profit)], ['Markup sobre o custo', fmtPercent(result.markup)]],
      formula: `Margem = (${fmtMoney(values.receita)} − ${fmtMoney(values.custo)}) ÷ ${fmtMoney(values.receita)} × 100 = ${fmtPercent(result.margin)}`
    };
  },
  porcentagem(values, form) {
    const mode = form.elements.tipo.value;
    if (mode === 'de') {
      const answer = percentOf(values.a, values.b);
      return { title: 'Resultado', primary: fmtMoney(answer), rows: [], formula: `${decimal.format(values.a)}% de ${fmtMoney(values.b)} = ${fmtMoney(answer)}` };
    }
    if (mode === 'variacao') {
      const answer = percentChange(values.a, values.b);
      return { title: 'Variação percentual', primary: fmtPercent(answer), rows: [['Sentido', answer >= 0 ? 'Aumento' : 'Redução']], formula: `(${decimal.format(values.b)} − ${decimal.format(values.a)}) ÷ |${decimal.format(values.a)}| × 100 = ${fmtPercent(answer)}` };
    }
    const answer = percentRatio(values.a, values.b);
    return { title: 'Representação percentual', primary: fmtPercent(answer), rows: [], formula: `${decimal.format(values.a)} ÷ ${decimal.format(values.b)} × 100 = ${fmtPercent(answer)}` };
  },
  desconto(values) {
    const result = calculateDiscount(values.original, values.desconto);
    return { title: 'Preço final', primary: fmtMoney(result.finalPrice), rows: [['Economia', fmtMoney(result.discountValue)]], formula: `${fmtMoney(values.original)} − (${decimal.format(values.desconto)}% × ${fmtMoney(values.original)}) = ${fmtMoney(result.finalPrice)}` };
  },
  'juros-compostos'(values, form) {
    const rateUnit = form.elements.unidadeTaxa.value;
    const periodUnit = form.elements.unidadePeriodo.value;
    const result = calculateCompoundInterest(values.capital, values.aporte, values.taxa, rateUnit, values.periodo, periodUnit);
    return {
      title: 'Montante final', primary: fmtMoney(result.finalAmount),
      rows: [['Capital investido', fmtMoney(result.totalInvested)], ['Juros acumulados', fmtMoney(result.totalInterest)], ['Taxa efetiva mensal', fmtPercent(result.monthlyRate * 100)]],
      formula: `Saldo do mês = saldo anterior × (1 + taxa mensal) + aporte no fim do mês. Foram simulados ${result.months} meses.`,
      table: { label: 'Evolução mensal dos juros compostos', headers: ['Mês', 'Juros', 'Aporte', 'Saldo'], rows: result.evolution.map(row => [row.month, fmtMoney(row.interest), fmtMoney(row.contribution), fmtMoney(row.balance)]) }
    };
  },
  investimento(values, form) {
    const rateUnit = form.elements.unidadeTaxa.value;
    const periodUnit = form.elements.unidadePeriodo.value;
    const scenarios = simulateInvestmentScenarios(values.inicial, values.aporte, [values.taxa1, values.taxa2, values.taxa3], rateUnit, values.periodo, periodUnit);
    const reference = scenarios[0];
    return {
      title: 'Patrimônio no cenário 1', primary: fmtMoney(reference.finalAmount),
      rows: [['Capital aportado', fmtMoney(reference.totalInvested)], ['Rendimento bruto estimado', fmtMoney(reference.totalInterest)], ['Prazo simulado', `${reference.months} meses`]],
      formula: 'Cada cenário capitaliza sua taxa efetiva mensal e considera os aportes no fim de cada mês.',
      note: 'Simulação educativa: os resultados não são previsão de retorno nem recomendação de investimento.',
      table: { label: 'Comparação dos cenários informados', headers: ['Cenário', 'Taxa informada', 'Patrimônio', 'Rendimento bruto'], rows: scenarios.map(item => [item.name, `${decimal.format(item.rate)}% ${rateUnit === 'anual' ? 'ao ano' : 'ao mês'}`, fmtMoney(item.finalAmount), fmtMoney(item.totalInterest)]) }
    };
  },
  financiamento(values, form) {
    const rateUnit = form.elements.unidadeTaxa.value;
    const result = calculatePriceFinancing(values.valor, values.taxa, rateUnit, values.parcelas);
    return {
      title: 'Prestação pelo Sistema Price', primary: fmtMoney(result.payment),
      rows: [['Total pago', fmtMoney(result.totalPaid)], ['Total de juros', fmtMoney(result.totalInterest)], ['Taxa efetiva mensal', fmtPercent(result.monthlyRate * 100)]],
      formula: 'Prestação = principal × i ÷ [1 − (1 + i)⁻ⁿ], usando a taxa efetiva mensal.',
      note: 'A simulação não inclui tarifas, seguros, impostos nem outros componentes do Custo Efetivo Total (CET).',
      table: { label: 'Tabela de amortização pelo Sistema Price', headers: ['Parcela', 'Prestação', 'Juros', 'Amortização', 'Saldo'], rows: result.schedule.map(row => [row.installment, fmtMoney(row.payment), fmtMoney(row.interest), fmtMoney(row.amortization), fmtMoney(row.balance)]) }
    };
  }
};

function renderResult(container, data) {
  const table = data.table ? `<div class="result-table-wrap"><table><caption>${data.table.label}</caption><thead><tr>${data.table.headers.map(header => `<th scope="col">${header}</th>`).join('')}</tr></thead><tbody>${data.table.rows.map(row => `<tr>${row.map((cell, index) => index === 0 ? `<th scope="row">${cell}</th>` : `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '';
  container.innerHTML = `<p class="result-label">${data.title}</p><p class="result-value">${data.primary}</p>${data.rows.length ? `<dl>${data.rows.map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`).join('')}</dl>` : ''}<p class="formula"><strong>Fórmula aplicada:</strong> ${data.formula}</p>${data.note ? `<p class="result-note">${data.note}</p>` : ''}${table}<button class="button button-secondary share" type="button">Compartilhar resultado</button><p class="share-status" aria-live="polite"></p>`;
  container.hidden = false;
  container.focus();
  container.querySelector('.share').addEventListener('click', async () => {
    const text = `${data.title}: ${data.primary}. Calculado no CalculaNegócio.`;
    const status = container.querySelector('.share-status');
    try {
      if (navigator.share) await navigator.share({ title: 'Resultado — CalculaNegócio', text, url: location.href });
      else { await navigator.clipboard.writeText(`${text} ${location.href}`); status.textContent = 'Resultado copiado.'; }
    } catch (error) { if (error.name !== 'AbortError') status.textContent = 'Não foi possível compartilhar neste navegador.'; }
  });
}

document.querySelectorAll('[data-calculator]').forEach(form => {
  const result = document.querySelector('#resultado');
  form.addEventListener('submit', event => {
    event.preventDefault();
    const error = form.querySelector('.form-error');
    error.textContent = '';
    try {
      const values = {};
      form.querySelectorAll('[data-number]').forEach(input => {
        const value = parseBR(input.value);
        if (!Number.isFinite(value)) throw new RangeError(`Preencha “${input.labels[0].textContent.replace('*', '').trim()}” com um número válido.`);
        values[input.name] = value;
      });
      renderResult(result, calculators[form.dataset.calculator](values, form));
    } catch (exception) {
      result.hidden = true;
      error.textContent = exception.message;
      error.focus();
    }
  });
  form.addEventListener('reset', () => {
    setTimeout(() => { result.hidden = true; result.innerHTML = ''; form.querySelector('.form-error').textContent = ''; }, 0);
  });
});

const percentageType = document.querySelector('#tipo');
if (percentageType) {
  const labels = {
    de: ['Porcentagem A (%) *', 'Valor base B (R$) *', 'Ex.: 15', 'Ex.: 200,00'],
    variacao: ['Valor inicial A *', 'Valor final B *', 'Ex.: 80', 'Ex.: 100'],
    representa: ['Parte A *', 'Total B *', 'Ex.: 30', 'Ex.: 120']
  };
  const updatePercentageFields = () => {
    const [labelA, labelB, placeholderA, placeholderB] = labels[percentageType.value];
    const inputA = document.querySelector('#a');
    const inputB = document.querySelector('#b');
    inputA.labels[0].textContent = labelA;
    inputB.labels[0].textContent = labelB;
    inputA.placeholder = placeholderA;
    inputB.placeholder = placeholderB;
  };
  percentageType.addEventListener('change', updatePercentageFields);
  updatePercentageFields();
}

const toolSearch = document.querySelector('#busca-calculadoras');
if (toolSearch) {
  const tools = [...document.querySelectorAll('[data-tool]')];
  const groups = [...document.querySelectorAll('[data-tool-group]')];
  const status = document.querySelector('#status-busca');
  const empty = document.querySelector('#sem-resultados');
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
  const filterTools = () => {
    const query = normalize(toolSearch.value);
    let visible = 0;
    tools.forEach(tool => {
      const matches = !query || normalize(tool.dataset.tool).includes(query) || normalize(tool.textContent).includes(query);
      tool.hidden = !matches;
      if (matches) visible += 1;
    });
    groups.forEach(group => { group.hidden = !group.querySelector('[data-tool]:not([hidden])'); });
    empty.hidden = visible !== 0;
    status.textContent = query ? `${visible} ${visible === 1 ? 'calculadora encontrada' : 'calculadoras encontradas'}.` : '';
  };
  toolSearch.addEventListener('input', filterTools);
}

const navButton = document.querySelector('.nav-toggle');
if (navButton) navButton.addEventListener('click', () => {
  const nav = document.querySelector('#menu-principal');
  const open = navButton.getAttribute('aria-expanded') === 'true';
  navButton.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('open', !open);
});

document.querySelector('#ano')?.append(String(new Date().getFullYear()));
