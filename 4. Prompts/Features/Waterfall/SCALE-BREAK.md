# Feature: Scale-Break (Skalenbruch)

## 1. METADATA
- **ID**: `scaleBreak`
- **Version**: 1.0
- **Kategorie**: layout
- **Komplexität**: mittel

## 2. BESCHREIBUNG
Zeigt einen visuellen Skalenbruch (Zickzack-Muster) in großen Balken, wenn Start-/End-Werte deutlich größer sind als die Delta-Balken. Verhindert, dass kleine aber wichtige Veränderungen visuell untergehen.

## 3. TEMPLATE-KOMPATIBILITÄT
| Template-Kategorie | Kompatibel | Hinweise |
|--------------------|:----------:|----------|
| Structure (WF-01,02,05-07,10) | ✓ | Wenn Umsatz >> Kosten |
| Variance (WF-03,04,08,09,12) | ✓ | Wenn Start >> Deltas |
| Trend (WF-11,13) | ✗ | Perioden sollen vergleichbar bleiben |
| Compare-Bars (WF-14-19) | ✗ | Verkompliziert den Vergleich |

## 4. AKTIVIERUNGSREGELN

### 4.1 Natürliche Sprache
"Aktiviere einen Skalenbruch wenn der Start- oder End-Balken mehr als dreimal so groß ist wie die durchschnittlichen Veränderungsbalken. Dies verhindert, dass kleine aber wichtige Veränderungen visuell untergehen.

NICHT aktivieren bei Trend-Templates (Perioden sollen vergleichbar bleiben) und Compare-Bars-Templates (verkompliziert den Vergleich)."

### 4.2 Pseudo-Code
```
// Nur für Structure und Variance Templates
IF templateCategory IN ['structure', 'variance']:
    avgDelta = average(abs(value) for bar in bars where bar.type IN ['increase', 'decrease', 'delta'])
    maxBar = max(startValue, endValue)

    IF avgDelta > 0 AND maxBar / avgDelta > 3:
        scaleBreak.enabled = true
        scaleBreak.breakAt = avgDelta * 2
        scaleBreak.style = "zigzag"
    ELSE:
        scaleBreak.enabled = false
ELSE:
    scaleBreak.enabled = false
    scaleBreak._reason = "Nicht für " + templateCategory + "-Templates"
```

### 4.3 Parameter-Berechnungsformeln
| Parameter | Formel | Beispiel |
|-----------|--------|----------|
| breakAt | avgDelta * 2 | 84.800 (bei avgDelta = 42.400) |
| style | "zigzag" (Standard für Waterfall) | "zigzag" |
| ratio | maxBar / avgDelta | 25.9 |

## 5. CONFIG-SCHEMA

### 5.1 Minimale Config
```json
{
  "scaleBreak": {
    "enabled": true
  }
}
```

### 5.2 Vollständige Config
```json
{
  "scaleBreak": {
    "enabled": true,
    "breakAt": 85000,
    "style": "zigzag",
    "_reason": "Start (1.000.000) / Ø Delta (42.400) = 25.9 > 3"
  }
}
```

## 6. RENDERING-LOGIK

### 6.1 Voraussetzungen
- Benötigt: `yScale()`, `barX`, `barWidth`, `baselineY`, `barY`
- Beeinflusst: Y-Skala-Berechnung (muss VOR Basis-Balken ausgeführt werden)

### 6.2 SVG-Code
```javascript
// FEATURE: SCALE-BREAK
// Wird ausgeführt wenn config.features.scaleBreak.enabled = true
// WICHTIG: Beeinflusst nur Start- und End-Balken!

if (config.features?.scaleBreak?.enabled) {
    const breakAt = config.features.scaleBreak.breakAt;
    const breakY = yScale(breakAt);

    // Nur bei Start- und End-Balken anwenden
    if (bar.type === 'start' || bar.type === 'end') {
        // Oberer Teil des Balkens (über dem Break)
        svgContent += `<rect class="bar bar-${bar.type}"
            x="${barX}" y="${barY}"
            width="${barWidth}" height="${breakY - barY - 10}"
            rx="2"/>`;

        // Unterer Teil des Balkens (unter dem Break)
        svgContent += `<rect class="bar bar-${bar.type}"
            x="${barX}" y="${breakY + 10}"
            width="${barWidth}" height="${baselineY - breakY - 10}"
            rx="2"/>`;

        // Zickzack-Linien für den Bruch
        svgContent += `<path class="scale-break-line"
            d="${drawZigzag(barX, breakY - 5, barWidth)}"/>`;
        svgContent += `<path class="scale-break-line"
            d="${drawZigzag(barX, breakY + 5, barWidth)}"/>`;
    }
}

// Zickzack-Pfad generieren
function drawZigzag(x, y, width) {
    const zigzagWidth = 8;
    let path = `M ${x} ${y}`;
    for (let i = 0; i < width / zigzagWidth; i++) {
        const offsetY = i % 2 === 0 ? -4 : 4;
        path += ` L ${x + (i + 1) * zigzagWidth} ${y + offsetY}`;
    }
    return path;
}
```

### 6.3 Positionierung
- **Z-Index**: ERSTER Schritt - beeinflusst Y-Skala und Balken-Rendering
- **Anchor**: Balkenbreite (X), breakAt-Wert (Y)
- **Spacing**: Benötigt 20px vertikalen Raum für Zickzack-Muster (10px über + 10px unter breakY)

## 7. CSS-STYLES

```css
.scale-break-line {
    stroke: #666;
    stroke-width: 1.5;
    fill: none;
}

/* Weißer Hintergrund zwischen den Zickzack-Linien */
.scale-break-bg {
    fill: white;
    stroke: none;
}
```

## 8. KONFLIKTE & ABHÄNGIGKEITEN

### Konflikte
| Konflikt mit | Grund | Lösung |
|--------------|-------|--------|
| Compare-Bars (WF-14-19) | Verkompliziert visuellen Vergleich | Scale-Break deaktivieren |
| Trend-Templates (WF-11,13) | Perioden sollen vergleichbar bleiben | Scale-Break deaktivieren |

### Abhängigkeiten
| Benötigt | Grund |
|----------|-------|
| - | Keine harten Abhängigkeiten |

### Interaktion mit anderen Features
| Feature | Interaktion |
|---------|------------|
| bracket | Bracket-Höhe muss den Break-Bereich berücksichtigen |
| categoryBrackets | Keine direkte Interaktion |

## 9. EDGE-CASES & FEHLERBEHANDLUNG

| Situation | Verhalten |
|-----------|-----------|
| Kein Start-/End-Balken | Scale-Break deaktivieren |
| breakAt > maxValue | breakAt auf maxValue * 0.8 begrenzen |
| breakAt < avgDelta | breakAt auf avgDelta * 1.5 setzen |
| Nur 1 Delta-Balken | Ratio trotzdem berechnen |
| Ratio < 3 | Scale-Break nicht sinnvoll, deaktivieren |
| Negative Start/End-Werte | Scale-Break deaktivieren (Komplexität zu hoch) |

## 10. BEISPIELE

### Beispiel 1: P&L Bridge mit großem Umsatz
**Input:**
```json
{
  "scaleBreak": {
    "enabled": true,
    "breakAt": 180,
    "style": "zigzag",
    "_reason": "Umsatz (2.195) ist 12x größer als Ø Delta (183)"
  }
}
```

**Ergebnis:**
```
  2.195
  ┌─────┐
  │█████│  +38  +22
  │█████│  ┌──┐ ┌──┐
  ╱╲╱╲╱╲  │██│ │██│  ┌──┐ ┌──┐
  │█████│  └──┘ └──┘  │░░│ │░░│
  │█████│             └──┘ └──┘
  └─────┘                       ┌─────┐
  Umsatz                        │█████│
                                ╱╲╱╲╱╲
                                │█████│
                                └─────┘
                                EBIT
```
