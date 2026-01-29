# Feature: Negative Bridges (Negative Waterfall-Logik)

## 1. METADATA
- **ID**: `negativeBridges`
- **Version**: 1.0
- **Kategorie**: layout
- **Komplexität**: hoch

## 2. BESCHREIBUNG
Handhabt Waterfall-Charts, bei denen der kumulative Wert die Nulllinie kreuzt oder der End-Wert negativ ist. Stellt sicher, dass Balken korrekt unter der Nulllinie positioniert werden, die Nulllinie visuell hervorgehoben wird, und Connector-Linien die Nulllinien-Kreuzung korrekt abbilden.

Typische Anwendungsfälle:
- Verlust-Bridges (GuV endet mit negativem Ergebnis)
- Cashflow-Bridges (Zwischenwerte können negativ werden)
- Extreme Kostensteigerungen (kumulative Werte fallen unter Null)

## 3. TEMPLATE-KOMPATIBILITÄT
| Template-Kategorie | Kompatibel | Hinweise |
|--------------------|:----------:|----------|
| Structure (WF-01,02,05-07,10) | ✓ | Wenn End-Wert negativ oder Nulllinien-Kreuzung |
| Variance (WF-03,04,08,09,12) | ✓ | Häufig bei negativen Abweichungen |
| Trend (WF-11,13) | ✓ | Wenn Perioden-Werte negativ werden |
| Compare-Bars (WF-14-19) | ✓ | Bei negativen Vergleichswerten |

## 4. AKTIVIERUNGSREGELN

### 4.1 Natürliche Sprache
"Aktiviere die Negative-Bridges-Logik wenn der kumulative Wert an irgendeinem Punkt die Nulllinie kreuzt, wenn der End-Wert negativ ist, oder wenn der minimale kumulative Wert negativ ist.

Diese Logik ist bei ALLEN Template-Typen relevant und wird automatisch aktiviert, wenn die Datenlage es erfordert. Sie beeinflusst die Y-Skala (muss negative Werte umfassen), die Balken-Positionierung (unter der Nulllinie), und die Connector-Linien (müssen die Kreuzung korrekt abbilden)."

### 4.2 Pseudo-Code
```
// Kumulative Werte berechnen
cumulativeValues = []
running = 0
FOR each bar in bars:
    IF bar.type == 'start' OR bar.type == 'end' OR bar.type == 'subtotal':
        running = bar.value
    ELSE:
        running += bar.value
    cumulativeValues.push(running)

minCumulative = min(cumulativeValues)
endValue = bars.find(b => b.type == 'end')?.value

// Aktivierungsprüfung
IF cumulativeValues.some(v => v < 0)
   OR endValue < 0
   OR minCumulative < 0
THEN:
    negativeBridges.enabled = true
    negativeBridges.zeroLineY = yScale(0)
    negativeBridges.minValue = minCumulative
    negativeBridges.crossingIndices = findCrossingIndices(cumulativeValues)
ELSE:
    negativeBridges.enabled = false
    negativeBridges._reason = "Alle kumulativen Werte positiv"

// Hilfsfunktion: Finde Nulllinien-Kreuzungen
FUNCTION findCrossingIndices(values):
    crossings = []
    FOR i = 1 to values.length - 1:
        IF (values[i-1] >= 0 AND values[i] < 0) OR
           (values[i-1] < 0 AND values[i] >= 0):
            crossings.push(i)
    RETURN crossings
```

### 4.3 Parameter-Berechnungsformeln
| Parameter | Formel | Beispiel |
|-----------|--------|----------|
| zeroLineY | yScale(0) | 285 (Pixel) |
| minValue | min(cumulativeValues) | -150000 |
| crossingIndices | Indizes wo Vorzeichen wechselt | [3, 5] |
| yMin | minValue * 1.1 (10% Puffer) | -165000 |

## 5. CONFIG-SCHEMA

### 5.1 Minimale Config
```json
{
  "negativeBridges": {
    "enabled": true
  }
}
```

### 5.2 Vollständige Config
```json
{
  "negativeBridges": {
    "enabled": true,
    "zeroLineY": 285,
    "minValue": -150000,
    "crossingIndices": [3, 5],
    "showZeroLine": true,
    "zeroLineStyle": "solid",
    "_reason": "Kumulativer Wert kreuzt Nulllinie bei Index 3 und 5, End-Wert negativ (-45.000)"
  }
}
```

## 6. RENDERING-LOGIK

### 6.1 Voraussetzungen
- Benötigt: `yScale()`, `margin`, `chartWidth`, `barData[]`, `baselineY`
- Beeinflusst: Y-Skala muss negative Werte einschließen (muss VOR Basis-Balken berücksichtigt werden)

### 6.2 SVG-Code
```javascript
// FEATURE: NEGATIVE-BRIDGES
// Wird ausgeführt wenn config.features.negativeBridges.enabled = true
// WICHTIG: Beeinflusst Y-Skala-Berechnung!

if (config.features?.negativeBridges?.enabled) {
    const negConfig = config.features.negativeBridges;

    // 1. Y-SKALA ANPASSEN
    // yMin muss den negativen Bereich umfassen
    const yMin = negConfig.minValue * 1.1;  // 10% Puffer
    // yScale muss 0 einschließen und bis yMin gehen

    // 2. NULLLINIE ZEICHNEN
    if (negConfig.showZeroLine !== false) {
        const zeroY = yScale(0);

        svgContent += `<line class="zero-line"
            x1="${margin.left}"
            y1="${zeroY}"
            x2="${chartWidth - margin.right}"
            y2="${zeroY}"
            stroke="#333"
            stroke-width="1.5"/>`;

        // "0" Label an der Nulllinie
        svgContent += `<text class="zero-label"
            x="${margin.left - 8}"
            y="${zeroY + 4}"
            text-anchor="end"
            font-size="10" fill="#333" font-weight="600">
            0
        </text>`;
    }

    // 3. BALKEN-POSITIONIERUNG FÜR NEGATIVE WERTE
    // Für jeden Balken im negativen Bereich:
    barData.forEach((bar, i) => {
        const cumValue = cumulativeValues[i];

        if (bar.type === 'increase' || bar.type === 'decrease') {
            const prevCum = cumulativeValues[i - 1] || 0;

            if (prevCum < 0 && cumValue < 0) {
                // KOMPLETT UNTER NULL: Balken hängt an der Vorgänger-Position
                bar.barY = yScale(Math.max(prevCum, cumValue));
                bar.barHeight = Math.abs(yScale(prevCum) - yScale(cumValue));
            } else if (prevCum >= 0 && cumValue < 0) {
                // KREUZUNG: Balken geht von prevCum über 0 hinaus
                bar.barY = yScale(prevCum);
                bar.barHeight = Math.abs(yScale(prevCum) - yScale(cumValue));
            } else if (prevCum < 0 && cumValue >= 0) {
                // RÜCKKEHR: Balken geht von unter 0 zurück nach oben
                bar.barY = yScale(cumValue);
                bar.barHeight = Math.abs(yScale(prevCum) - yScale(cumValue));
            }
        }

        // End/Start/Subtotal-Balken mit negativem Wert
        if ((bar.type === 'start' || bar.type === 'end' || bar.type === 'subtotal')
            && bar.value < 0) {
            bar.barY = yScale(0);
            bar.barHeight = Math.abs(yScale(0) - yScale(bar.value));
        }
    });

    // 4. CONNECTOR-LINIEN BEI KREUZUNG
    // Connectors müssen auch unter der Nulllinie korrekt verbinden
    negConfig.crossingIndices?.forEach(crossIdx => {
        // Connector vom Kreuzungs-Balken zum nächsten
        // muss die Nulllinie visuell kreuzen
        const fromBar = barData[crossIdx - 1];
        const toBar = barData[crossIdx];
        const connectorY = yScale(cumulativeValues[crossIdx - 1]);

        svgContent += `<line class="connector-line connector-crossing"
            x1="${getBarX(crossIdx - 1) + barWidth}"
            y1="${connectorY}"
            x2="${getBarX(crossIdx)}"
            y2="${connectorY}"
            stroke="#999"
            stroke-width="1"
            stroke-dasharray="4, 2"/>`;
    });
}
```

### 6.3 Positionierung
- **Z-Index**: ERSTER Schritt zusammen mit scaleBreak — beeinflusst Y-Skala
- **Anchor**: Nulllinie (Y = 0) als Referenzpunkt
- **Spacing**: Y-Achse muss nach unten erweitert werden (minValue * 1.1)

## 7. CSS-STYLES

```css
.zero-line {
    stroke: #333;
    stroke-width: 1.5;
    fill: none;
}

.zero-label {
    font-size: 10px;
    fill: #333;
    font-weight: 600;
    text-anchor: end;
}

/* Negative Balken: Gleiche Farbe wie positive, aber unter der Nulllinie */
.bar-negative-region {
    opacity: 0.9;
}

/* Connector bei Nulllinien-Kreuzung: stärker hervorgehoben */
.connector-crossing {
    stroke: #666;
    stroke-width: 1.2;
    stroke-dasharray: 6, 3;
}
```

## 8. KONFLIKTE & ABHÄNGIGKEITEN

### Konflikte
| Konflikt mit | Grund | Lösung |
|--------------|-------|--------|
| scaleBreak | Scale-Break funktioniert nur für positive Bereiche | Scale-Break deaktivieren wenn negative Werte vorhanden |

### Abhängigkeiten
| Benötigt | Grund |
|----------|-------|
| yScale() | Muss negative Werte unterstützen |

### Interaktion mit anderen Features
| Feature | Interaktion |
|---------|------------|
| scaleBreak | KONFLIKT: Scale-Break deaktivieren bei negativen kumulativen Werten |
| bracket | Bracket funktioniert unverändert (Prozent-Berechnung unabhängig) |
| valueLabels | Labels für negative Balken unter dem Balken positionieren |
| connectorLines | Connectors müssen Nulllinien-Kreuzung berücksichtigen |

## 9. EDGE-CASES & FEHLERBEHANDLUNG

| Situation | Verhalten |
|-----------|-----------|
| Alle Werte positiv | Feature deaktivieren |
| Nur End-Wert negativ | Nulllinie und negative Positionierung nur für End-Balken |
| Mehrfache Nulllinien-Kreuzung | Alle Kreuzungen korrekt abbilden |
| Start-Wert negativ | Ungewöhnlich, aber korrekt handhaben (Balken unter Nulllinie) |
| Sehr kleine negative Werte (< 1% des Max) | Trotzdem korrekt darstellen |
| Scale-Break aktiv | Scale-Break deaktivieren (Konflikt) |
| Alle Werte negativ | Y-Achse komplett im negativen Bereich, Nulllinie am oberen Rand |

## 10. BEISPIELE

### Beispiel 1: GuV mit Verlust (End-Wert negativ)
**Input:**
```json
{
  "negativeBridges": {
    "enabled": true,
    "minValue": -45000,
    "crossingIndices": [4],
    "showZeroLine": true,
    "_reason": "EBIT negativ (-45.000), Nulllinien-Kreuzung bei Position 4 (nach Abschreibungen)"
  }
}
```

**Ergebnis:**
```
  850
  ┌─────┐
  │█████│  +120
  │█████│  ┌──┐   -380      -450      -185
  │█████│  │██│   ┌────┐    ┌────┐    ┌────┐
  │█████│  └──┘   │░░░░│    │░░░░│    │░░░░│
  └─────┘         │░░░░│    │░░░░│    │░░░░│
───────────────────│░░░░│────│░░░░│────│░░░░│─── 0
                   └────┘    └────┘    └────┘
                                              ┌─────┐
                                              │█████│ -45
                                              └─────┘
  Umsatz  Rohert. Material  Personal  Sonst.   EBIT
```

### Beispiel 2: Cashflow mit Zwischenwert unter Null
**Input:**
```json
{
  "negativeBridges": {
    "enabled": true,
    "minValue": -80000,
    "crossingIndices": [2, 4],
    "showZeroLine": true,
    "_reason": "Cashflow kreuzt Nulllinie zweimal: nach Operating CF (negativ) und nach Financing CF (wieder positiv)"
  }
}
```

**Ergebnis:**
```
  250
  ┌─────┐
  │█████│
  │█████│   +180
  │█████│   ┌──┐
  │█████│   │██│
  └─────┘   └──┘
──────────────────────────────────── 0
                    -310
                    ┌────┐   +210
                    │░░░░│   ┌──┐    ┌─────┐
                    │░░░░│   │██│    │█████│ 120
                    └────┘   └──┘    └─────┘
  Start   Op.CF   Inv.CF   Fin.CF   End
```
