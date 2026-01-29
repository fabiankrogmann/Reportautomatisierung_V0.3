# Feature: Category-Bracket (Anteil-Annotationen)

## 1. METADATA
- **ID**: `categoryBrackets`
- **Version**: 1.0
- **Kategorie**: annotation
- **Komplexität**: mittel

## 2. BESCHREIBUNG
Zeigt prozentuale Anteile über einzelnen Balken (z.B. "51,2% vom Umsatz", "62,3% der Gesamtkosten"). Darstellung als Beschreibungstext + Bubble direkt über dem Wert-Label eines Balkens. Besonders sinnvoll bei P&L-Strukturen, Cashflow-Analysen und Segment-Aufschlüsselungen.

## 3. TEMPLATE-KOMPATIBILITÄT
| Template-Kategorie | Kompatibel | Hinweise |
|--------------------|:----------:|----------|
| Structure (WF-01,02,05-07,10) | ✓ | P&L, Cashflow, Margin mit Hierarchie |
| Variance (WF-03,04,08,09,12) | ✗ | Deltas sind keine Kategorien |
| Trend (WF-11,13) | ✗ | Perioden, nicht Kategorien |
| Compare-Bars (WF-14-19) | ✗ | Zu komplex mit Compare-Bars |

## 4. AKTIVIERUNGSREGELN

### 4.1 Natürliche Sprache
"Aktiviere Category-Brackets wenn es logische Gruppen in den Daten gibt (z.B. Kostenarten als Anteil vom Umsatz) UND das Template eine Structure-Kategorie hat.

Besonders sinnvoll bei:
- P&L: 'Materialaufwand = 51,2% vom Umsatz'
- Cashflow: 'Operating CF = 65% des Gesamtflows'
- Segment: 'DACH = 42% vom Gesamtumsatz'

NICHT aktivieren wenn:
- Template ist Variance (Deltas haben keine sinnvollen Anteile)
- Template ist Trend (Perioden, nicht Kategorien)
- Weniger als 2 sinnvolle Gruppen erkennbar"

### 4.2 Pseudo-Code
```
IF templateCategory == 'structure'
   AND hierarchy.detected == true
   AND hierarchy.groups.length >= 2
THEN:
    categoryBrackets.enabled = true

    // KI identifiziert sinnvolle Gruppen und berechnet Anteile
    FOR EACH relevantBar IN bars WHERE bar.type IN ['increase', 'decrease', 'subtotal']:
        IF hasReferenceValue (z.B. Umsatz, Gesamtkosten):
            percentage = abs(bar.value) / referenceValue * 100
            categoryBrackets.items.push({
                barIndex: bar.index,
                label: formatPercent(percentage),
                description: "vom " + referenceLabel  // z.B. "vom Umsatz"
            })
ELSE:
    categoryBrackets.enabled = false
```

### 4.3 Parameter-Berechnungsformeln
| Parameter | Formel | Beispiel |
|-----------|--------|----------|
| items[].barIndex | Index des Balkens | 1 |
| items[].label | abs(value) / reference * 100 | "51,2%" |
| items[].description | "vom " + referenceLabel | "vom Umsatz" |

## 5. CONFIG-SCHEMA

### 5.1 Minimale Config
```json
{
  "categoryBrackets": {
    "enabled": true,
    "items": [
      { "barIndex": 1, "label": "51,2%" }
    ]
  }
}
```

### 5.2 Vollständige Config
```json
{
  "categoryBrackets": {
    "enabled": true,
    "items": [
      { "barIndex": 1, "label": "51,2%", "description": "vom Umsatz" },
      { "barIndex": 2, "label": "27,1%", "description": "vom Umsatz" },
      { "barIndex": 3, "label": "13,5%", "description": "vom Umsatz" }
    ],
    "_reason": "P&L-Struktur erkannt, Kostenarten als Anteil vom Umsatz sinnvoll"
  }
}
```

## 6. RENDERING-LOGIK

### 6.1 Voraussetzungen
- Benötigt: `yScale()`, `getBarX()`, `barWidth`, `barData[]` (mit barY-Positionen)
- Abhängig von: Muss NACH Basis-Balken und Value-Labels gerendert werden, BEVOR Bracket

### 6.2 SVG-Code
```javascript
// FEATURE: CATEGORY-BRACKETS
// Wird ausgeführt wenn config.features.categoryBrackets.enabled = true

if (config.features?.categoryBrackets?.enabled) {
    const items = config.features.categoryBrackets.items || [];
    const catBubbleHeight = 16;

    items.forEach((cb) => {
        const bar = barData[cb.barIndex];
        if (!bar) return;

        const barX = getBarX(cb.barIndex);
        const barCenterX = barX + barWidth / 2;

        // Position: oberhalb des Balkens
        let barTopY;
        if (bar.type === 'start' || bar.type === 'end' || bar.type === 'compare' || bar.type === 'subtotal') {
            barTopY = yScale(bar.value);
        } else if (bar.type === 'increase') {
            barTopY = yScale(bar.cumulative);
        } else if (bar.type === 'decrease') {
            barTopY = yScale(bar.prevCumulative);  // Oberkante vor Abzug
        }

        // Layout von unten nach oben:
        // 1. Balkenkante (barTopY)
        // 2. Wert-Label (barTopY - 8)
        // 3. Category-Bubble (barTopY - 26)
        // 4. Description Text (barTopY - 39)

        const valueLabelY = barTopY - 8;
        const bubbleY = valueLabelY - 18 - catBubbleHeight / 2;

        // Bubble-Größe dynamisch basierend auf Label-Länge
        const labelText = cb.label || '';
        const bubbleWidth = Math.max(40, labelText.length * 7 + 14);

        // Beschreibung ÜBER der Bubble (wenn vorhanden)
        if (cb.description) {
            svgContent += `<text class="category-bracket-desc"
                x="${barCenterX}" y="${bubbleY - catBubbleHeight / 2 - 3}"
                text-anchor="middle" font-size="9" fill="#666">
                ${cb.description}
            </text>`;
        }

        // Runde Bubble
        svgContent += `<ellipse class="category-bracket-bubble"
            cx="${barCenterX}" cy="${bubbleY}"
            rx="${bubbleWidth / 2}" ry="${catBubbleHeight / 2}"
            stroke="#666" stroke-width="1" fill="white"/>`;

        // Label in der Bubble (zentriert)
        svgContent += `<text class="category-bracket-label"
            x="${barCenterX}" y="${bubbleY + 1}"
            text-anchor="middle" dominant-baseline="middle"
            font-size="10" font-weight="600" fill="#333">
            ${cb.label}
        </text>`;
    });
}
```

### 6.3 Positionierung
- **Z-Index**: Nach Value-Labels, vor Bracket
- **Anchor**: Balkenmitte (X), über Wert-Label (Y)
- **Spacing**: Benötigt ca. 45px pro Category-Bracket (Bubble 16px + Description 10px + Abstände)

## 7. CSS-STYLES

```css
.category-bracket-desc {
    font-size: 9px;
    fill: #666;
    text-anchor: middle;
}

.category-bracket-bubble {
    fill: white;
    stroke: #666;
    stroke-width: 1;
}

.category-bracket-label {
    font-size: 10px;
    font-weight: 600;
    fill: #333;
    text-anchor: middle;
    dominant-baseline: middle;
}
```

## 8. KONFLIKTE & ABHÄNGIGKEITEN

### Konflikte
| Konflikt mit | Grund | Lösung |
|--------------|-------|--------|
| Variance-Templates | Deltas haben keine sinnvollen Anteile | Category-Brackets deaktivieren |
| Trend-Templates | Perioden sind keine Kategorien | Category-Brackets deaktivieren |

### Abhängigkeiten
| Benötigt | Grund |
|----------|-------|
| - | Keine harten Abhängigkeiten |

### Interaktion mit anderen Features
| Feature | Interaktion |
|---------|------------|
| bracket | Bracket muss höher positioniert werden (bracketGap = 75px) |
| scaleBreak | Keine direkte Interaktion |

## 9. EDGE-CASES & FEHLERBEHANDLUNG

| Situation | Verhalten |
|-----------|-----------|
| barIndex außerhalb des Bereichs | Item überspringen |
| Kein referenceValue | Description weglassen, nur Prozent zeigen |
| Anteil > 100% | Trotzdem anzeigen (kann bei Aggregationen vorkommen) |
| > 5 Category-Brackets | Auf die 5 relevantesten begrenzen |
| Zu enger Platz | Overlapping-Check, ggf. alternating Seiten |
| Negativer Anteil | Absoluten Prozent-Wert anzeigen |

## 10. BEISPIELE

### Beispiel 1: P&L Bridge mit Kostenanteilen
**Input:**
```json
{
  "categoryBrackets": {
    "enabled": true,
    "items": [
      { "barIndex": 1, "label": "51,2%", "description": "vom Umsatz" },
      { "barIndex": 2, "label": "27,1%", "description": "vom Umsatz" }
    ],
    "_reason": "P&L-Struktur: Materialaufwand und Personalkosten als Anteil vom Umsatz"
  }
}
```

**Ergebnis:**
```
           vom Umsatz    vom Umsatz
             ┌────┐        ┌────┐
             │51,2%│        │27,1%│
             └────┘        └────┘
  1.320.000 € -618.000 €  -324.000 €    112.000 €
  ┌─────────┐ ┌─────────┐ ┌─────────┐   ┌─────────┐
  │█████████│ │░░░░░░░░░│ │░░░░░░░░░│   │█████████│
  └─────────┘ └─────────┘ └─────────┘   └─────────┘
    Umsatz    Materialaufw. Personalaufw.   EBIT
```
