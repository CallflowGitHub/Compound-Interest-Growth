let chartInstance = null;
let activeCurrency = 'USD'; // 'USD' or 'ILS'

// Currency toggle
document.querySelectorAll('.currency-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.currency-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCurrency = btn.dataset.currency;
    const sym = activeCurrency === 'ILS' ? '₪' : '$';
    document.getElementById('labelInitial').textContent = `Initial Amount (${sym})`;
    document.getElementById('labelMonthly').textContent = `Monthly Addition (${sym})`;
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('calculateBtn').click();
});

document.getElementById('calculateBtn').addEventListener('click', () => {
  const initialAmount = parseFloat(document.getElementById('initialAmount').value);
  const monthlyAddition = parseFloat(document.getElementById('monthlyAddition').value);
  const annualRate = parseFloat(document.getElementById('annualRate').value);
  const years = parseFloat(document.getElementById('years').value);

  if (
    isNaN(initialAmount) || isNaN(monthlyAddition) ||
    isNaN(annualRate) || isNaN(years) ||
    years < 0.1
  ) {
    alert('Please fill in all fields with valid values.');
    return;
  }

  const rate = annualRate / 100;
  const chartData = [];

  const totalYears = Math.floor(years);
  const remainingMonths = Math.round((years - totalYears) * 12);
  const totalMonths = totalYears * 12 + remainingMonths;
  const step = years <= 20 ? 1 : years <= 50 ? 2 : 5;

  // Pre-build set of year marks to plot
  const yearMarksToPlot = new Set();
  for (let y = step; y < years; y += step) yearMarksToPlot.add(y);
  yearMarksToPlot.add(totalYears);

  let balance = initialAmount;
  chartData.push({ x: 0, y: parseFloat(balance.toFixed(2)) });

  // Annual compounding: interest applied once per year, contributions added at end of year
  for (let year = 1; year <= totalYears; year++) {
    balance = balance * (1 + rate) + monthlyAddition * 12;
    if (yearMarksToPlot.has(year)) {
      chartData.push({ x: year, y: parseFloat(balance.toFixed(2)) });
    }
  }

  // Handle remaining partial year (contributions added, interest prorated)
  if (remainingMonths > 0) {
    balance = balance * Math.pow(1 + rate, remainingMonths / 12) + monthlyAddition * remainingMonths;
    chartData.push({ x: parseFloat(years.toFixed(4)), y: parseFloat(balance.toFixed(2)) });
  }

  renderChart(chartData, years, activeCurrency);
  renderSummary(initialAmount, monthlyAddition, annualRate, years, totalMonths, chartData, activeCurrency);
});

function renderChart(chartData, years, currency) {
  const sym = currency === 'ILS' ? '₪' : '$';
  const chartArea = document.getElementById('chartArea');
  chartArea.classList.add('visible');

  if (chartInstance) {
    chartInstance.destroy();
  }

  const ctx = document.getElementById('growthChart').getContext('2d');

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Portfolio Value',
          data: chartData,
          borderColor: '#7c6ff7',
          backgroundColor: (ctx) => {
            const canvas = ctx.chart.ctx;
            const gradient = canvas.createLinearGradient(0, 0, 0, 320);
            gradient.addColorStop(0, 'rgba(124, 111, 247, 0.35)');
            gradient.addColorStop(1, 'rgba(0, 229, 176, 0.04)');
            return gradient;
          },
          borderWidth: 3,
          pointRadius: chartData.length <= 21 ? 5 : 0,
          pointHoverRadius: 7,
          pointBackgroundColor: '#00e5b0',
          pointBorderColor: '#7c6ff7',
          fill: true,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#e0e0e0' },
        },
        tooltip: {
          callbacks: {
            title: (items) => `Year ${items[0].parsed.x}`,
            label: (ctx) => ` ${sym}${ctx.parsed.y.toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          min: 0,
          max: years,
          ticks: {
            color: '#a09bc8',
            stepSize: years <= 20 ? 1 : years <= 50 ? 2 : 5,
            callback: (value) => `Year ${value}`,
          },
          grid: { color: 'rgba(124,111,247,0.1)' },
          title: {
            display: true,
            text: 'Years',
            color: '#a09bc8',
          },
        },
        y: {
          ticks: {
            color: '#a09bc8',
            callback: (value) => sym + value.toLocaleString(),
          },
          grid: { color: 'rgba(124,111,247,0.1)' },
          title: {
            display: true,
            text: `Amount (${sym})`,
            color: '#a09bc8',
          },
        },
      },
    },
  });
}

async function renderSummary(initialAmount, monthlyAddition, annualRate, years, totalMonths, chartData, currency) {
  const sym = currency === 'ILS' ? '₪' : '$';
  const finalValue = chartData[chartData.length - 1].y;
  const totalContributions = initialAmount + monthlyAddition * totalMonths;
  const totalInterest = finalValue - totalContributions;
  const monthlyPassive = parseFloat((finalValue * (annualRate / 100) / 12 * 0.75).toFixed(2));

  // Monthly income card: if ILS mode, show directly; if USD, convert to ILS
  let monthlyIncomeHTML;
  if (currency === 'ILS') {
    monthlyIncomeHTML = `<div class="value" style="color:#f9c846">${sym}${monthlyPassive.toLocaleString()}</div>`;
  } else {
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const rateData = await response.json();
      if (!rateData.rates || !rateData.rates.ILS) throw new Error('ILS rate not found in response');
      const ilsRate = rateData.rates.ILS;
      const monthlyPassiveILS = parseFloat((monthlyPassive * ilsRate).toFixed(2));
      monthlyIncomeHTML = `
        <div class="value" style="color:#f9c846">₪${monthlyPassiveILS.toLocaleString()}</div>
        <div class="exchange-rate">1 USD = ₪${ilsRate.toFixed(2)}</div>
      `;
    } catch (err) {
      monthlyIncomeHTML = `
        <div class="value" style="color:#f9c846">$${monthlyPassive.toLocaleString()}</div>
        <div class="convert-error">Couldn't convert to New Israeli Shekels: ${err.message}</div>
      `;
    }
  }

  document.getElementById('summary').innerHTML = `
    <div class="summary-card">
      <div class="label">Total Contributed</div>
      <div class="value">${sym}${totalContributions.toLocaleString()}</div>
    </div>
    <div class="summary-card">
      <div class="label">Interest Earned</div>
      <div class="value">${sym}${Math.max(0, totalInterest).toLocaleString()}</div>
    </div>
    <div class="summary-card">
      <div class="label">Final Value</div>
      <div class="value" style="color:#00e5b0">${sym}${finalValue.toLocaleString()}</div>
    </div>
    <div class="summary-card">
      <div class="label">Net Monthly Income</div>
      ${monthlyIncomeHTML}
    </div>
  `;
}
