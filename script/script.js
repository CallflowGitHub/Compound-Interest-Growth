let chartInstance = null;
let activeCurrency = 'USD'; // 'USD' or 'ILS'
let activeTheme = 'default';

// Theme definitions for chart colors
const themeColors = {
  default: {
    line: '#7c6ff7',
    gradientTop: 'rgba(124, 111, 247, 0.35)',
    gradientBottom: 'rgba(0, 229, 176, 0.04)',
    point: '#00e5b0',
    pointBorder: '#7c6ff7',
    text: '#e0e0e0',
    label: '#a09bc8',
    grid: 'rgba(124,111,247,0.1)',
    final: '#00e5b0',
    income: '#f9c846',
  },
  finance: {
    line: '#3fb950',
    gradientTop: 'rgba(63, 185, 80, 0.35)',
    gradientBottom: 'rgba(240, 136, 62, 0.04)',
    point: '#f0883e',
    pointBorder: '#3fb950',
    text: '#c9d1d9',
    label: '#8b949e',
    grid: 'rgba(63, 185, 80, 0.08)',
    final: '#f0883e',
    income: '#f9c846',
  },
  beach: {
    line: '#e67e22',
    gradientTop: 'rgba(230, 126, 34, 0.3)',
    gradientBottom: 'rgba(22, 160, 133, 0.05)',
    point: '#16a085',
    pointBorder: '#e67e22',
    text: '#2c3e50',
    label: '#5d6d7e',
    grid: 'rgba(44, 62, 80, 0.1)',
    final: '#16a085',
    income: '#d4a017',
  },
};

// Theme toggle
document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTheme = btn.dataset.theme;

    // Remove all theme classes, add new one
    document.body.classList.remove('theme-finance', 'theme-beach');
    if (activeTheme !== 'default') {
      document.body.classList.add('theme-' + activeTheme);
    }

    applyThemeBackground(activeTheme);

    // Re-render chart if it exists
    if (chartInstance) {
      document.getElementById('calculateBtn').click();
    }
  });
});

// Currency toggle
document.querySelectorAll('.currency-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.currency-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeCurrency = btn.dataset.currency;
    const sym = activeCurrency === 'ILS' ? '₪' : '$';
    document.getElementById('labelInitial').textContent = `Initial Amount (${sym})`;
    document.getElementById('labelMonthly').textContent = `Monthly Addition (${sym})`;

    // Auto-recalculate if all fields have values
    const initialVal = document.getElementById('initialAmount').value;
    const monthlyVal = document.getElementById('monthlyAddition').value;
    if (initialVal !== '' && monthlyVal !== '') {
      document.getElementById('calculateBtn').click();
    }
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('calculateBtn').click();
});

// Rate slider: update display and auto-recalculate
const annualRateSlider = document.getElementById('annualRate');
const annualRateDisplay = document.getElementById('annualRateDisplay');
let _sliderTriggered = false;

annualRateSlider.addEventListener('input', () => {
  annualRateDisplay.textContent = annualRateSlider.value;
  _sliderTriggered = true;
  document.getElementById('calculateBtn').click();
  _sliderTriggered = false;
});

// Years slider: update display and auto-recalculate
const yearsSlider = document.getElementById('years');
const yearsDisplay = document.getElementById('yearsDisplay');

yearsSlider.addEventListener('input', () => {
  yearsDisplay.textContent = yearsSlider.value;
  _sliderTriggered = true;
  document.getElementById('calculateBtn').click();
  _sliderTriggered = false;
});

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
    if (!_sliderTriggered) alert('Please fill in all fields with valid values.');
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
  const tc = themeColors[activeTheme];
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
          borderColor: tc.line,
          backgroundColor: (ctx) => {
            const canvas = ctx.chart.ctx;
            const gradient = canvas.createLinearGradient(0, 0, 0, 320);
            gradient.addColorStop(0, tc.gradientTop);
            gradient.addColorStop(1, tc.gradientBottom);
            return gradient;
          },
          borderWidth: 3,
          pointRadius: chartData.length <= 21 ? 5 : 0,
          pointHoverRadius: 7,
          pointBackgroundColor: tc.point,
          pointBorderColor: tc.pointBorder,
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
          labels: { color: tc.text },
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
            color: tc.label,
            stepSize: years <= 20 ? 1 : years <= 50 ? 2 : 5,
            callback: (value) => `Year ${value}`,
          },
          grid: { color: tc.grid },
          title: {
            display: true,
            text: 'Years',
            color: tc.label,
          },
        },
        y: {
          ticks: {
            color: tc.label,
            callback: (value) => sym + value.toLocaleString(),
          },
          grid: { color: tc.grid },
          title: {
            display: true,
            text: `Amount (${sym})`,
            color: tc.label,
          },
        },
      },
    },
  });
}

async function renderSummary(initialAmount, monthlyAddition, annualRate, years, totalMonths, chartData, currency) {
  const sym = currency === 'ILS' ? '₪' : '$';
  const tc = themeColors[activeTheme];
  const finalValue = chartData[chartData.length - 1].y;
  const totalContributions = initialAmount + monthlyAddition * totalMonths;
  const totalInterest = finalValue - totalContributions;
  const monthlyPassive = parseFloat((finalValue * (annualRate / 100) / 12 * 0.75).toFixed(2));

  // Monthly income card: if ILS mode, show directly; if USD, convert to ILS
  let monthlyIncomeHTML;
  if (currency === 'ILS') {
    monthlyIncomeHTML = `<div class="value" style="color:${tc.income}">${sym}${monthlyPassive.toLocaleString()}</div>`;
  } else {
    try {
      const response = await fetch('https://open.er-api.com/v6/latest/USD');
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const rateData = await response.json();
      if (!rateData.rates || !rateData.rates.ILS) throw new Error('ILS rate not found in response');
      const ilsRate = rateData.rates.ILS;
      const monthlyPassiveILS = parseFloat((monthlyPassive * ilsRate).toFixed(2));
      monthlyIncomeHTML = `
        <div class="value" style="color:${tc.income}">₪${monthlyPassiveILS.toLocaleString()}</div>
        <div class="exchange-rate">1 USD = ₪${ilsRate.toFixed(2)}</div>
      `;
    } catch (err) {
      monthlyIncomeHTML = `
        <div class="value" style="color:${tc.income}">$${monthlyPassive.toLocaleString()}</div>
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
      <div class="value" style="color:${tc.final}">${sym}${finalValue.toLocaleString()}</div>
    </div>
    <div class="summary-card">
      <div class="label">Net Monthly Income</div>
      ${monthlyIncomeHTML}
    </div>
  `;
}

// ── Theme Background System ──────────────────────────────────────────────────

function applyThemeBackground(theme) {
  const bg = document.getElementById('themeBg');
  bg.innerHTML = '';

  if (window._financeResizeHandler) {
    window.removeEventListener('resize', window._financeResizeHandler);
    window._financeResizeHandler = null;
  }

  if (theme === 'finance') {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'width:100%;height:100%;display:block;';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    bg.appendChild(canvas);
    drawFinanceBg(canvas);

    window._financeResizeHandler = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawFinanceBg(canvas);
    };
    window.addEventListener('resize', window._financeResizeHandler);

  } else if (theme === 'beach') {
    bg.innerHTML = getBeachSVG();
  }
}

// ── Finance Canvas Background ────────────────────────────────────────────────

function drawFinanceBg(canvas) {
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  // Deterministic pseudo-random for consistent chart shape
  let seed = 2024;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  // Generate 120 candles with upward bias
  const N = 120;
  const candles = [];
  let price = 340;
  for (let i = 0; i < N; i++) {
    const open = price;
    const change = (rand() - 0.47) * 12;
    const close = open + change;
    const wick = rand() * 6;
    const high = Math.max(open, close) + wick;
    const low  = Math.min(open, close) - wick;
    price = close;
    candles.push({ open, high, low, close });
  }

  // Layout
  const padL = 0, padR = 48, padT = Math.round(H * 0.06);
  const volH  = Math.round(H * 0.10);
  const rsiH  = Math.round(H * 0.04);
  const padB  = volH + rsiH + Math.round(H * 0.04);
  const chartH = H - padT - padB;
  const cW    = W - padL - padR;
  const candleW = cW / N;
  const bodyW = Math.max(candleW * 0.55, 2);

  const allPrices = candles.flatMap(c => [c.high, c.low]);
  const minP = Math.min(...allPrices) - 5;
  const maxP = Math.max(...allPrices) + 5;
  const pY = p => padT + chartH - (p - minP) / (maxP - minP) * chartH;
  const xOf = i => padL + (i + 0.5) * candleW;

  // ── Grid ──
  for (let i = 0; i <= 6; i++) {
    const y = padT + chartH * (i / 6);
    ctx.strokeStyle = 'rgba(63,185,80,0.07)';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    const pLabel = (maxP - (maxP - minP) * i / 6).toFixed(0);
    ctx.fillStyle = 'rgba(139,148,158,0.18)';
    ctx.font = '10px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(pLabel, W - 4, y - 2);
  }
  for (let i = 0; i <= 12; i++) {
    const x = padL + cW * (i / 12);
    ctx.strokeStyle = 'rgba(63,185,80,0.04)';
    ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + chartH); ctx.stroke();
  }
  ctx.textAlign = 'left';

  // ── Bollinger bands (20-period, 2σ) ──
  const bbUp = [], bbDn = [];
  for (let i = 19; i < N; i++) {
    const sl = candles.slice(i - 19, i + 1).map(c => c.close);
    const mean = sl.reduce((s, v) => s + v, 0) / 20;
    const std  = Math.sqrt(sl.reduce((s, v) => s + (v - mean) ** 2, 0) / 20);
    bbUp.push({ i, v: mean + 2 * std });
    bbDn.push({ i, v: mean - 2 * std });
  }
  ctx.beginPath();
  bbUp.forEach(({ i, v }, idx) => idx === 0 ? ctx.moveTo(xOf(i), pY(v)) : ctx.lineTo(xOf(i), pY(v)));
  bbDn.slice().reverse().forEach(({ i, v }) => ctx.lineTo(xOf(i), pY(v)));
  ctx.closePath();
  ctx.fillStyle = 'rgba(63,185,80,0.025)';
  ctx.fill();

  // ── MA 50 ──
  ctx.strokeStyle = 'rgba(240,136,62,0.18)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  candles.forEach((c, i) => {
    if (i < 50) return;
    const ma = candles.slice(i - 50, i).reduce((s, c) => s + c.close, 0) / 50;
    i === 50 ? ctx.moveTo(xOf(i), pY(ma)) : ctx.lineTo(xOf(i), pY(ma));
  });
  ctx.stroke();

  // ── MA 20 ──
  ctx.strokeStyle = 'rgba(88,166,255,0.18)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  candles.forEach((c, i) => {
    if (i < 20) return;
    const ma = candles.slice(i - 20, i).reduce((s, c) => s + c.close, 0) / 20;
    i === 20 ? ctx.moveTo(xOf(i), pY(ma)) : ctx.lineTo(xOf(i), pY(ma));
  });
  ctx.stroke();

  // ── Area fill (price trend) ──
  ctx.beginPath();
  candles.forEach((c, i) => i === 0 ? ctx.moveTo(xOf(i), pY(c.close)) : ctx.lineTo(xOf(i), pY(c.close)));
  ctx.lineTo(xOf(N - 1), padT + chartH);
  ctx.lineTo(xOf(0), padT + chartH);
  ctx.closePath();
  const areaGrad = ctx.createLinearGradient(0, padT, 0, padT + chartH);
  areaGrad.addColorStop(0, 'rgba(63,185,80,0.07)');
  areaGrad.addColorStop(1, 'rgba(63,185,80,0.01)');
  ctx.fillStyle = areaGrad;
  ctx.fill();

  // ── Candlesticks ──
  candles.forEach((c, i) => {
    const x = xOf(i);
    const bull = c.close >= c.open;
    const col = bull ? 'rgba(63,185,80,0.22)' : 'rgba(248,81,73,0.22)';
    ctx.strokeStyle = col;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, pY(c.high)); ctx.lineTo(x, pY(c.low)); ctx.stroke();
    const bT = pY(Math.max(c.open, c.close));
    const bB = pY(Math.min(c.open, c.close));
    ctx.fillStyle = col;
    ctx.fillRect(x - bodyW / 2, bT, bodyW, Math.max(bB - bT, 1));
  });

  // ── Volume bars ──
  const volTop = H - padB + Math.round(H * 0.01);
  const volBot = volTop + volH - Math.round(H * 0.01);
  candles.forEach((c, i) => {
    const vol = 0.25 + rand() * 0.75;
    const vHeight = vol * (volBot - volTop);
    ctx.fillStyle = c.close >= c.open ? 'rgba(63,185,80,0.12)' : 'rgba(248,81,73,0.12)';
    ctx.fillRect(xOf(i) - bodyW / 2, volBot - vHeight, bodyW, vHeight);
  });
  // Volume divider
  ctx.strokeStyle = 'rgba(63,185,80,0.05)';
  ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.moveTo(0, volTop); ctx.lineTo(W, volTop); ctx.stroke();

  // ── RSI ──
  const rsiTop = volBot + Math.round(H * 0.01);
  const rsiBot = rsiTop + rsiH;
  const rsiVals = [];
  for (let i = 14; i < N; i++) {
    let gains = 0, losses = 0;
    for (let j = i - 13; j <= i; j++) {
      const d = candles[j].close - candles[j - 1].close;
      d > 0 ? (gains += d) : (losses -= d);
    }
    rsiVals.push({ i, rsi: 100 - 100 / (1 + gains / Math.max(losses, 0.001)) });
  }
  ctx.strokeStyle = 'rgba(240,136,62,0.14)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  rsiVals.forEach(({ i, rsi }, idx) => {
    const x = xOf(i);
    const y = rsiBot - (rsi / 100) * (rsiBot - rsiTop);
    idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  // RSI 70/30 levels
  [30, 50, 70].forEach(level => {
    ctx.strokeStyle = 'rgba(139,148,158,0.06)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    const y = rsiBot - (level / 100) * (rsiBot - rsiTop);
    ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  });
  ctx.setLineDash([]);

  // ── Ticker strip ──
  const tickers = [
    { s: 'AAPL', c: '+2.34%', up: true }, { s: 'MSFT', c: '+1.87%', up: true },
    { s: 'GOOGL', c: '-0.42%', up: false }, { s: 'AMZN', c: '+3.15%', up: true },
    { s: 'TSLA', c: '+5.23%', up: true },  { s: 'NVDA', c: '+4.71%', up: true },
    { s: 'META', c: '-1.08%', up: false }, { s: 'SPX',  c: '4521.2', up: true },
    { s: 'BTC',  c: '+6.44%', up: true },  { s: 'ETH',  c: '+4.22%', up: true },
  ];
  const tickerY = H - 4;
  ctx.font = 'bold 10px "Courier New", monospace';
  const spacing = W / tickers.length;
  tickers.forEach(({ s, c, up }, i) => {
    ctx.fillStyle = up ? 'rgba(63,185,80,0.2)' : 'rgba(248,81,73,0.2)';
    ctx.fillText(`${s} ${c}`, i * spacing + 8, tickerY);
  });

  // ── Legend labels ──
  ctx.font = '9px "Courier New", monospace';
  ctx.fillStyle = 'rgba(88,166,255,0.2)';
  ctx.fillText('MA20', 4, padT + 10);
  ctx.fillStyle = 'rgba(240,136,62,0.2)';
  ctx.fillText('MA50', 4, padT + 22);
  ctx.fillStyle = 'rgba(63,185,80,0.15)';
  ctx.fillText('BB', 4, padT + 34);
}

// ── Beach SVG Background ─────────────────────────────────────────────────────

function getBeachSVG() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
  <defs>
    <linearGradient id="bSky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0D47A1"/>
      <stop offset="35%" stop-color="#1565C0"/>
      <stop offset="65%" stop-color="#42A5F5"/>
      <stop offset="100%" stop-color="#90CAF9"/>
    </linearGradient>
    <linearGradient id="bOcean" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0277BD"/>
      <stop offset="100%" stop-color="#01579B"/>
    </linearGradient>
    <linearGradient id="bSand" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFECB3"/>
      <stop offset="100%" stop-color="#D4A017"/>
    </linearGradient>
    <radialGradient id="bSunGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFF9C4" stop-opacity="0.85"/>
      <stop offset="55%" stop-color="#FFE082" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="#FFE082" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="bShimmer" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="white" stop-opacity="0"/>
      <stop offset="30%"  stop-color="white" stop-opacity="0.07"/>
      <stop offset="55%"  stop-color="white" stop-opacity="0.12"/>
      <stop offset="80%"  stop-color="white" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="white" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Sky -->
  <rect width="1920" height="1080" fill="url(#bSky)"/>

  <!-- Sun glow -->
  <circle cx="1660" cy="175" r="165" fill="url(#bSunGlow)"/>
  <!-- Sun disc -->
  <circle cx="1660" cy="175" r="68" fill="#FFE082"/>
  <circle cx="1660" cy="175" r="57" fill="#FFD54F"/>
  <circle cx="1660" cy="175" r="46" fill="#FFCA28"/>
  <!-- Sun rays -->
  <g stroke="#FFE082" stroke-linecap="round" opacity="0.5">
    <line x1="1660" y1="84"  x2="1660" y2="56"  stroke-width="4"/>
    <line x1="1660" y1="266" x2="1660" y2="294" stroke-width="4"/>
    <line x1="1569" y1="175" x2="1541" y2="175" stroke-width="4"/>
    <line x1="1751" y1="175" x2="1779" y2="175" stroke-width="4"/>
    <line x1="1596" y1="101" x2="1576" y2="81"  stroke-width="3"/>
    <line x1="1724" y1="249" x2="1744" y2="269" stroke-width="3"/>
    <line x1="1724" y1="101" x2="1744" y2="81"  stroke-width="3"/>
    <line x1="1596" y1="249" x2="1576" y2="269" stroke-width="3"/>
  </g>

  <!-- Cloud 1 large left -->
  <g opacity="0.93">
    <ellipse cx="240" cy="122" rx="112" ry="52" fill="white"/>
    <ellipse cx="318" cy="104" rx="86"  ry="58" fill="white"/>
    <ellipse cx="170" cy="130" rx="82"  ry="46" fill="white"/>
    <ellipse cx="260" cy="148" rx="132" ry="36" fill="#F5FAFF"/>
    <!-- Shadow underside -->
    <ellipse cx="258" cy="148" rx="125" ry="20" fill="#D6E8F5" opacity="0.3"/>
  </g>

  <!-- Cloud 2 medium -->
  <g opacity="0.86">
    <ellipse cx="740" cy="88"  rx="92"  ry="44" fill="white"/>
    <ellipse cx="814" cy="72"  rx="74"  ry="50" fill="white"/>
    <ellipse cx="672" cy="96"  rx="68"  ry="38" fill="white"/>
    <ellipse cx="755" cy="112" rx="110" ry="32" fill="#F0F7FF"/>
    <ellipse cx="754" cy="112" rx="104" ry="22" fill="#D6E8F5" opacity="0.25"/>
  </g>

  <!-- Cloud 3 small -->
  <g opacity="0.74">
    <ellipse cx="1235" cy="102" rx="72" ry="34" fill="white"/>
    <ellipse cx="1290" cy="86"  rx="57" ry="38" fill="white"/>
    <ellipse cx="1183" cy="109" rx="54" ry="29" fill="white"/>
  </g>

  <!-- Ocean -->
  <path d="M0 558 L1920 558 L1920 838 Q960 814 0 838 Z" fill="url(#bOcean)"/>
  <rect x="0" y="558" width="1920" height="280" fill="url(#bShimmer)"/>

  <!-- Horizon softener -->
  <path d="M0 550 Q480 542 960 550 Q1440 558 1920 548 L1920 572 Q1440 582 960 574 Q480 566 0 576 Z" fill="rgba(255,255,255,0.1)"/>

  <!-- Waves -->
  <path d="M0 590 Q240 578 480 590 Q720 602 960 590 Q1200 578 1440 590 Q1680 602 1920 590"
        stroke="rgba(255,255,255,0.55)" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M0 618 Q200 607 400 618 Q600 629 800 618 Q1000 607 1200 618 Q1400 629 1600 618 Q1760 611 1920 617"
        stroke="rgba(255,255,255,0.35)" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M0 650 Q300 640 600 650 Q900 660 1200 650 Q1500 640 1920 648"
        stroke="rgba(255,255,255,0.22)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <path d="M0 682 Q320 674 640 682 Q960 690 1280 682 Q1600 674 1920 680"
        stroke="rgba(255,255,255,0.15)" stroke-width="1"   fill="none" stroke-linecap="round"/>
  <path d="M0 718 Q400 712 800 718 Q1200 724 1600 718 Q1760 715 1920 716"
        stroke="rgba(255,255,255,0.10)" stroke-width="1"   fill="none" stroke-linecap="round"/>

  <!-- Sailboat -->
  <g transform="translate(905,558)" opacity="0.5">
    <line x1="20" y1="6" x2="20" y2="-56" stroke="#795548" stroke-width="2"/>
    <path d="M-2 24 Q20 30 44 22 Q40 8 20 4 Z" fill="#C62828"/>
    <path d="M20 4 L12 -52 L40 4 Z" fill="white"/>
    <path d="M20 4 L24 -48 L48 4 Z" fill="#ECEFF1"/>
  </g>

  <!-- Sand -->
  <path d="M0 802 C320 782 640 796 960 785 C1280 774 1600 790 1920 778 L1920 1080 L0 1080 Z" fill="url(#bSand)"/>
  <!-- Wet sand strip near water -->
  <path d="M0 802 C320 782 640 796 960 785 C1280 774 1600 790 1920 778 L1920 812 C1600 824 1280 808 960 818 C640 828 320 816 0 834 Z" fill="rgba(160,120,50,0.22)"/>
  <!-- Dune highlight -->
  <path d="M0 814 C320 794 640 808 960 797 C1280 786 1600 802 1920 790" stroke="rgba(255,255,255,0.2)" stroke-width="4" fill="none"/>
  <!-- Shore foam -->
  <path d="M0 806 Q240 798 480 806 Q720 814 960 805 Q1200 796 1440 806 Q1680 816 1920 804"
        stroke="rgba(255,255,255,0.6)" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="M0 810 Q300 803 600 810 Q900 818 1200 808 Q1500 798 1920 808"
        stroke="rgba(255,255,255,0.3)" stroke-width="3" fill="none" stroke-linecap="round"/>

  <!-- ── LEFT PALM TREE ── -->
  <ellipse cx="155" cy="872" rx="55" ry="10" fill="rgba(0,0,0,0.08)" transform="rotate(-8,155,872)"/>
  <!-- Trunk -->
  <path d="M102 1080 C106 988 94 892 110 804 C120 746 104 702 122 654" stroke="#6D4C41" stroke-width="28" fill="none" stroke-linecap="round"/>
  <path d="M102 1080 C106 988 94 892 110 804 C120 746 104 702 122 654" stroke="#A1887F" stroke-width="14" fill="none" stroke-linecap="round" opacity="0.35"/>
  <path d="M109 1080 C112 988 101 892 116 804 C125 746 111 702 127 654" stroke="#BCAAA4" stroke-width="3"  fill="none" stroke-linecap="round" opacity="0.2"/>
  <!-- Bark rings -->
  <g stroke="#4E342E" stroke-width="3" fill="none" opacity="0.5">
    <path d="M95  984 Q108 978 118 984"/>
    <path d="M94  952 Q107 946 117 952"/>
    <path d="M93  920 Q106 914 116 920"/>
    <path d="M92  888 Q105 882 115 888"/>
    <path d="M93  856 Q106 850 115 856"/>
    <path d="M94  823 Q107 817 116 823"/>
    <path d="M96  791 Q109 785 118 791"/>
    <path d="M99  758 Q112 752 120 758"/>
    <path d="M102 725 Q115 719 122 725"/>
    <path d="M106 692 Q118 686 124 692"/>
  </g>
  <!-- Fronds -->
  <g fill="none" stroke-linecap="round">
    <path d="M122 654 C65 641 3 657 -38 681"   stroke="#1B5E20" stroke-width="15"/>
    <path d="M122 654 C65 641 3 657 -38 681"   stroke="#4CAF50" stroke-width="6" opacity="0.45"/>
    <path d="M122 654 C80 614 26 588 -10 574"  stroke="#1B5E20" stroke-width="14"/>
    <path d="M122 654 C80 614 26 588 -10 574"  stroke="#4CAF50" stroke-width="6" opacity="0.45"/>
    <path d="M122 654 C102 606 88 564 80 530"  stroke="#2E7D32" stroke-width="14"/>
    <path d="M122 654 C102 606 88 564 80 530"  stroke="#66BB6A" stroke-width="5" opacity="0.45"/>
    <path d="M122 654 C124 598 128 552 124 516" stroke="#2E7D32" stroke-width="13"/>
    <path d="M122 654 C152 610 196 578 234 562" stroke="#1B5E20" stroke-width="14"/>
    <path d="M122 654 C152 610 196 578 234 562" stroke="#4CAF50" stroke-width="6" opacity="0.45"/>
    <path d="M122 654 C170 652 224 666 274 684" stroke="#1B5E20" stroke-width="14"/>
    <path d="M122 654 C170 652 224 666 274 684" stroke="#4CAF50" stroke-width="6" opacity="0.45"/>
    <path d="M122 654 C100 670 74 692 52 714"  stroke="#33691E" stroke-width="12"/>
  </g>
  <!-- Coconuts -->
  <circle cx="109" cy="666" r="13" fill="#3E2723"/>
  <circle cx="126" cy="673" r="12" fill="#4E342E"/>
  <circle cx="114" cy="682" r="11" fill="#3E2723"/>

  <!-- ── RIGHT PALM TREE ── -->
  <ellipse cx="1768" cy="873" rx="52" ry="10" fill="rgba(0,0,0,0.08)" transform="rotate(8,1768,873)"/>
  <!-- Trunk -->
  <path d="M1832 1080 C1828 986 1842 888 1826 798 C1816 738 1832 692 1814 644" stroke="#6D4C41" stroke-width="28" fill="none" stroke-linecap="round"/>
  <path d="M1832 1080 C1828 986 1842 888 1826 798 C1816 738 1832 692 1814 644" stroke="#A1887F" stroke-width="14" fill="none" stroke-linecap="round" opacity="0.35"/>
  <path d="M1824 1080 C1821 986 1834 888 1819 798 C1810 738 1825 692 1808 644" stroke="#BCAAA4" stroke-width="3"  fill="none" stroke-linecap="round" opacity="0.2"/>
  <!-- Bark rings -->
  <g stroke="#4E342E" stroke-width="3" fill="none" opacity="0.5">
    <path d="M1821 982 Q1834 976 1844 982"/>
    <path d="M1822 950 Q1835 944 1844 950"/>
    <path d="M1821 918 Q1834 912 1843 918"/>
    <path d="M1820 886 Q1833 880 1842 886"/>
    <path d="M1820 853 Q1833 847 1841 853"/>
    <path d="M1819 820 Q1832 814 1840 820"/>
    <path d="M1818 788 Q1831 782 1839 788"/>
    <path d="M1818 756 Q1831 750 1838 756"/>
    <path d="M1817 723 Q1830 717 1837 723"/>
    <path d="M1816 690 Q1829 684 1835 690"/>
  </g>
  <!-- Fronds -->
  <g fill="none" stroke-linecap="round">
    <path d="M1814 644 C1862 632 1922 648 1962 672"  stroke="#1B5E20" stroke-width="15"/>
    <path d="M1814 644 C1862 632 1922 648 1962 672"  stroke="#4CAF50" stroke-width="6" opacity="0.45"/>
    <path d="M1814 644 C1860 604 1912 578 1948 562"  stroke="#1B5E20" stroke-width="14"/>
    <path d="M1814 644 C1860 604 1912 578 1948 562"  stroke="#4CAF50" stroke-width="6" opacity="0.45"/>
    <path d="M1814 644 C1836 596 1848 554 1844 520"  stroke="#2E7D32" stroke-width="14"/>
    <path d="M1814 644 C1812 588 1810 542 1813 506"  stroke="#2E7D32" stroke-width="13"/>
    <path d="M1814 644 C1774 602 1728 572 1694 556"  stroke="#1B5E20" stroke-width="14"/>
    <path d="M1814 644 C1774 602 1728 572 1694 556"  stroke="#4CAF50" stroke-width="6" opacity="0.45"/>
    <path d="M1814 644 C1764 644 1706 658 1658 676"  stroke="#1B5E20" stroke-width="14"/>
    <path d="M1814 644 C1764 644 1706 658 1658 676"  stroke="#4CAF50" stroke-width="6" opacity="0.45"/>
    <path d="M1814 644 C1836 660 1860 682 1876 704"  stroke="#33691E" stroke-width="12"/>
  </g>
  <!-- Coconuts -->
  <circle cx="1822" cy="657" r="13" fill="#3E2723"/>
  <circle cx="1806" cy="663" r="12" fill="#4E342E"/>
  <circle cx="1816" cy="672" r="11" fill="#3E2723"/>

  <!-- Seagulls -->
  <g fill="none" stroke="#1A2A3A" stroke-linecap="round">
    <g opacity="0.45" stroke-width="2.5">
      <path d="M440 188 C452 179 466 188"/>
      <path d="M448 186 C454 182 460 186"/>
    </g>
    <g opacity="0.40" stroke-width="2.5">
      <path d="M524 165 C538 156 552 165"/>
      <path d="M532 163 C538 159 544 163"/>
    </g>
    <g opacity="0.30" stroke-width="2">
      <path d="M862 213 C872 206 882 213"/>
    </g>
    <g opacity="0.28" stroke-width="2">
      <path d="M1095 190 C1105 183 1115 190"/>
    </g>
    <g opacity="0.22" stroke-width="2">
      <path d="M1360 155 C1369 148 1378 155"/>
    </g>
  </g>

  <!-- Beach umbrella -->
  <g transform="translate(960,800)">
    <line x1="0" y1="0" x2="-3" y2="74" stroke="#795548" stroke-width="7"/>
    <!-- Canopy -->
    <path d="M-74 0 C-50,-56 50,-56 74,0 Z" fill="#E53935"/>
    <path d="M-44,-48 C-18,-64 18,-64 44,-48" fill="white" opacity="0.18"/>
    <path d="M-74,0 C-25,-8 25,-8 74,0" fill="rgba(183,28,28,0.35)"/>
    <!-- Alternating white stripes -->
    <path d="M-74 0 C-50,-56 -22,-62 0,-58 C22,-62 50,-56 74,0 C48,-8 -48,-8 -74,0 Z" fill="none"/>
    <path d="M-15,-58 C-8,-56 8,-56 15,-58 C8,-60 -8,-60 -15,-58 Z" fill="white" opacity="0.25"/>
    <!-- Tip -->
    <circle cx="0" cy="-58" r="5" fill="#FFC107"/>
  </g>

  <!-- Lounge chair -->
  <g transform="translate(822,850)" opacity="0.75">
    <path d="M-56 0 L-56,-30 C-56,-34 -52,-37 -48,-37 L48,-40 C52,-40 56,-37 56,-33 L56,0 Z" fill="#FFF9C4" stroke="#F9A825" stroke-width="1.5"/>
    <line x1="-54" y1="-10" x2="54" y2="-11" stroke="#F9A825" stroke-width="1" opacity="0.6"/>
    <line x1="-54" y1="-20" x2="54" y2="-21" stroke="#F9A825" stroke-width="1" opacity="0.6"/>
    <path d="M-52 0 L-58,20 L-44,20 Z" fill="#8D6E63"/>
    <path d="M52  0 L58, 20 L44, 20 Z" fill="#8D6E63"/>
    <path d="M-48,-37 L-44,-72 C-44,-76 -40,-79 -36,-79 L36,-80 C40,-80 44,-77 44,-73 L48,-40" fill="#FFECB3" stroke="#F9A825" stroke-width="1.5"/>
    <path d="M-18,-73 C-18,-82 18,-82 18,-73 C18,-65 -18,-65 -18,-73 Z" fill="#FFCDD2"/>
  </g>

  <!-- Starfish -->
  <g transform="translate(478,868) rotate(20)" opacity="0.55">
    <path d="M0,-17 L3.8,-5.5 L17,-5.5 L7.5,2 L11,15 L0,8.5 L-11,15 L-7.5,2 L-17,-5.5 L-3.8,-5.5 Z" fill="#E67E22"/>
  </g>
  <g transform="translate(1455,882) rotate(-15)" opacity="0.42">
    <path d="M0,-11 L2.2,-3.4 L10,-3.4 L4.4,1.2 L6.6,9.6 L0,5.4 L-6.6,9.6 L-4.4,1.2 L-10,-3.4 L-2.2,-3.4 Z" fill="#E74C3C"/>
  </g>

  <!-- Shell -->
  <g transform="translate(1392,877) rotate(-20)" opacity="0.55">
    <path d="M0,0 C10,-9 26,-7 28,2 C30,11 22,19 11,17 C0,15 -6,7 0,0 Z" fill="#FDEBD0"/>
    <path d="M4,-5 C9,-1 13,5 11,9"  stroke="#C8A882" stroke-width="1.5" fill="none"/>
    <path d="M10,-6 C14,-2 16,4 14,7" stroke="#C8A882" stroke-width="1"   fill="none"/>
  </g>

  <!-- Pebbles -->
  <ellipse cx="680" cy="856" rx="8" ry="5" fill="#B0BEC5" opacity="0.38" transform="rotate(-18,680,856)"/>
  <ellipse cx="694" cy="851" rx="5" ry="4" fill="#90A4AE" opacity="0.32" transform="rotate(10,694,851)"/>
  <ellipse cx="1242" cy="864" rx="7" ry="4" fill="#B0BEC5" opacity="0.33"/>

  <!-- Footprints -->
  <g opacity="0.18" fill="#8D6E63">
    <ellipse cx="730" cy="900" rx="5" ry="9" transform="rotate(10,730,900)"/>
    <ellipse cx="746" cy="891" rx="5" ry="9" transform="rotate(-8,746,891)"/>
    <ellipse cx="762" cy="904" rx="5" ry="9" transform="rotate(12,762,904)"/>
    <ellipse cx="778" cy="895" rx="5" ry="9" transform="rotate(-6,778,895)"/>
  </g>
</svg>`;
}
