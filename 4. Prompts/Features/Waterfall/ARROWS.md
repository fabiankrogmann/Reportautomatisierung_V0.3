# Feature: Arrows (Balken-Verbindungen)

## 1. METADATA
- **ID**: `arrows`
- **Version**: 1.0
- **Kategorie**: annotation
- **Komplexität**: niedrig

## 2. BESCHREIBUNG
Zeigt Pfeilverbindungen zwischen zwei spezifischen, nicht-benachbarten Balken mit optionalem Label. Alternative zu Brackets für fokussierte Vergleiche zwischen einzelnen Werten.

## 3. TEMPLATE-KOMPATIBILITÄT
| Template-Kategorie | Kompatibel | Hinweise |
|--------------------|:----------:|----------|
| Structure | ○ | Optional, für spezifische Vergleiche |
| Variance | ○ | Optional, für spezifische Vergleiche |
| Trend | ○ | Optional, für spezifische Vergleiche |
| Compare-Bars | ○ | Optional, für spezifische Vergleiche |

## 4. AKTIVIERUNGSREGELN

### 4.1 Natürliche Sprache
"Aktiviere Arrows nur wenn ein spezifischer Vergleich zwischen zwei nicht-benachbarten Balken sinnvoll ist UND kein Bracket aktiv ist. Arrows sind eine Alternative zu Brackets - nie beide gleichzeitig verwenden."

### 4.2 Pseudo-Code
```
IF specificComparison.requested == true
   AND bracket.enabled == false
   AND fromIndex != toIndex
   AND abs(fromIndex - toIndex) > 1
THEN:
    arrows.enabled = true
    arrows.from = fromIndex
    arrows.to = toIndex
    arrows.label = calculateDifference()
```

### 4.3 Parameter-Berechnungsformeln
| Parameter | Formel | Beispiel |
|-----------|--------|----------|
| from | Index des Quell-Balkens | 2 |
| to | Index des Ziel-Balkens | 5 |
| label | Differenz oder Prozent | "+12.5%" |

## 5. CONFIG-SCHEMA

### 5.1 Minimale Config
```json
{
  "arrows": {
    "enabled": true,
    "from": 2,
    "to": 5
  }
}
```

### 5.2 Vollständige Config
```json
{
  "arrows": {
    "enabled": true,
    "from": 2,
    "to": 5,
    "label": "+12.5%",
    "style": "curved",
    "_reason": "Spezifischer Vergleich zwischen EBITDA und Net Income"
  }
}
```

## 6. RENDERING-LOGIK

### 6.1 Voraussetzungen
- Benötigt: `getBarX()`, `barWidth`, `barData[]`, `yScale()`
- Abhängig von: Muss NACH Value-Labels gerendert werden

### 6.2 SVG-Code
```javascript
// FEATURE: ARROWS
// Wird ausgeführt wenn config.features.arrows.enabled = true

if (config.features?.arrows?.enabled) {
    const { from, to, label, style } = config.features.arrows;

    const fromBar = barData[from];
    const toBar = barData[to];

    const fromX = getBarX(from) + barWidth / 2;
    const toX = getBarX(to) + barWidth / 2;
    const fromY = fromBar.barY - 15;  // Über dem Quell-Balken
    const toY = toBar.barY - 15;      // Über dem Ziel-Balken

    // Gebogener Pfad
    const midY = Math.min(fromY, toY) - 30;

    svgContent += `<path class="arrow-path"
        d="M ${fromX} ${fromY} Q ${(fromX + toX) / 2} ${midY} ${toX} ${toY}"
        fill="none" stroke="#555" stroke-width="1.5"
        marker-end="url(#arrowhead)"/>`;

    // Label in der Mitte
    if (label) {
        const labelX = (fromX + toX) / 2;
        const labelY = midY - 5;
        svgContent += `<text class="arrow-label"
            x="${labelX}" y="${labelY}"
            text-anchor="middle" font-size="10" fill="#555">
            ${label}
        </text>`;
    }

    // Arrow marker definition
    svgContent += `<defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7"
                refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#555"/>
        </marker>
    </defs>`;
}
```

### 6.3 Positionierung
- **Z-Index**: Nach Value-Labels, gleiche Ebene wie Bracket
- **Anchor**: Balkenmitte (X), über Balkenoberkante (Y)
- **Spacing**: Benötigt ca. 30px über dem höchsten Punkt

## 7. CSS-STYLES

```css
.arrow-path {
    fill: none;
    stroke: #555;
    stroke-width: 1.5;
}

.arrow-label {
    font-size: 10px;
    fill: #555;
    text-anchor: middle;
}
```

## 8. KONFLIKTE & ABHÄNGIGKEITEN

### Konflikte
| Konflikt mit | Grund | Lösung |
|--------------|-------|--------|
| bracket | Beide zeigen Verbindungen | Nur eines aktivieren; Bracket hat Priorität |

### Abhängigkeiten
| Benötigt | Grund |
|----------|-------|
| - | Keine Abhängigkeiten |

## 9. EDGE-CASES & FEHLERBEHANDLUNG

| Situation | Verhalten |
|-----------|-----------|
| from = to | Arrows deaktivieren |
| from/to außerhalb Bereich | Arrows deaktivieren |
| Bracket auch aktiv | Arrows deaktivieren (Bracket hat Priorität) |
| Benachbarte Balken | Connector-Linie stattdessen verwenden |

## 10. BEISPIELE

### Beispiel 1: EBITDA zu Net Income Vergleich
**Input:**
```json
{
  "arrows": {
    "enabled": true,
    "from": 3,
    "to": 7,
    "label": "-42%",
    "_reason": "Vergleich EBITDA vs. Net Income zeigt Margin-Erosion"
  }
}
```

**Ergebnis:**
```
                    ╭──[-42%]──╮
                    ↓          ↓
  ┌─────┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌─────┐
  │█████│ │██│ │██│ │██│ │░░│ │░░│ │░░│ │█████│
  └─────┘ └──┘ └──┘ └──┘ └──┘ └──┘ └──┘ └─────┘
```
