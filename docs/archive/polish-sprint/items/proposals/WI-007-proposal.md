# WI-007 After Proposal - Budget Mobile Numbers Look Like Broken Precision

Budget KPIs and leg totals use consistent currency formatting such as `$3,465` or `$3,465.10`.

Verification:
- Compare against `../before/mobile-07-budget.png`.
- No budget value displays an unformatted single decimal.
- Thousands separators are present for large totals.
