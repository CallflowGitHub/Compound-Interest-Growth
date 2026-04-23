# Compound Interest Growth — Agent Instructions

## Project Overview
A zero-build, single-page browser app that visualises compound interest growth over time. See [README.md](README.md) for the full feature list and math details.

## File Structure
| File | Role |
|------|------|
| `index.html` | Layout, Chart.js CDN import, all DOM structure |
| `script/script.js` | All JS: calculation logic, Chart.js rendering, theme/currency toggles |
| `style/style.css` | Dark-theme styles; three themes via CSS custom properties on `body` |

## Key Conventions

### No Build Step
Open `index.html` directly in a browser. No npm, no bundler, no server needed.

### Themes
Three themes — `default`, `finance`, `beach` — controlled by:
- CSS custom properties on `body` (in `style.css`)
- `themeColors` object in `script.js` for Chart.js colors
- `body.theme-finance` / `body.theme-beach` classes toggled in JS

When adding a new theme, update **both** `themeColors` in JS and a matching CSS block in the stylesheet.

### Currency Toggle
`activeCurrency` is `'USD'` or `'ILS'`. The symbol (`$` / `₪`) is derived inline wherever needed. Input labels are updated dynamically via `labelInitial` / `labelMonthly` IDs.

### Compound Interest Math
Uses **annual compounding** with a partial-year tail:
- Full years: `balance = balance * (1 + rate) + monthlyAddition * 12`
- Remaining months: prorated interest + contributions
- Chart x-axis is in years; data is built in `script.js` and passed to `renderChart()`

See [README.md](README.md#math) for the formula details.

### Chart
Chart.js loaded from CDN (`https://cdn.jsdelivr.net/npm/chart.js`). The single instance is stored in `chartInstance` and destroyed before re-rendering. Do not add a second canvas or Chart instance.

### Summary Cards
`renderSummary()` in `script.js` writes HTML into `#summary`. Keep formatting consistent with existing cards (total contributed, interest earned, final value).

## What to Avoid
- Do not introduce a package manager, bundler, or framework.
- Do not split JS into multiple files unless explicitly asked.
- Do not change the CDN URL for Chart.js without confirming the version is compatible.
