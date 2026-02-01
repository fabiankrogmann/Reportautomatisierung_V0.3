# Feature: Bracket (Prozentuale Veränderung)

## 1. METADATA
- **ID**: `bracket`
- **Version**: 2.0
- **Kategorie**: annotation
- **Komplexität**: mittel

## 2. BESCHREIBUNG
Zeigt die prozentuale Veränderung zwischen zwei Balken als Annotation mit Verbindungslinien und Bubble-Label. Unterstützt verschiedene Vergleichsmodi (Standard, YoY, Budget, CAGR) und Multiple Brackets.

## 3. TEMPLATE-KOMPATIBILITÄT
| Template-Kategorie | Kompatibel | Variante |
|--------------------|:----------:|----------|
| Structure (WF-01,02,05-07,10) | ✓ | standard (Start→End) |
| Variance (WF-03,04,08,09,12) | ✓ | auto (YoY/Budget/FC) |
| Trend (WF-11,13) | ✓ | cagr |
| Compare-Bars (WF-14-19) | ✓ | multiple (bis zu 2) |

## 4. AKTIVIERUNGSREGELN

### 4.1 Natürliche Sprache
"Aktiviere Bracket wenn mindestens 4 Balken vorhanden sind UND Start- und End-Balken existieren UND die Veränderung > 5% ist.

Bei Variance-Templates: Wähle automatisch den sinnvollsten Vergleich (Budget→Actual bevorzugt vor PY→CY bevorzugt vor Start→End).

Bei Trend-Templates: Berechne CAGR statt einfacher Prozent-Änderung wenn >= 3 Perioden vorhanden sind."

### 4.2 Pseudo-Code
```
// Basis-Aktivierung
IF bars.length >= 4
   AND hasBarType('start') AND hasBarType('end')
   AND abs(endValue - startValue) / startValue > 0.05
THEN:
    bracket.enabled = true

// Modus-Auswahl
SWITCH templateCategory:
    CASE 'variance':
        IF hasBudget AND hasActual:
            bracket.mode = 'budget'
            bracket.label = formatPercent((actual - budget) / budget) + ' vs. Budget'
        ELSE IF hasPY AND hasCY:
            bracket.mode = 'yoy'
            bracket.label = formatPercent((cy - py) / py) + ' YoY'
        ELSE IF hasFC AND hasActual:
            bracket.mode = 'fc'
            bracket.label = formatPercent((actual - fc) / fc) + ' vs. FC'

    CASE 'trend':
        IF periods.length >= 3:
            bracket.mode = 'cagr'
            bracket.label = 'CAGR ' + formatPercent(calculateCAGR())
        ELSE:
            bracket.mode = 'standard'

    CASE 'compare_bars':
        bracket.mode = 'multiple'
        bracket.brackets = [primaryBracket, secondaryBracket]

    DEFAULT:
        bracket.mode = 'standard'
        bracket.label = formatPercent((end - start) / start)
```

### 4.3 Parameter-Berechnungsformeln
| Parameter | Formel | Beispiel |
|-----------|--------|----------|
| fromIndex | Index des Start-Balkens | 0 |
| toIndex | Index des End-Balkens | bars.length - 1 |
| label | Siehe Modus-Logik | "+15.3%" |
| cagr | (end/start)^(1/n) - 1 | 0.07 (7%) |

## 5. CONFIG-SCHEMA

### 5.1 Minimale Config
```json
{
  "bracket": {
    "enabled": true
  }
}
```

### 5.2 Vollständige Config (Standard)
```json
{
  "bracket": {
    "enabled": true,
    "mode": "auto",
    "fromIndex": 0,
    "toIndex": 6,
    "label": "+9.8% vs. Budget",
    "position": "top",
    "level": "primary",
    "_reason": "Budget und Actual vorhanden, signifikante Abweichung"
  }
}
```

### 5.3 Multiple Brackets Config
```json
{
  "bracket": {
    "enabled": true,
    "mode": "multiple",
    "brackets": [
      { "fromIndex": 0, "toIndex": 6, "label": "+9.8% vs. Budget", "level": "primary" },
      { "fromIndex": 6, "toIndex": 7, "label": "-0.2% vs. Target", "level": "secondary" }
    ],
    "_reason": "Budget-Varianz als Hauptaussage, Target-Gap als Zusatzinfo"
  }
}
```

## 6. RENDERING-LOGIK

### 6.1 Voraussetzungen
- Benötigt: `chartWidth`, `margin`, `yScale()`, `bars[]`, `getBarX()`, `barWidth`
- Abhängig von: Muss NACH Value-Labels gerendert werden
- Wenn categoryBrackets aktiv: bracketGap muss erhöht werden (75px statt 30px)

### 6.2 SVG-Code
```javascript
// FEATURE: BRACKET
// Wird ausgeführt wenn config.features.bracket.enabled = true

if (config.features?.bracket?.enabled) {
    const bracketConfig = config.features.bracket;
    const { fromIndex, toIndex, label } = bracketConfig;

    const startBar = barData[fromIndex];
    const endBar = barData[toIndex];

    const startX = getBarX(fromIndex) + barWidth / 2;
    const endX = getBarX(toIndex) + barWidth / 2;
    const centerX = (startX + endX) / 2;

    // KRITISCH: Finde den höchsten Punkt zwischen Start und End
    let highestBarY = Infinity;
    for (let i = fromIndex; i <= toIndex; i++) {
        if (barData[i].barY < highestBarY) {
            highestBarY = barData[i].barY;
        }
    }

    // Sichere Positionierung mit ausreichend Abstand
    const valueLabelHeight = 25;
    let bracketGap = 30;

    // WENN Category-Brackets vorhanden sind, brauchen wir MEHR Platz!
    if (config.features?.categoryBrackets?.enabled) {
        bracketGap = 75;
    }

    const bracketY = Math.min(
        highestBarY - valueLabelHeight - bracketGap - 20,
        margin.top + 10
    );

    // Prüfe ob am Start-/End-Balken ein Category-Bracket ist
    const hasCategoryBrackets = config.features?.categoryBrackets?.enabled;
    const categoryItems = config.features?.categoryBrackets?.items || [];
    const hasStartCB = categoryItems.some(cb => cb.barIndex === fromIndex);
    const hasEndCB = categoryItems.some(cb => cb.barIndex === toIndex);

    const startCategoryOffset = hasStartCB ? 50 : 12;
    const endCategoryOffset = hasEndCB ? 50 : 12;

    const startLabelY = startBar.barY - valueLabelHeight - startCategoryOffset;
    const endLabelY = endBar.barY - valueLabelHeight - endCategoryOffset;

    const bubbleWidth = 90;
    const bubbleHeight = 24;

    // Linke vertikale Linie
    svgContent += `<line class="bracket-line"
        x1="${startX}" y1="${startLabelY}"
        x2="${startX}" y2="${bracketY}"/>`;

    // Horizontale Linie links zur Bubble
    svgContent += `<line class="bracket-line-dashed"
        x1="${startX}" y1="${bracketY}"
        x2="${centerX - bubbleWidth/2 - 5}" y2="${bracketY}"/>`;

    // Bubble (Ellipse) mit Label
    svgContent += `<ellipse class="bracket-bubble"
        cx="${centerX}" cy="${bracketY}"
        rx="${bubbleWidth/2}" ry="${bubbleHeight/2}"/>`;
    svgContent += `<text class="bracket-label"
        x="${centerX}" y="${bracketY + 1}">
        ${label}
    </text>`;

    // Horizontale Linie rechts von Bubble
    svgContent += `<line class="bracket-line-dashed"
        x1="${centerX + bubbleWidth/2 + 5}" y1="${bracketY}"
        x2="${endX}" y2="${bracketY}"/>`;

    // Rechte vertikale Linie + Pfeilspitze
    const arrowTipY = endLabelY;
    svgContent += `<line class="bracket-line"
        x1="${endX}" y1="${bracketY}"
        x2="${endX}" y2="${arrowTipY + 8}"/>`;
    svgContent += `<polygon class="arrow-head"
        points="${endX},${arrowTipY}
                ${endX-5},${arrowTipY - 8}
                ${endX+5},${arrowTipY - 8}"/>`;
}
```

### 6.3 Positionierung
- **Z-Index**: Nach Value-Labels und Category-Brackets (höchste Rendering-Priorität)
- **Anchor**: Balkenmitte (X), Balkenoberkante (Y)
- **Spacing**: margin.top += 45px pro Bracket-Level; +30px extra wenn categoryBrackets aktiv

## 7. CSS-STYLES

```css
.bracket-line {
    stroke: #333;
    stroke-width: 1.5;
    fill: none;
}

.bracket-line-dashed {
    stroke: #333;
    stroke-width: 1;
    stroke-dasharray: 4, 3;
    fill: none;
}

.bracket-bubble {
    fill: white;
    stroke: #333;
    stroke-width: 1.5;
}

.bracket-label {
    font-size: 12px;
    font-weight: bold;
    fill: #1a1a1a;
    text-anchor: middle;
    dominant-baseline: middle;
}

.arrow-head {
    fill: #333;
}

/* Secondary Level (für Multiple Brackets) */
.bracket-secondary .bracket-line {
    stroke: #666;
    stroke-width: 1;
}

.bracket-secondary .bracket-line-dashed {
    stroke: #666;
    stroke-width: 0.8;
    stroke-dasharray: 3, 3;
}

.bracket-secondary .bracket-bubble {
    stroke: #666;
    stroke-width: 1;
}

.bracket-secondary .bracket-label {
    font-size: 10px;
    fill: #666;
}
```

## 8. KONFLIKTE & ABHÄNGIGKEITEN

### Konflikte
| Konflikt mit | Grund | Lösung |
|--------------|-------|--------|
| arrows | Beide zeigen Verbindungen zwischen Balken | Nur eines aktivieren; Bracket hat Priorität |

### Abhängigkeiten
| Benötigt | Grund |
|----------|-------|
| - | Keine harten Abhängigkeiten |

### Interaktion mit anderen Features
| Feature | Interaktion |
|---------|------------|
| categoryBrackets | bracketGap muss erhöht werden (75px statt 30px) |
| scaleBreak | Bracket-Höhe muss Scale-Break berücksichtigen |

## 9. EDGE-CASES & FEHLERBEHANDLUNG

| Situation | Verhalten |
|-----------|-----------|
| < 4 Balken | Bracket deaktivieren |
| Veränderung < 5% | Bracket optional (KI entscheidet) |
| Negative Werte | Prozent trotzdem berechnen |
| fromIndex = toIndex | Bracket deaktivieren |
| Multiple > 2 | Auf 2 begrenzen |
| categoryBrackets aktiv | bracketGap auf 75px erhöhen |
| Bracket überschneidet Titel | bracketY auf max margin.top + 10 begrenzen |

## 10. BEISPIELE

### Beispiel 1: Standard-Bracket (P&L Bridge)
**Input:**
```json
{
  "bracket": {
    "enabled": true,
    "mode": "standard",
    "fromIndex": 0,
    "toIndex": 6,
    "label": "+8.7%"
  }
}
```

**Ergebnis:**
```
    ┌─────────────[+8.7%]──────────────────┐
    │                                       ↓
  $6.5m                                   $7.1m
  ┌─────┐  ┌──┐ ┌──┐  ┌──┐ ┌──┐ ┌──┐  ┌─────┐
  │█████│  │██│ │██│  │░░│ │░░│ │░░│  │█████│
  └─────┘  └──┘ └──┘  └──┘ └──┘ └──┘  └─────┘
```

### Beispiel 2: Budget-Bracket mit Category-Brackets
**Input:**
```json
{
  "bracket": {
    "enabled": true,
    "mode": "budget",
    "fromIndex": 0,
    "toIndex": 6,
    "label": "+9.8% vs. Budget"
  }
}
```

**Ergebnis:**
```
    ┌──────[+9.8% vs. Budget]──────────────┐
    │                                       ↓
    │         vom Umsatz
    │           ┌────┐
    │           │51.2%│
    │           └────┘
  Budget    -618.000 €                    Actual
  ┌─────┐   ┌─────┐                     ┌─────┐
  │█████│   │░░░░░│   ...               │█████│
  └─────┘   └─────┘                     └─────┘
```
