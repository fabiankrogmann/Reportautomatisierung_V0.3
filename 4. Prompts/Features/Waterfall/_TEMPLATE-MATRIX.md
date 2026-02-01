# Template-Feature-Matrix: Waterfall

## Template-Kategorien

| Kategorie | Templates | Charakteristik |
|-----------|-----------|----------------|
| **Structure** | WF-01, WF-02, WF-05, WF-06, WF-07, WF-10 | P&L, Cashflow, Margin - Start→End |
| **Variance** | WF-03, WF-04, WF-08, WF-09, WF-12 | PY→CY, Budget→Actual, FC→Actual |
| **Trend** | WF-11, WF-13 | Quartals-/Monatsbrücken |
| **Compare-Bars** | WF-14 bis WF-19 | Mit zusätzlichen Szenario-Vergleichsbalken |

## Quick Reference

| Template | Category | Bracket | Cat-Bracket | Scale-Break | Benchmark | Grouping | Neg-Bridges |
|----------|----------|:-------:|:-----------:|:-----------:|:---------:|:--------:|:-----------:|
| WF-01 | Structure | std | ✓ | ✓ | ○ | ✓ | ✓ |
| WF-02 | Structure | std | ✓ | ✓ | ○ | ✓ | ✓ |
| WF-03 | Variance | yoy | ✗ | ✓ | ○ | ✗ | ✓ |
| WF-04 | Variance | bud | ✗ | ✓ | ✓ | ✗ | ✓ |
| WF-05 | Structure | std | ✓ | ✓ | ○ | ✓ | ✓ |
| WF-06 | Structure | std | ✓ | ✓ | ○ | ✓ | ✓ |
| WF-07 | Structure | std | ✓ | ✓ | ○ | ✗ | ✓ |
| WF-08 | Variance | var | ✗ | ✓ | ○ | ✗ | ✓ |
| WF-09 | Variance | yoy | ✗ | ✓ | ○ | ✗ | ✓ |
| WF-10 | Structure | std | ✓ | ✓ | ○ | ✓ | ✓ |
| WF-11 | Trend | cagr | ✗ | ✗ | ○ | ✗ | ✓ |
| WF-12 | Variance | fc | ✗ | ✓ | ✓ | ✗ | ✓ |
| WF-13 | Trend | cagr | ✗ | ✗ | ○ | ✗ | ✓ |
| WF-14 | Compare | bud+fc | ✗ | ✗ | ✓ | ✗ | ✓ |
| WF-15 | Compare | bud+fc | ✗ | ✗ | ✓ | ✗ | ✓ |
| WF-16 | Compare | yoy+fc | ✗ | ✗ | ✓ | ✗ | ✓ |
| WF-17 | Compare | yoy+fc | ✗ | ✗ | ✓ | ✗ | ✓ |
| WF-18 | Compare | fc+bud | ✗ | ✗ | ✓ | ✗ | ✓ |
| WF-19 | Compare | fc+bud | ✗ | ✗ | ✓ | ✗ | ✓ |

## Legende

- ✓ = Empfohlen / Sinnvoll
- ○ = Optional (wenn Daten vorhanden)
- ✗ = Nicht sinnvoll für dieses Template

### Bracket-Modi
- **std** = Standard Start→End
- **yoy** = Year-over-Year
- **bud** = Budget→Actual
- **fc** = Forecast→Actual
- **cagr** = CAGR-Berechnung
- **var** = Varianz-fokussiert
- **bud+fc** = Budget + Forecast Dual-Bracket
- **yoy+fc** = YoY + Forecast Dual-Bracket
- **fc+bud** = Forecast + Budget Dual-Bracket

## Feature-Kompatibilität pro Kategorie

```
FEATURE                      STRUCTURE  VARIANCE  TREND  COMPARE-BARS
═══════════════════════════════════════════════════════════════════════
Bracket (Standard)              ✓          ✓        ✓         ✓
Bracket (Multiple)              ✓          ✓        -         ✓
Category-Brackets               ✓          -        -         -
Scale-Break                     ✓          ✓        -         -
Benchmark-Lines                 ○          ✓        ○         ✓
Grouping                        ✓          -        -         -
Negative Bridges                ✓          ✓        ✓         ✓
Arrows                          ○          ○        ○         ○
```

## Konflikt-Matrix

| Feature A | Feature B | Konflikt? | Auflösung |
|-----------|-----------|:---------:|-----------|
| Bracket | Arrows | Ja | Bracket bevorzugt, Arrows nur wenn kein Bracket |
| Scale-Break | Compare-Bars | Ja | Scale-Break deaktivieren bei Compare-Bars |
| Multiple Brackets | Category-Brackets | Teilweise | Max 1 Bracket + Category-Brackets |
| Grouping | Variance-Templates | Ja | Grouping nur bei Structure-Templates |
