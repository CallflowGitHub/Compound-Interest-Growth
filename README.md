# Compound Interest Growth

A browser-based dashboard for visualising how an investment grows over time through compound interest. Enter your starting amount, monthly contributions, annual interest rate, and time horizon — then generate an interactive chart showing your portfolio value year by year.

---

## Features

- **Interactive chart** — line chart (via Chart.js) with a purple-to-teal gradient fill
- **Four inputs** — initial amount, monthly addition, annual interest rate (%), and number of years (supports decimals)
- **Summary cards** — total contributed, interest earned, and final value displayed below the chart
- **Accurate math** — uses month-by-month compounding with the monthly equivalent of the annual rate `(1+r)^(1/12) - 1`, supporting fractional year inputs
- **Vibrant dark UI** — glassmorphism cards, gradient title, glowing button

---

## File Structure

```
Compound-Interest-Growth/
├── index.html          # Main HTML — dashboard layout and Chart.js CDN import
├── script/
│   └── script.js       # Calculation logic, chart rendering, summary cards
├── style/
│   └── style.css       # Dark theme styling with gradients and glow effects
└── README.md
```

---

## Usage

No build step or server required. Just open `index.html` in any modern browser.

1. Fill in all four fields
2. Click **Calculate Growth**
3. The chart and summary cards appear instantly

---

## Math

Each month the balance is compounded and the monthly contribution is added:

```
monthlyRate = (1 + annualRate) ^ (1/12) - 1
balance = balance × (1 + monthlyRate) + monthlyContribution
```

This correctly reflects an annually-stated interest rate applied on a monthly basis, matching standard financial calculators.

