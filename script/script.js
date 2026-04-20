let chartInstance = null;

document.getElementById('calculateBtn').addEventListener('click', () => {
  const initialAmount = parseFloat(document.getElementById('initialAmount').value);
  const monthlyAddition = parseFloat(document.getElementById('monthlyAddition').value);
  const annualRate = parseFloat(document.getElementById('annualRate').value);
  const years = parseFloat(document.getElementById('years').value);

  if (
    isNaN(initialAmount) || isNaN(monthlyAddition) ||
    isNaN(annualRate) || isNaN(years) ||
    years < 1
  ) {
    alert('Please fill in all fields with valid values.');
    return;
  }

  const rate = annualRate / 100;
  const labels = [];
  const data = [];

  // Annual compounding with support for fractional years
  // Use monthly steps internally for accuracy, sample at each whole/fractional year mark
  const monthlyRate = Math.pow(1 + rate, 1 / 12) - 1;
  const totalMonths = Math.round(years * 12);
  let balance = initialAmount;
  labels.push('Year 0');
  data.push(parseFloat(balance.toFixed(2)));

  for (let month = 1; month <= totalMonths; month++) {
    balance = balance * (1 + monthlyRate) + monthlyAddition;
    const yearMark = parseFloat((month / 12).toFixed(10));
    const expectedMarks = [];
    // collect year marks to plot
    const step = years <= 20 ? 1 : years <= 50 ? 2 : 5;
    for (let y = step; y <= years; y += step) expectedMarks.push(parseFloat(y.toFixed(10)));
    if (!expectedMarks.includes(parseFloat(years.toFixed(10)))) expectedMarks.push(parseFloat(years.toFixed(10)));
    if (expectedMarks.some(m => Math.abs(m - yearMark) < 0.001)) {
      labels.push(`Year ${parseFloat(yearMark.toFixed(2))}`);
      data.push(parseFloat(balance.toFixed(2)));
    }
  }

  renderChart(labels, data);
  renderSummary(initialAmount, monthlyAddition, years, data);
});

function renderChart(labels, data) {
  const chartArea = document.getElementById('chartArea');
  chartArea.classList.add('visible');

  if (chartInstance) {
    chartInstance.destroy();
  }

  const ctx = document.getElementById('growthChart').getContext('2d');

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Portfolio Value ($)',
          data,
          borderColor: '#7c6ff7',
          backgroundColor: (ctx) => {
            const canvas = ctx.chart.ctx;
            const gradient = canvas.createLinearGradient(0, 0, 0, 320);
            gradient.addColorStop(0, 'rgba(124, 111, 247, 0.35)');
            gradient.addColorStop(1, 'rgba(0, 229, 176, 0.04)');
            return gradient;
          },
          borderWidth: 3,
          pointRadius: data.length <= 21 ? 4 : 0,
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
      plugins: {
        legend: {
          labels: { color: '#e0e0e0' },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` $${ctx.parsed.y.toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#a09bc8' },
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
            callback: (value) => '$' + value.toLocaleString(),
          },
          grid: { color: 'rgba(124,111,247,0.1)' },
          title: {
            display: true,
            text: 'Amount ($)',
            color: '#a09bc8',
          },
        },
      },
    },
  });
}

function renderSummary(initialAmount, monthlyAddition, years, data) {
  const finalValue = data[data.length - 1];
  const totalContributions = initialAmount + monthlyAddition * years * 12;
  const totalInterest = finalValue - totalContributions;

  document.getElementById('summary').innerHTML = `
    <div class="summary-card">
      <div class="label">Total Contributed</div>
      <div class="value">$${totalContributions.toLocaleString()}</div>
    </div>
    <div class="summary-card">
      <div class="label">Interest Earned</div>
      <div class="value">$${Math.max(0, totalInterest).toLocaleString()}</div>
    </div>
    <div class="summary-card">
      <div class="label">Final Value</div>
      <div class="value" style="color:#00e5b0">$${finalValue.toLocaleString()}</div>
    </div>
  `;
}
