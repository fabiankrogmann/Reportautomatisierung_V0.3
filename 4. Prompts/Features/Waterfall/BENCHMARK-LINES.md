# Feature: Benchmark-Linien (Horizontale Ziel-/Schwellenwert-Linien)

## 1. METADATA
- **ID**: `benchmarkLines`
- **Version**: 1.0
- **Kategorie**: layout
- **Komplexität**: mittel

## 2. BESCHREIBUNG
Zeigt horizontale Benchmark-Linien über die gesamte Chart-Breite an, um Zielwerte (TARGET), Guidance-Werte (GUIDANCE) oder andere Schwellenwerte visuell hervorzuheben. Ermöglicht sofortigen visuellen Vergleich aller Balken gegen einen definierten Referenzwert.

## 3. TEMPLATE-KOMPATIBILITÄT
| Template-Kategorie | Kompatibel | Hinweise |
|--------------------|:----------:|----------|
| Structure (WF-01,02,05-07,10) | ○ | Optional, wenn explizite Zielwerte vorhanden |
| Variance (WF-03,04,08,09,12) | ✓ | Besonders sinnvoll bei Budget/FC als Referenz |
| Trend (WF-11,13) | ○ | Optional, z.B. für Jahres-Target |
| Compare-Bars (WF-14-19) | ✓ | Empfohlen bei expliziten Target/Guidance-Werten |

## 4. AKTIVIERUNGSREGELN

### 4.1 Natürliche Sprache
"Aktiviere horizontale Benchmark-Linien wenn explizite Zielwerte (TARGET, GUIDANCE, PLAN) in den Daten oder Metadaten vorhanden sind. Besonders sinnvoll bei Variance- und Compare-Bars-Templates, wo ein klarer Referenzwert existiert.

NICHT aktivieren wenn kein klar definierter Zielwert existiert. Benchmark-Linien sollen nur für echte, benannte Referenzwerte verwendet werden, NICHT für berechnete Durchschnitte oder implizite Werte.

Maximal 2 Benchmark-Linien gleichzeitig, um die Lesbarkeit zu erhalten."

### 4.2 Pseudo-Code
```
// Prüfe ob explizite Zielwerte vorhanden sind
IF metadata.scenarios.includes('TARGET')
   OR metadata.scenarios.includes('GUIDANCE')
   OR metadata.scenarios.includes('PLAN')
   OR (metadata.comparison_type == 'variance' AND hasExplicitTargetValue)
THEN:
    benchmarkLines.enabled = true
    benchmarkLines.lines = []

    IF metadata.scenarios.includes('TARGET'):
        benchmarkLines.lines.push({
            value: targetValue,
            label: "Target",
            style: "dashed"
        })

    IF metadata.scenarios.includes('GUIDANCE'):
        benchmarkLines.lines.push({
            value: guidanceValue,
            label: "Guidance",
            style: "dotted"
        })

    // Maximal 2 Linien
    IF benchmarkLines.lines.length > 2:
        benchmarkLines.lines = benchmarkLines.lines.slice(0, 2)

ELSE:
    benchmarkLines.enabled = false
    benchmarkLines._reason = "Keine expliziten Zielwerte in den Daten"
```

### 4.3 Parameter-Berechnungsformeln
| Parameter | Formel | Beispiel |
|-----------|--------|----------|
| lines[].value | Absoluter Wert aus Daten | 2100000 |
| lines[].label | Name des Szenarios/Zielwerts | "Target" |
| lines[].style | "dashed" (Target), "dotted" (Guidance) | "dashed" |
| lines[].color | Aus Kontext oder Standard | "#FF8C00" |

## 5. CONFIG-SCHEMA

### 5.1 Minimale Config
```json
{
  "benchmarkLines": {
    "enabled": true,
    "lines": [
      { "value": 2100000, "label": "Target" }
    ]
  }
}
```

### 5.2 Vollständige Config
```json
{
  "benchmarkLines": {
    "enabled": true,
    "lines": [
      {
        "value": 2100000,
        "label": "Target",
        "style": "dashed",
        "color": "#FF8C00"
      },
      {
        "value": 1950000,
        "label": "Guidance",
        "style": "dotted",
        "color": "#888888"
      }
    ],
    "_reason": "TARGET-Szenario in Metadaten vorhanden, Guidance als sekundäre Referenz"
  }
}
```

## 6. RENDERING-LOGIK

### 6.1 Voraussetzungen
- Benötigt: `yScale()`, `margin`, `chartWidth`, `barData[]`
- Abhängig von: Muss NACH Basis-Balken und VOR Bracket/Arrows gerendert werden

### 6.2 SVG-Code
```javascript
// FEATURE: BENCHMARK-LINES
// Wird ausgeführt wenn config.features.benchmarkLines.enabled = true

if (config.features?.benchmarkLines?.enabled) {
    const lines = config.features.benchmarkLines.lines || [];

    lines.forEach((line, i) => {
        const lineY = yScale(line.value);
        const lineColor = line.color || (i === 0 ? '#FF8C00' : '#888888');
        const lineStyle = line.style || 'dashed';

        // Horizontale Linie über gesamte Chart-Breite
        const dashArray = lineStyle === 'dashed' ? '8, 4' :
                         lineStyle === 'dotted' ? '3, 3' : 'none';

        svgContent += `<line class="benchmark-line benchmark-${lineStyle}"
            x1="${margin.left}"
            y1="${lineY}"
            x2="${chartWidth - margin.right}"
            y2="${lineY}"
            stroke="${lineColor}"
            stroke-width="1.5"
            stroke-dasharray="${dashArray}"/>`;

        // Label rechts außen
        svgContent += `<text class="benchmark-label"
            x="${chartWidth - margin.right + 8}"
            y="${lineY + 4}"
            fill="${lineColor}"
            font-size="10" font-weight="600">
            ${line.label}
        </text>`;

        // Optionaler Wert-Label links
        svgContent += `<text class="benchmark-value"
            x="${margin.left - 8}"
            y="${lineY + 4}"
            fill="${lineColor}"
            font-size="9" text-anchor="end">
            ${formatValue(line.value)}
        </text>`;
    });
}
```

### 6.3 Positionierung
- **Z-Index**: Nach Basis-Balken und Connectors, VOR Bracket/Arrows
- **Anchor**: Gesamte Chart-Breite (X), Benchmark-Wert auf Y-Skala (Y)
- **Spacing**: Benötigt ca. 40px zusätzlichen Platz in margin.right für Label

## 7. CSS-STYLES

```css
.benchmark-line {
    fill: none;
    stroke-width: 1.5;
    opacity: 0.8;
}

.benchmark-dashed {
    stroke-dasharray: 8, 4;
}

.benchmark-dotted {
    stroke-dasharray: 3, 3;
}

.benchmark-label {
    font-size: 10px;
    font-weight: 600;
    dominant-baseline: middle;
}

.benchmark-value {
    font-size: 9px;
    text-anchor: end;
    dominant-baseline: middle;
}
```

## 8. KONFLIKTE & ABHÄNGIGKEITEN

### Konflikte
| Konflikt mit | Grund | Lösung |
|--------------|-------|--------|
| - | Keine direkten Konflikte | Benchmark-Linien sind mit allen Features kombinierbar |

### Abhängigkeiten
| Benötigt | Grund |
|----------|-------|
| yScale() | Für korrekte Y-Positionierung der Linie |

### Interaktion mit anderen Features
| Feature | Interaktion |
|---------|------------|
| scaleBreak | Benchmark-Linie muss oberhalb des Breaks positioniert werden wenn Wert > breakAt |
| bracket | Keine direkte Interaktion, beide können koexistieren |
| valueLabels | Benchmark-Label darf nicht mit Value-Labels kollidieren |

## 9. EDGE-CASES & FEHLERBEHANDLUNG

| Situation | Verhalten |
|-----------|-----------|
| Kein Zielwert vorhanden | Feature deaktivieren |
| > 2 Benchmark-Linien | Auf 2 begrenzen (Lesbarkeit) |
| Wert außerhalb Y-Skala | Y-Skala erweitern, um Benchmark einzuschließen |
| Wert = 0 | Benchmark trotzdem anzeigen (Nulllinie als Referenz) |
| Label kollidiert mit Balken-Label | Label leicht nach oben/unten verschieben (+/- 12px) |
| Scale-Break aktiv UND Benchmark > breakAt | Benchmark über dem Break zeichnen, mit Break-Offset |

## 10. BEISPIELE

### Beispiel 1: Budget-Varianz mit Target-Linie
**Input:**
```json
{
  "benchmarkLines": {
    "enabled": true,
    "lines": [
      {
        "value": 2100000,
        "label": "Target",
        "style": "dashed",
        "color": "#FF8C00"
      }
    ],
    "_reason": "TARGET-Szenario explizit in Quelldaten vorhanden"
  }
}
```

**Ergebnis:**
```
  2.195
  ┌─────┐
  │█████│  +95    -35.5
  │█████│  ┌──┐   ┌──┐            2.098
- -│- - -│- │- │- -│- │- - - - - - - - - - - - - - Target (2.100)
  │█████│  └──┘   └──┘   ┌──┐   ┌─────┐
  │█████│                 │░░│   │█████│
  └─────┘                 └──┘   └─────┘
  Budget   Vol.   Kosten  FX     IST
```

### Beispiel 2: Dual-Benchmark (Target + Guidance)
**Input:**
```json
{
  "benchmarkLines": {
    "enabled": true,
    "lines": [
      { "value": 2100000, "label": "Target", "style": "dashed", "color": "#FF8C00" },
      { "value": 1950000, "label": "Guidance", "style": "dotted", "color": "#888888" }
    ],
    "_reason": "Sowohl TARGET als auch GUIDANCE in den Metadaten vorhanden"
  }
}
```

**Ergebnis:**
```
  2.195
  ┌─────┐
  │█████│  +95
  │█████│  ┌──┐
- -│- - -│- │- │- - - - - - - - - - - - - - - - - - Target (2.100)
  │█████│  └──┘   ┌──┐            2.098
  │█████│         │░░│           ┌─────┐
· · · · · · · · · · · · · · · · · · · · · · · · · · Guidance (1.950)
  │█████│         └──┘           │█████│
  └─────┘                        └─────┘
  Budget   Vol.   Kosten         IST
```
