---
title: "[Readability/Typography]: Missing `text-wrap: balance` on headings and no `tabular-nums` on data columns"
labels: ["jules-suggested", "triage", "typography", "readability"]
estimate: "S"
---

# [Readability/Typography]: Missing `text-wrap: balance` on headings and no `tabular-nums` on data columns

## Before
Two typography best practices from the Web Interface Guidelines are absent across the entire CSS codebase:

### 1. `text-wrap: balance` / `text-pretty` on headings
Short headings that break mid-sentence create "widow" words on their own line, looking unbalanced and amateurish. For example:
- The trip start wizard heading `h2` (clamp 1.8–2.6rem) on a 390px screen will frequently break in a visually unbalanced way.
- Day-card `.day-cities` and `.day-title` headings can produce one-word last lines.
- Budget and Packing section headings.

No instance of `text-wrap: balance` or `text-pretty` found in any CSS file in `src/css/`.

### 2. `font-variant-numeric: tabular-nums` on numeric data columns
The app is data-heavy — Budget tab shows cost totals, durations, date columns; Transport tab shows times and costs; Summary table shows nights/days counts. When these numbers use proportional numerals (the default), columns of numbers shift width as digits change, making comparisons harder to read.

Specifically needed on:
- `.trip-summary-table` cost/nights/days columns
- Budget tab cost totals and per-item costs
- Transport timeline time displays (`.daily-timeline-time`)
- Packing item counts and progress indicators

## Evidence
```bash
# No results found:
grep -r "text-wrap.*balance" src/css/   # → 0 results
grep -r "tabular-nums" src/css/         # → 0 results
```

```css
/* Current — no width control on numbers */
.trip-summary-table td { ... }
.daily-timeline-time { ... }
/* Nothing prevents proportional numeral layout shift */
```

## Proposed
1. Add `text-wrap: balance` to all heading elements (`h1`–`h3`) in the app — most critically the wizard headings, section headings, and day-card city names:
   ```css
   h1, h2, h3,
   .day-cities, .compact-leg-label, .trip-start-panel h2 {
     text-wrap: balance;
   }
   ```

2. Add `font-variant-numeric: tabular-nums` to all numeric data display contexts:
   ```css
   .trip-summary-table td,
   .daily-timeline-time,
   .packing-area-progress-info,
   .budget-total, .cost-item-amount {
     font-variant-numeric: tabular-nums;
   }
   ```

3. Where column data has mixed number widths (e.g. "1 night" vs "14 nights"), also add `font-variant-numeric: lining-nums` to ensure consistent baseline.

Both properties have excellent browser support (97%+) and are zero-cost to add.

## After
Headings in all views balance gracefully across line breaks with no widow words. Budget and transport time columns align cleanly as data changes, significantly improving data readability — especially useful when scanning multi-city trips with varying costs and durations.

## Estimate
- Effort estimate: **S**

## Files impacted
- `src/css/components.css`
- `src/css/mobile-features.css`
- `src/css/shell.css`

## Acceptance criteria
- [ ] `text-wrap: balance` applied to `h1`, `h2`, `h3`, wizard headings, and `.day-cities`
- [ ] `font-variant-numeric: tabular-nums` applied to trip summary table, timeline times, budget amounts, packing counts
- [ ] No layout regressions from `text-wrap: balance` (verify on both DESKTOP 1440×900 and MOBILE 390×844)
- [ ] Numbers in trip summary table remain visually aligned when scrolling
- [ ] Regression tests pass (`npm test`)

## Verification plan
- Automated: `npm test`
- Manual: Load `backups/2026_June_July_Europe_Thailand.json` on DESKTOP and MOBILE — check all headings for balanced line breaks
- Manual: Open Budget tab — verify cost totals align vertically in list
- Manual: Open Transport tab — verify departure/arrival times align vertically
