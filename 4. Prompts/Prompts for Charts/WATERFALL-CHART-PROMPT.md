# Think-Cell Style Waterfall Chart Generator Prompt

## Anwendung
Verwende diesen Prompt, um pixel-perfekte, dynamische Wasserfall-Charts (Bridge Charts) im Think-Cell-Stil zu generieren. Die Charts eignen sich für P&L-Bridges, Cash Flow Analysen, Varianzanalysen und Management-Reporting.

### Chart-Typ: Waterfall (Bridge) Chart
- **Struktur**: Schwebende Balken die aufeinander aufbauen, mit Start- und Endwert als Basis-Balken
- **Anwendung**: Darstellung von kumulativen Veränderungen, Gewinn/Verlust-Brücken, Varianzanalysen
- **Abgrenzung**: Im Gegensatz zum Bar-Chart zeigen Waterfall-Charts die VERÄNDERUNG zwischen Werten, nicht die absoluten Werte selbst

---

<!-- PROMPT-START -->

## Der Prompt

Erstelle einen dynamischen, interaktiven Wasserfall-Chart (Bridge Chart) im Think-Cell-Stil mit folgenden Spezifikationen:

## TECHNOLOGIE
- **Reines SVG + Vanilla JavaScript** (kein Framework, keine externe Library)
- Responsive über SVG viewBox
- Alle Elemente werden programmatisch aus einem config-Objekt generiert

## DATENSTRUKTUR (config-Objekt)
Das Chart wird vollständig aus diesem JavaScript-Objekt generiert:

```javascript
// ============================================
// ABSCHNITT: Hauptkonfiguration
// ============================================

const config = {
    // CHART-EINSTELLUNGEN
    // Titel und Untertitel erscheinen zentriert über dem Chart
    title: 'Cash Earnings Bridge FY19 → FY20',
    subtitle: 'in million USD',

    // ============================================
    // ABSCHNITT: Farbkonfiguration
    // ============================================
    // Jeder Balkentyp hat seine eigene Farbe
    colors: {
        start: '#1B4F72',      // Dunkelblau für Startwert
        end: '#1B4F72',        // Dunkelblau für Endwert
        positive: '#7CB342',   // Grün für positive Änderungen (increase)
        negative: '#C0392B',   // Rot für negative Änderungen (decrease)
        compare: '#808080',    // Grau für Vergleichswerte
        connector: '#333333'   // Farbe der gestrichelten Verbindungslinien
    },

    // ============================================
    // ABSCHNITT: Balkendaten
    // ============================================
    // Jeder Balken hat: type, label, value, displayValue
    // Types: 'start', 'increase', 'decrease', 'end', 'compare'
    bars: [
        // Startwert (type: 'start') - Voller Balken von 0 bis Wert
        {
            type: 'start',
            label: 'FY19 Cash\nEarnings',  // \n für mehrzeilige Labels
            value: 6.5,
            displayValue: '$6.5m'
        },

        // Positive Änderung (type: 'increase') - Schwebender grüner Balken
        {
            type: 'increase',
            label: 'Sales Income',
            value: 1.1,                    // Positiver Wert!
            displayValue: '$1.1m'
        },

        // Weitere positive Änderung
        {
            type: 'increase',
            label: 'Servicing\nIncome',
            value: 0.5,
            displayValue: '$0.5m'
        },

        // Negative Änderung (type: 'decrease') - Schwebender roter Balken
        {
            type: 'decrease',
            label: 'Ongoing\nExpenses',
            value: -0.5,                   // NEGATIVER Wert!
            displayValue: '-$0.5m'
        },

        // Weitere negative Änderungen
        {
            type: 'decrease',
            label: 'Investments',
            value: -0.1,
            displayValue: '-$0.1m'
        },
        {
            type: 'decrease',
            label: 'Risk &\nCompliance',
            value: -0.6,
            displayValue: '-$0.6m'
        },

        // Endwert (type: 'end') - Automatisch berechnet oder manuell
        {
            type: 'end',
            label: 'FY20 Cash\nEarnings',
            value: 7.1,  // Optional: Wenn nicht gesetzt, wird automatisch berechnet
            displayValue: '$7.1m'
        },

        // Vergleichswert (type: 'compare') - Optional, für Benchmarks
        {
            type: 'compare',
            label: 'FY20\nCompetitor\nCash Earnings',
            value: 7.3,
            displayValue: '$7.3m'
        }
    ],

    // ============================================
    // ABSCHNITT: Bracket-Annotation (optional)
    // ============================================
    // Zeigt prozentuale Veränderung zwischen zwei Balken
    bracket: {
        show: true,
        fromIndex: 0,       // Index des Startbalkens
        toIndex: 6,         // Index des Endbalkens
        label: '+8.7%'      // Anzuzeigende Veränderung
    },

    // ============================================
    // ABSCHNITT: Skalenbruch (optional)
    // ============================================
    // Für große Balken die den Rest des Charts dominieren würden
    scaleBreak: {
        enabled: false,     // Aktiviert Skalenbruch für Start/End-Balken
        breakAt: 5.0        // Y-Wert wo der Bruch erfolgt
    }
};

## KRITISCH: NUR ECHTE DATEN - KEINE ERFUNDENEN EFFEKTE!

**VERWENDE AUSSCHLIESSLICH die Daten aus den Quelldaten!**

❌ VERBOTEN - Erfundene Kategorien wie:
- "Inflation", "Pricing", "Volume", "Mix"
- "Cost Savings", "Synergies", "Market Growth"
- "FX Effects", "Acquisitions", "Organic Growth"
- Beliebige andere Labels die NICHT in den Quelldaten stehen

✅ ERLAUBT - Nur was in den Quelldaten steht:
- Die exakten Namen/Labels aus den Quelldaten
- Bei GuV: Kostenarten wie "Umsatzerlöse", "Materialaufwand", "EBIT"
- Bei Zeitreihen: Jahre als Labels (2020, 2021, etc.)

## KRITISCH: Mathematische Korrektheit (PFLICHT!)

Der **End-Wert MUSS mathematisch korrekt berechnet** werden:

End-Wert = Start-Wert + Summe(alle increase values) + Summe(alle decrease values)

❌ FALSCH: End-Wert einfach auf positiven Wert setzen
✅ RICHTIG: End-Wert aus Start + allen Änderungen berechnen

## CHART-ELEMENTE

### 1. Balkentypen

#### Start-Balken (type: 'start')
- Volle Höhe vom Boden bis zum Wert
- Farbe: colors.start (Standard: Dunkelblau)
- Position: Ganz links
- Wert-Label: ÜBER dem Balken

```javascript
// ============================================
// Start-Balken Rendering
// ============================================
// Start-Balken ist ein "voller" Balken von y=0 bis zum Wert
if (bar.type === 'start') {
    cumulative = bar.value;  // Startwert setzen

    // Y-Position: Oberkante des Balkens
    const barY = yScale(bar.value);

    // Höhe: Von Oberkante bis zur Nulllinie (baselineY)
    const barHeight = baselineY - barY;

    // Connector-Y für nächsten Balken: Oberkante dieses Balkens
    connectorY = barY;
}
```

#### Increase-Balken (type: 'increase')
- "Schwebender" Balken - startet auf der Höhe des vorherigen kumulierten Werts
- Farbe: colors.positive (Standard: Grün)
- Wert-Label: IM Balken (weiß, zentriert) wenn groß genug, sonst ÜBER dem Balken

```javascript
// ============================================
// Increase-Balken Rendering
// ============================================
// Increase-Balken "schwebt" über dem vorherigen kumulierten Wert
if (bar.type === 'increase') {
    // WICHTIG: bar.value ist POSITIV (z.B. +1.1)

    // Oberkante: Der neue kumulative Wert (nach Addition)
    const barY = yScale(cumulative + bar.value);

    // Unterkante: Der alte kumulative Wert (vor Addition)
    // Höhe = Differenz der beiden Y-Positionen
    const barHeight = yScale(cumulative) - barY;

    // Connector für nächsten Balken: Oberkante (neue kumulative Position)
    connectorY = barY;

    // Kumulierten Wert aktualisieren
    cumulative += bar.value;
}
```

#### Decrease-Balken (type: 'decrease')
- "Hängender" Balken - startet auf der Höhe des vorherigen kumulierten Werts und geht nach unten
- Farbe: colors.negative (Standard: Rot)
- Wert-Label: IM Balken (weiß, zentriert) wenn groß genug, sonst ÜBER dem Balken

```javascript
// ============================================
// Decrease-Balken Rendering
// ============================================
// Decrease-Balken "hängt" unter dem vorherigen kumulierten Wert
if (bar.type === 'decrease') {
    // WICHTIG: bar.value ist NEGATIV (z.B. -0.5)

    // Oberkante: Der alte kumulative Wert (vor Subtraktion)
    const barY = yScale(cumulative);

    // Unterkante: Der neue kumulative Wert (nach Subtraktion)
    // Höhe = Differenz (bar.value ist negativ, daher yScale(cumulative + bar.value) > yScale(cumulative))
    const barHeight = yScale(cumulative + bar.value) - barY;

    // Connector für nächsten Balken: Unterkante (neue kumulative Position)
    connectorY = yScale(cumulative + bar.value);

    // Kumulierten Wert aktualisieren
    cumulative += bar.value;
}
```

#### End-Balken (type: 'end')
- Volle Höhe vom Boden bis zum Endwert
- Farbe: colors.end (Standard: Dunkelblau)
- Wert wird automatisch als Summe berechnet (oder manuell überschrieben)

```javascript
// ============================================
// End-Balken Rendering
// ============================================
if (bar.type === 'end') {
    // Wert: Entweder manuell gesetzt oder automatisch berechnet
    const endValue = bar.value !== undefined ? bar.value : cumulative;

    // Bei positivem End-Wert: Von Nulllinie nach oben
    if (endValue >= 0) {
        const barY = yScale(endValue);
        const barHeight = baselineY - barY;
    }
    // Bei NEGATIVEM End-Wert: Von Nulllinie nach UNTEN!
    else {
        const barY = baselineY;
        const barHeight = yScale(endValue) - baselineY;
    }
}
```

#### Compare-Balken (type: 'compare')
- Volle Höhe vom Boden bis zum Wert
- Farbe: colors.compare (Standard: Grau)
- Für Benchmarks/Vergleichswerte
- KEIN Connector davor oder danach

### 2. Connector-Linien

Gestrichelte horizontale Linien die die Balken visuell verbinden:

```javascript
// ============================================
// Connector-Linien Zeichnung
// ============================================
// Verbinden die Oberkante/Unterkante eines Balkens mit dem Start des nächsten

function drawConnector(fromX, toX, y) {
    // fromX: Rechte Kante des vorherigen Balkens
    // toX: Linke Kante des nächsten Balkens
    // y: Y-Position (Oberkante bei increase, Unterkante bei decrease)

    return `<line class="connector-line"
                  x1="${fromX}" y1="${y}"
                  x2="${toX}" y2="${y}"
                  stroke="${config.colors.connector}"
                  stroke-dasharray="4,3"
                  stroke-width="1"/>`;
}

// WICHTIG: Connector-Logik nach Balkentyp
// Nach START: Connector von Oberkante
// Nach INCREASE: Connector von neuer Oberkante
// Nach DECREASE: Connector von neuer Unterkante
// Vor COMPARE: KEIN Connector!
```

### 3. Wert-Labels

```javascript
// ============================================
// Wert-Label Positionierung
// ============================================
const minHeightForInsideLabel = 25;  // Mindesthöhe für Label IM Balken

if (bar.type === 'increase' || bar.type === 'decrease') {
    if (barHeight >= minHeightForInsideLabel) {
        // Label IM Balken (weiß, zentriert)
        const labelY = barY + barHeight / 2;
        svgContent += `<text class="value-label-inside"
                             x="${barCenterX}" y="${labelY}">
                         ${bar.displayValue}
                       </text>`;
    } else {
        // Label ÜBER dem Balken (schwarz) - Balken zu klein
        svgContent += `<text class="value-label"
                             x="${barCenterX}" y="${barY - 6}">
                         ${bar.displayValue}
                       </text>`;
    }
} else {
    // Start/End/Compare: Label immer ÜBER dem Balken
    // AUSNAHME: Bei negativen Werten Label ÜBER der Nulllinie!
    let labelY;
    if (bar.value < 0) {
        labelY = baselineY - 8;  // Über der Nulllinie
    } else {
        labelY = barY - 6;       // Über dem Balken
    }
    svgContent += `<text class="value-label"
                         x="${barCenterX}" y="${labelY}">
                     ${bar.displayValue}
                   </text>`;
}
```

### 4. X-Achsen-Labels (Mehrzeilig)

```javascript
// ============================================
// Mehrzeilige X-Achsen-Labels
// ============================================
// \n im Label wird zu mehreren <tspan> Elementen

function renderMultilineLabel(x, y, text) {
    const lines = text.split('\n');
    let svgText = `<text class="axis-label" x="${x}" y="${y}">`;

    lines.forEach((line, i) => {
        // Erste Zeile: dy=0, folgende Zeilen: dy=14 (Zeilenabstand)
        svgText += `<tspan x="${x}" dy="${i === 0 ? 0 : 14}">${line}</tspan>`;
    });

    svgText += '</text>';
    return svgText;
}
```

### 5. Bracket-Annotation (Haupt-Bracket)

Die Bracket-Annotation zeigt die prozentuale Veränderung zwischen zwei Balken:

```javascript
// ============================================
// KRITISCH: Bracket-Positionierung
// ============================================
// Bracket darf NIEMALS andere Elemente überlappen!
// WICHTIG: Wenn categoryBrackets vorhanden sind, muss das Haupt-Bracket
//          HÖHER positioniert werden, um Überlappungen zu vermeiden!

if (config.bracket && config.bracket.show) {
    const startBar = barData[config.bracket.fromIndex];
    const endBar = barData[config.bracket.toIndex];

    const startX = getBarX(config.bracket.fromIndex) + barWidth / 2;
    const endX = getBarX(config.bracket.toIndex) + barWidth / 2;
    const centerX = (startX + endX) / 2;

    // KRITISCH: Finde den höchsten Punkt zwischen Start und End
    // (niedrigster Y-Pixelwert = höchster Punkt im Chart)
    let highestBarY = Infinity;
    for (let i = config.bracket.fromIndex; i <= config.bracket.toIndex; i++) {
        if (barData[i].barY < highestBarY) {
            highestBarY = barData[i].barY;
        }
    }

    // Sichere Positionierung mit ausreichend Abstand
    const valueLabelHeight = 25;  // Höhe der Wert-Labels
    let bracketGap = 30;          // Mindestabstand zwischen Elementen

    // WENN Category-Brackets vorhanden sind, brauchen wir MEHR Platz!
    // Category-Brackets nehmen ca. 45px ein (Bubble 16px + Description 10px + Abstände)
    if (config.categoryBrackets && config.categoryBrackets.length > 0) {
        bracketGap = 75;  // Viel mehr Platz für Category-Brackets
    }

    // Bracket-Y ist über dem höchsten Punkt mit ausreichend Abstand
    const bracketY = Math.min(
        highestBarY - valueLabelHeight - bracketGap - 20,
        margin.top + 10  // Nicht zu weit oben
    );

    // Prüfe ob am Start- oder End-Balken ein Category-Bracket ist
    // NUR dann größeren Offset verwenden, sonst direkt über dem Wert-Label enden
    const hasStartCategoryBracket = config.categoryBrackets?.some(cb => cb.barIndex === config.bracket.fromIndex);
    const hasEndCategoryBracket = config.categoryBrackets?.some(cb => cb.barIndex === config.bracket.toIndex);

    // Offset nur dort erhöhen, wo tatsächlich ein Category-Bracket ist
    const startCategoryOffset = hasStartCategoryBracket ? 50 : 12;
    const endCategoryOffset = hasEndCategoryBracket ? 50 : 12;

    // Vertikale Linien enden OBERHALB der Wert-Labels (oder Category-Brackets wenn vorhanden)
    const startLabelY = startBar.barY - valueLabelHeight - startCategoryOffset;
    const endLabelY = endBar.barY - valueLabelHeight - endCategoryOffset;

    const bubbleWidth = 90;   // Breiter für längere Labels
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
                     ${config.bracket.label}
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

### 5b. Category-Brackets (Prozent-Anteile über einzelnen Balken)

Category-Brackets zeigen prozentuale Anteile über einzelnen Balken (z.B. "vom Umsatz", "% Gesamtkosten"):

```javascript
// ============================================
// CATEGORY-BRACKETS: Prozentuale Anteile über einzelnen Balken
// ============================================
// Zeigt z.B.: "62,3% der Gesamtkosten" oder "51,2% vom Umsatz"
// Darstellung: Beschreibung + Bubble DIREKT über dem Wert-Label
// WICHTIG: Muss UNTER dem Haupt-Bracket bleiben (wenn vorhanden)!

// Datenstruktur in config:
// categoryBrackets: [
//     { barIndex: 1, label: "51,2%", description: "vom Umsatz" },
//     { barIndex: 2, label: "27,1%", description: "vom Umsatz" }
// ]

if (config.categoryBrackets && config.categoryBrackets.length > 0) {
    const catBubbleHeight = 16;

    config.categoryBrackets.forEach((cb) => {
        const bar = barData[cb.barIndex];
        if (bar) {
            const barX = getBarX(cb.barIndex);
            const barCenterX = barX + barWidth / 2;

            // Position: oberhalb des Balkens
            let barTopY;
            if (bar.type === 'start' || bar.type === 'end' || bar.type === 'compare') {
                barTopY = yScale(bar.cumulative);
            } else if (bar.type === 'increase') {
                barTopY = yScale(bar.cumulative);
            } else if (bar.type === 'decrease') {
                barTopY = yScale(bar.startY);
            }

            // Layout von unten nach oben:
            // 1. Balkenkante (barTopY)
            // 2. Wert-Label (barTopY - 8)
            // 3. Category-Bubble (barTopY - 26)
            // 4. Description Text (barTopY - 39)

            const valueLabelY = barTopY - 8;  // Wert-Label Position
            const bubbleY = valueLabelY - 18 - catBubbleHeight/2;

            // Bubble-Größe dynamisch basierend auf Label-Länge
            const labelText = cb.label || '';
            const bubbleWidth = Math.max(40, labelText.length * 7 + 14);

            // Beschreibung ÜBER der Bubble (wenn vorhanden)
            if (cb.description) {
                svgContent += `<text class="category-bracket-desc"
                    x="${barCenterX}" y="${bubbleY - catBubbleHeight/2 - 3}"
                    text-anchor="middle" font-size="9" fill="#666">
                    ${cb.description}
                </text>`;
            }

            // Runde Bubble
            svgContent += `<ellipse class="category-bracket-bubble"
                cx="${barCenterX}" cy="${bubbleY}"
                rx="${bubbleWidth/2}" ry="${catBubbleHeight/2}"
                stroke="#666" stroke-width="1" fill="white"/>`;

            // Label in der Bubble (zentriert)
            svgContent += `<text class="category-bracket-label"
                x="${barCenterX}" y="${bubbleY + 1}"
                text-anchor="middle" dominant-baseline="middle"
                font-size="10" font-weight="600" fill="#333">
                ${cb.label}
            </text>`;
        }
    });
}
```

**Visuelles Ergebnis mit Haupt-Bracket + Category-Brackets:**
```
    ┌─────────────[Marge: 8,5%]──────────────────┐
    │                                             ↓
    │          vom Umsatz    vom Umsatz
    │            ┌────┐        ┌────┐
    │            │51,2%│        │27,1%│   ← Category-Brackets
    │            └────┘        └────┘
    │
  1.320.000 €   -618.000 €    -324.000 €    112.000 €  ← Wert-Labels
  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
  │█████████│   │░░░░░░░░░│   │░░░░░░░░░│   │█████████│
  │█████████│   │░░░░░░░░░│   │░░░░░░░░░│   │█████████│
  └─────────┘   └─────────┘   └─────────┘   └─────────┘
    Umsatz      Materialaufw.  Personalaufw.    EBIT
```

**KRITISCH: Positionierungshierarchie (von oben nach unten):**
1. **Haupt-Bracket** (ganz oben, mit gestrichelten Linien)
2. **Category-Bracket Description** ("vom Umsatz")
3. **Category-Bracket Bubble** ("51,2%")
4. **Wert-Label** ("1.320.000 €")
5. **Balkenkante**

### 6. Skalenbruch (optional)

Für große Start/End-Balken die den Rest des Charts dominieren würden:

```javascript
// ============================================
// Skalenbruch für große Balken
// ============================================
if (config.scaleBreak && config.scaleBreak.enabled &&
    (bar.type === 'start' || bar.type === 'end')) {

    const breakY = yScale(config.scaleBreak.breakAt);

    // Oberer Teil des Balkens
    svgContent += `<rect class="bar bar-${bar.type}"
                         x="${barX}" y="${barY}"
                         width="${barWidth}" height="${breakY - barY - 10}"
                         rx="2"/>`;

    // Unterer Teil des Balkens
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

## LAYOUT-BERECHNUNG

```javascript
// ============================================
// ABSCHNITT: Dimensionen und Layout
// ============================================

// Feste Dimensionen (anpassbar)
const width = 1000;
const height = 450;
const margin = { top: 80, right: 40, bottom: 80, left: 60 };

// Berechnete Chart-Fläche
const chartWidth = width - margin.left - margin.right;
const chartHeight = height - margin.top - margin.bottom;

// ============================================
// ABSCHNITT: Balken-Layout
// ============================================
const numBars = config.bars.length;

// Balkenbreite: Maximum 70px, sonst 60% des verfügbaren Platzes pro Balken
const barWidth = Math.min(70, (chartWidth / numBars) * 0.6);

// Lücke zwischen Balken
const barGap = (chartWidth - numBars * barWidth) / (numBars + 1);

// X-Position für jeden Balken berechnen
function getBarX(index) {
    return margin.left + barGap * (index + 1) + barWidth * index;
}

// ============================================
// ABSCHNITT: Y-Skala berechnen
// ============================================
// WICHTIG: Alle kumulativen Werte sammeln für korrekte Skalierung

const allValues = [];
let cumulative = 0;

config.bars.forEach(bar => {
    if (bar.type === 'start') {
        cumulative = bar.value;
        allValues.push(cumulative);
    } else if (bar.type === 'increase' || bar.type === 'decrease') {
        allValues.push(cumulative);           // Vor der Änderung
        cumulative += bar.value;
        allValues.push(cumulative);           // Nach der Änderung
    } else {
        allValues.push(bar.value);
    }
});

// Maximum mit 15% Headroom für Labels und Bracket
const maxValue = Math.max(...allValues) * 1.15;
const minValue = Math.min(0, ...allValues);

// Y-Skala: Wert → Pixel-Position
// SVG Y=0 ist OBEN, daher invertierte Berechnung!
function yScale(value) {
    return margin.top + chartHeight -
           ((value - minValue) / (maxValue - minValue)) * chartHeight;
}

// Nulllinie (Baseline) für Start/End/Compare Balken
const baselineY = yScale(0);
```

## CSS-KLASSEN

```css
/* ============================================
   BALKEN-STYLES
   ============================================ */
.bar {
    transition: opacity 0.2s ease;  /* Sanfter Hover-Effekt */
}
.bar:hover {
    opacity: 0.8;
    cursor: pointer;
}

/* Balkentyp-Farben */
.bar-start, .bar-end { fill: #1B4F72; }  /* Dunkelblau */
.bar-increase { fill: #7CB342; }          /* Grün */
.bar-decrease { fill: #C0392B; }          /* Rot */
.bar-compare { fill: #808080; }           /* Grau */

/* ============================================
   CONNECTOR-LINIEN
   ============================================ */
.connector-line {
    stroke: #333;
    stroke-width: 1;
    stroke-dasharray: 4,3;  /* Gestrichelt */
}

/* ============================================
   LABEL-STYLES
   ============================================ */
.value-label {
    font-size: 12px;
    font-weight: bold;
    fill: #1a1a1a;
    text-anchor: middle;
}
.value-label-inside {
    font-size: 11px;
    font-weight: bold;
    fill: white;
    text-anchor: middle;
    dominant-baseline: middle;  /* Vertikal zentriert */
}
.axis-label {
    font-size: 11px;
    fill: #333;
    text-anchor: middle;
}

/* ============================================
   BRACKET-ANNOTATION
   ============================================ */
.bracket-line {
    stroke: #333;
    stroke-width: 1.5;
    fill: none;
}
.bracket-line-dashed {
    stroke: #333;
    stroke-width: 1;
    stroke-dasharray: 4,3;
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
.arrow-head { fill: #333; }

/* ============================================
   SKALENBRUCH
   ============================================ */
.scale-break-line {
    stroke: #666;
    stroke-width: 1.5;
    fill: none;
}

/* ============================================
   TOOLTIP
   ============================================ */
.tooltip {
    position: fixed;
    background: rgba(0,0,0,0.85);
    color: white;
    padding: 10px 14px;
    border-radius: 6px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s;
    z-index: 1000;
}
.tooltip.visible { opacity: 1; }
```

## DYNAMIK-PRINZIPIEN

1. **Anzahl Balken**: Beliebig - Layout passt sich automatisch an
2. **Balkentypen**: start, increase, decrease, end, compare - frei kombinierbar
3. **Farben**: Vollständig konfigurierbar pro Typ über config.colors
4. **Labels**: Mehrzeilig mit \n, automatische Zentrierung
5. **Endwert**: Automatisch berechnet wenn nicht explizit gesetzt
6. **Bracket**: Optional, zwischen beliebigen Balken
7. **Skalenbruch**: Optional für große Start/End-Werte

## ANPASSUNG FÜR SPEZIFISCHE USE-CASES

### P&L Bridge (GuV-Brücke):
```javascript
// Von Umsatz zu Gewinn
const config = {
    title: 'P&L Bridge FY23',
    bars: [
        { type: 'start', label: 'Revenue\nFY23', value: 100, displayValue: '€100m' },
        { type: 'decrease', label: 'COGS', value: -60, displayValue: '-€60m' },
        { type: 'end', label: 'Gross\nProfit', displayValue: '€40m' }  // Auto-berechnet!
    ]
};
```

### Cash Flow Bridge:
```javascript
// Kapitalflussrechnung
const config = {
    title: 'Cash Flow Bridge Q4',
    bars: [
        { type: 'start', label: 'Opening\nCash', value: 50, displayValue: '€50m' },
        { type: 'increase', label: 'Operating\nCF', value: 30, displayValue: '+€30m' },
        { type: 'decrease', label: 'CapEx', value: -15, displayValue: '-€15m' },
        { type: 'decrease', label: 'Dividends', value: -10, displayValue: '-€10m' },
        { type: 'end', label: 'Closing\nCash' }  // Auto: 50+30-15-10 = €55m
    ]
};
```

### Varianzanalyse (Budget vs. Actual):
```javascript
// Abweichungsanalyse
const config = {
    title: 'Budget Variance Analysis',
    bars: [
        { type: 'start', label: 'Budget', value: 1000, displayValue: '€1,000k' },
        { type: 'increase', label: 'Volume\nVariance', value: 50, displayValue: '+€50k' },
        { type: 'increase', label: 'Price\nVariance', value: 30, displayValue: '+€30k' },
        { type: 'decrease', label: 'Cost\nVariance', value: -20, displayValue: '-€20k' },
        { type: 'end', label: 'Actual' },  // Auto-berechnet
        { type: 'compare', label: 'Target', value: 1100, displayValue: '€1,100k' }
    ],
    bracket: { show: true, fromIndex: 0, toIndex: 4, label: '+6%' }
};
```

### Zeitreihen-Bridge (Jahresvergleich):
```javascript
// Entwicklung über mehrere Jahre
const config = {
    title: 'Revenue Development 2020-2026',
    bars: [
        { type: 'start', label: '2020', value: 80, displayValue: '80 Mio €' },
        { type: 'increase', label: 'Δ 2021', value: 5, displayValue: '+5 Mio €' },
        { type: 'increase', label: 'Δ 2022', value: 5, displayValue: '+5 Mio €' },
        { type: 'increase', label: 'Δ 2023', value: 5, displayValue: '+5 Mio €' },
        { type: 'increase', label: 'Δ 2024', value: 5, displayValue: '+5 Mio €' },
        { type: 'increase', label: 'Δ 2025', value: 5, displayValue: '+5 Mio €' },
        { type: 'increase', label: 'Δ 2026', value: 155, displayValue: '+155 Mio €' },
        { type: 'end', label: '2026', value: 260, displayValue: '260 Mio €' }
    ],
    // Bei großen Wertsprüngen: Skalenbruch aktivieren
    scaleBreak: { enabled: true, breakAt: 150 }
};
```

---

Generiere nun einen vollständigen, funktionsfähigen HTML-Code basierend auf diesen Spezifikationen.
Die Daten sollen sein: [HIER DATEN EINFÜGEN]
Das Farbschema soll sein: [HIER FARBEN EINFÜGEN]
Bracket anzeigen: [JA/NEIN]
Skalenbruch verwenden: [JA/NEIN]
```

---

## Beispiel-Aufruf

```
Erstelle einen Wasserfall-Chart im Think-Cell-Stil mit folgenden Spezifikationen:

[... vollständiger Prompt von oben ...]

Die Daten sollen sein:
- Start: FY19 Cash Earnings = $6.5m
- Increase: Sales Income +$1.1m, Servicing Income +$0.5m
- Decrease: Ongoing Expenses -$0.5m, Investments -$0.1m, Risk & Compliance -$0.6m
- End: FY20 Cash Earnings (automatisch berechnet)
- Compare: FY20 Competitor = $7.3m

Das Farbschema soll sein: Dunkelblau für Start/End, Grün für Increase, Rot für Decrease, Grau für Compare
Bracket anzeigen: JA, von Start zu End, Label "+8.7%"
Skalenbruch verwenden: NEIN
```

---

## Technische Begründung

### Warum reines SVG statt Chart-Libraries?

| Aspekt | ECharts/Highcharts | Reines SVG |
|--------|-------------------|------------|
| Floating Bars | Umständlich zu konfigurieren | Einfache Y-Positionierung |
| Connector-Linien | Nicht nativ unterstützt | Pixel-perfekte Kontrolle |
| Labels im Balken | Schwierig zu positionieren | Exakte Zentrierung |
| Bracket-Annotation | Nicht verfügbar | Vollständig anpassbar |
| Mehrzeilige X-Labels | Begrenzte Unterstützung | Native SVG tspan |
| Kumulative Berechnung | Externe Berechnung nötig | Integriert in Rendering |

### Kritische Implementierungsdetails

| Detail | Begründung |
|--------|-----------|
| Kumulative Berechnung | Jeder Balken muss den Zustand des vorherigen kennen |
| Connector-Timing | Connectors ZUERST zeichnen (z-index unter Balken) |
| Decrease-Balken | barY ist die Oberkante, Height geht nach unten |
| Label-Position | Inside-Labels benötigen dominant-baseline: middle |
| Mehrzeilige Labels | Mit <tspan> und dy-Attribut |
| Negative End-Werte | Balken unter der Nulllinie rendern! |

---

## Visualisierung

### Aufbau eines Waterfall-Charts:

```
                    ┌───────┐
                    │+$0.5m │ ← Increase (schwebend, grün)
         ┌───────┐  └───────┘
         │+$1.1m │............  ← Connector (gestrichelt)
         └───────┘  ┌───────┐
  $6.5m            │-$0.5m │ ← Decrease (hängend, rot)
┌───────┐..........└───────┘
│       │
│ START │                    $7.1m
│       │                   ┌───────┐
│       │                   │       │
│       │                   │  END  │
│       │                   │       │
└───────┘                   └───────┘
 FY19                         FY20
```

### Bracket-Positionierung:

```
    bracketY (dynamisch berechnet, ÜBER allen Balken + Category-Brackets)
    ─────────────[+8.7%]─────────────────
    │                                   │
    │   ← Vertikale Linien gehen       │
    │      NICHT durch Balken!          │
    ▼                                   ▼ Pfeilspitze
    ┄┄┄┄┄ 30px+ Mindestabstand ┄┄┄┄┄┄┄┄┄  (75px wenn categoryBrackets)
             vom Umsatz                    ← Category-Bracket Description (optional)
             ┌──────┐
             │51,2% │                      ← Category-Bracket Bubble (optional)
             └──────┘
    $6.5m      -$X.Xm               $7.1m  ← Wert-Labels
    ┌───────┐ ┌───────┐           ┌───────┐
    │███████│ │░░░░░░░│           │███████│
    │███████│ │░░░░░░░│           │███████│
    └───────┘ └───────┘           └───────┘
```

### KRITISCH: Abstandsberechnung bei Category-Brackets

Wenn `categoryBrackets` vorhanden sind, muss das Haupt-Bracket höher positioniert werden:

```javascript
// OHNE categoryBrackets: bracketGap = 30px
// MIT categoryBrackets:  bracketGap = 75px (für Bubble + Description)

// WICHTIG: Offset nur am Start/End-Balken erhöhen, wenn DORT ein Category-Bracket ist!
const hasStartCategoryBracket = config.categoryBrackets?.some(cb => cb.barIndex === config.bracket.fromIndex);
const hasEndCategoryBracket = config.categoryBrackets?.some(cb => cb.barIndex === config.bracket.toIndex);

const startCategoryOffset = hasStartCategoryBracket ? 50 : 12;
const endCategoryOffset = hasEndCategoryBracket ? 50 : 12;
```

### Connector-Logik:

```
Balkentyp     | Connector startet bei
--------------|----------------------
START         | Oberkante (barY)
INCREASE      | Neue Oberkante (nach +value)
DECREASE      | Neue Unterkante (nach -value)
END           | (kein Connector danach)
COMPARE       | (kein Connector davor/danach)
```

---

## Häufige Fehler vermeiden

| Problem | Ursache | Lösung |
|---------|---------|--------|
| End-Wert stimmt nicht | Manuelle Werte statt Berechnung | Immer Start + Summe(Änderungen) = End |
| Bracket überlappt Labels | Feste Y-Position | Dynamisch höchsten Balken finden |
| **Bracket überlappt Category-Brackets** | **bracketGap zu klein** | **bracketGap = 75px wenn categoryBrackets vorhanden** |
| **Category-Bracket überlappt Wert-Label** | **Bubble zu nah am Balken** | **bubbleY = barTopY - 26px (nicht -35px)** |
| Connector an falscher Stelle | Decrease-Logik falsch | Nach Decrease: Connector an Unterkante |
| Labels überlappen sich | Zu kleine Balken | minHeightForInsideLabel prüfen |
| Negative Werte falsch | Nur positive Werte bedacht | yScale muss auch negative Werte können |
| Erfundene Kategorien | Daten "angereichert" | NUR echte Daten aus Quelldaten verwenden |

<!-- PROMPT-END -->

---

## Erweiterte Use-Cases

### 1. Budget vs. Actual - Varianzanalyse mit Target

Detaillierte Varianzanalyse mit mehreren Effekten und zusätzlichem Target-Vergleichswert:

```javascript
// ============================================
// USE-CASE: Umsatz Varianzanalyse 2024
// ============================================

const varianceConfig = {
    title: 'Budget vs. Actual - Umsatz Varianzanalyse 2024',
    subtitle: 'in Tsd. EUR',

    bars: [
        // Budget als Startpunkt
        { type: 'budget', label: 'Budget\n2024', value: 1000, displayValue: '€1.000k' },

        // Positive Varianzen (grün)
        { type: 'increase', label: 'Volumen-\nvarianz', value: 85, displayValue: '+€85k' },
        { type: 'increase', label: 'Preis-\nvarianz', value: 42, displayValue: '+€42k' },
        { type: 'increase', label: 'Mix-\nvarianz', value: 28, displayValue: '+€28k' },

        // Negative Varianzen (rot)
        { type: 'decrease', label: 'Kosten-\nvarianz', value: -35, displayValue: '-€35k' },
        { type: 'decrease', label: 'FX-\nvarianz', value: -22, displayValue: '-€22k' },

        // Actual als End-Balken
        { type: 'actual', label: 'Actual\n2024', value: 1098, displayValue: '€1.098k' },

        // Target als Vergleichswert (KEIN Connector davor!)
        { type: 'target', label: 'Target\n2024', value: 1100, displayValue: '€1.100k' }
    ],

    colors: {
        budget: '#2C3E50',     // Dunkelblau für Budget
        actual: '#2C3E50',     // Dunkelblau für Actual
        positive: '#00A5A5',   // Teal für positive Varianzen
        negative: '#E74C3C',   // Rot für negative Varianzen
        target: '#7F8C8D'      // Grau für Target
    },

    bracket: { show: true, fromIndex: 0, toIndex: 6, label: '+9.8%' }
};

// WICHTIG: Neue Balkentypen 'budget', 'actual', 'target' verhalten sich wie:
// - budget/actual → wie 'start'/'end' (volle Balken von Baseline)
// - target → wie 'compare' (kein Connector)
```

**Visuelles Ergebnis:**
```
                    ┌─────[+9.8%]────────────────────────────┐
                    │                                        ↓
   €1.000k      +€85k  +€42k  +€28k  -€35k  -€22k      €1.098k   €1.100k
  ┌───────┐    ┌─────┐┌─────┐┌─────┐                   ┌───────┐ ┌───────┐
  │███████│....│█████││█████││█████│┌─────┐┌─────┐....│███████│ │▒▒▒▒▒▒▒│
  │███████│    └─────┘└─────┘└─────┘│█████││█████│    │███████│ │▒▒▒▒▒▒▒│
  │███████│                         └─────┘└─────┘    │███████│ │▒▒▒▒▒▒▒│
  └───────┘                                           └───────┘ └───────┘
   Budget    Volumen  Preis   Mix   Kosten   FX       Actual     Target
    2024     varianz  varianz varianz varianz varianz   2024       2024
```

### 2. EBITDA Bridge mit detaillierten Effekten

Operative Verbesserungen vs. Einmaleffekte mit Guidance-Vergleich:

```javascript
// ============================================
// USE-CASE: EBITDA Bridge FY23 → FY24
// ============================================

const ebitdaConfig = {
    title: 'EBITDA Bridge FY23 → FY24',
    subtitle: 'in Mio. EUR',

    bars: [
        { type: 'start', label: 'FY23\nEBITDA', value: 245, displayValue: '245' },

        // Operative Verbesserungen
        { type: 'increase', label: 'Umsatz-\nwachstum', value: 38, displayValue: '+38' },
        { type: 'increase', label: 'Preis-\nerhöhung', value: 22, displayValue: '+22' },

        // Kostensteigerungen
        { type: 'decrease', label: 'Material-\nkosten', value: -28, displayValue: '-28' },
        { type: 'decrease', label: 'Personal-\nkosten', value: -15, displayValue: '-15' },

        // Effizienzprogramm (Sondereffekt positiv)
        { type: 'increase', label: 'Effizienz-\nprogramm', value: 18, displayValue: '+18' },

        // Einmaleffekte
        { type: 'decrease', label: 'Einmal-\neffekte', value: -12, displayValue: '-12' },

        { type: 'end', label: 'FY24\nEBITDA', value: 268, displayValue: '268' },

        // Guidance als Benchmark
        { type: 'compare', label: 'Guidance\nFY24', value: 275, displayValue: '275' }
    ],

    colors: {
        start: '#1B4F72',
        end: '#1B4F72',
        positive: '#27AE60',
        negative: '#C0392B',
        compare: '#95A5A6'
    },

    bracket: { show: true, fromIndex: 0, toIndex: 7, label: '+9.4%' }
};
```

### 3. Working Capital Bridge mit detaillierter Aufschlüsselung

Analyse der Working Capital Veränderungen mit Target:

```javascript
// ============================================
// USE-CASE: Working Capital Bridge Q4 2024
// ============================================

const wcConfig = {
    title: 'Working Capital Bridge Q4 2024',
    subtitle: 'in Mio. EUR',

    bars: [
        { type: 'start', label: 'WC\nQ3 2024', value: 180, displayValue: '180' },

        // WC-Komponenten
        { type: 'decrease', label: 'Vorräte\n(Abbau)', value: -25, displayValue: '-25' },
        { type: 'increase', label: 'Forderungen\n(Anstieg)', value: 42, displayValue: '+42' },
        { type: 'decrease', label: 'Verbindlich-\nkeiten', value: -18, displayValue: '-18' },
        { type: 'increase', label: 'Sonstige\nAssets', value: 8, displayValue: '+8' },
        { type: 'decrease', label: 'Rück-\nstellungen', value: -15, displayValue: '-15' },

        { type: 'end', label: 'WC\nQ4 2024', value: 172, displayValue: '172' },
        { type: 'target', label: 'Target\nWC', value: 165, displayValue: '165' }
    ],

    colors: {
        start: '#2980B9',
        end: '#2980B9',
        positive: '#16A085',    // Grün-Teal für Zunahmen
        negative: '#E67E22',    // Orange für Abnahmen
        target: '#7F8C8D'
    },

    bracket: { show: true, fromIndex: 0, toIndex: 6, label: '-4.4%' }
};
```

### 4. Marktanteils-Bridge mit Wettbewerber-Benchmark

Entwicklung nach Segmenten mit Vergleichswert:

```javascript
// ============================================
// USE-CASE: Marktanteils-Entwicklung 2022 → 2024
// ============================================

const marketShareConfig = {
    title: 'Marktanteils-Entwicklung 2022 → 2024',
    subtitle: 'in Prozentpunkten',

    bars: [
        { type: 'start', label: 'Marktanteil\n2022', value: 18.5, displayValue: '18.5%' },

        // Segment-Effekte
        { type: 'increase', label: 'Premium-\nSegment', value: 2.8, displayValue: '+2.8pp' },
        { type: 'increase', label: 'Digital\nChannels', value: 1.5, displayValue: '+1.5pp' },
        { type: 'decrease', label: 'Budget-\nSegment', value: -1.2, displayValue: '-1.2pp' },
        { type: 'increase', label: 'Neue\nMärkte', value: 0.9, displayValue: '+0.9pp' },
        { type: 'decrease', label: 'Wettbewerbs-\ndruck', value: -0.8, displayValue: '-0.8pp' },

        { type: 'end', label: 'Marktanteil\n2024', value: 21.7, displayValue: '21.7%' },

        // Benchmark
        { type: 'compare', label: 'Benchmark\n(Top 3)', value: 24.2, displayValue: '24.2%' }
    ],

    colors: {
        start: '#8E44AD',      // Violett
        end: '#8E44AD',
        positive: '#2ECC71',
        negative: '#E74C3C',
        compare: '#BDC3C7'
    },

    bracket: { show: true, fromIndex: 0, toIndex: 6, label: '+3.2pp' }
};
```

### 5. Personalkosten-Bridge (kombinierte Analyse)

Headcount-Änderungen und Gehaltseffekte kombiniert:

```javascript
// ============================================
// USE-CASE: Personalkosten-Bridge 2024
// ============================================

const personnelConfig = {
    title: 'Personalkosten-Bridge 2024',
    subtitle: 'in Mio. EUR',

    bars: [
        { type: 'budget', label: 'Budget\n2024', value: 85, displayValue: '85' },

        // Headcount-Effekte
        { type: 'increase', label: 'Neuein-\nstellungen', value: 8.5, displayValue: '+8.5' },

        // Gehaltseffekte
        { type: 'increase', label: 'Tarif-\nerhöhung', value: 4.2, displayValue: '+4.2' },
        { type: 'increase', label: 'Bonus/\nVP', value: 3.8, displayValue: '+3.8' },

        // Reduktionen
        { type: 'decrease', label: 'Fluktuation', value: -5.5, displayValue: '-5.5' },
        { type: 'decrease', label: 'Effizienz-\nmaßnahmen', value: -3.2, displayValue: '-3.2' },
        { type: 'decrease', label: 'Outsourcing', value: -2.8, displayValue: '-2.8' },

        { type: 'actual', label: 'Actual\n2024', value: 90, displayValue: '90' },
        { type: 'target', label: 'Plan\n2025', value: 88, displayValue: '88' }
    ],

    colors: {
        budget: '#34495E',
        actual: '#34495E',
        positive: '#00A5A5',
        negative: '#E74C3C',
        target: '#95A5A6'
    },

    bracket: { show: true, fromIndex: 0, toIndex: 7, label: '+5.9%' }
};
```

### 6. Farbkodierte Wert-Labels für Varianzen

Bei Varianzanalysen werden die Wert-Labels farbkodiert:

```javascript
// ============================================
// RENDERING: Farbkodierte Variance-Labels
// ============================================

function renderVarianceLabel(bar, barY, barCenterX, colors) {
    let labelColor = '#1a1a1a';  // Standard: Schwarz

    // Für increase/decrease: Farbige Labels
    if (bar.type === 'increase') {
        labelColor = colors.positive;  // Grün
    } else if (bar.type === 'decrease') {
        labelColor = colors.negative;  // Rot
    }

    // Label über dem Balken (nicht im Balken)
    const labelY = bar.type === 'increase'
        ? barY - 8           // Über grünem Balken
        : barY + barHeight + 16;  // Unter rotem Balken

    return `<text class="value-label"
                  x="${barCenterX}" y="${labelY}"
                  text-anchor="middle" font-size="12"
                  font-weight="bold" fill="${labelColor}">
                ${bar.displayValue}
            </text>`;
}
```

**Visuelles Ergebnis:**
```
              +€85k  +€42k  +€28k           ← Grüne Labels
               ┌──┐  ┌──┐  ┌──┐
               │██│  │██│  │██│  ┌──┐  ┌──┐
               └──┘  └──┘  └──┘  │██│  │██│
                                 └──┘  └──┘
                                -€35k -€22k ← Rote Labels
```

### 7. Erweiterte Legende für Varianzanalysen

```javascript
// ============================================
// ELEMENT: Dynamische Legende
// ============================================

function renderVarianceLegend(config, containerId) {
    const container = document.getElementById(containerId);
    const types = new Set(config.bars.map(b => b.type));

    let legendHTML = '<div class="chart-legend">';

    if (types.has('budget') || types.has('actual') || types.has('start') || types.has('end')) {
        legendHTML += `
            <div class="legend-item">
                <div class="legend-color" style="background: ${config.colors.budget || '#2C3E50'}"></div>
                <span>Budget / Actual</span>
            </div>`;
    }

    if (types.has('increase')) {
        legendHTML += `
            <div class="legend-item">
                <div class="legend-color" style="background: ${config.colors.positive}"></div>
                <span>Positive Varianz</span>
            </div>`;
    }

    if (types.has('decrease')) {
        legendHTML += `
            <div class="legend-item">
                <div class="legend-color" style="background: ${config.colors.negative}"></div>
                <span>Negative Varianz</span>
            </div>`;
    }

    if (types.has('compare') || types.has('target')) {
        legendHTML += `
            <div class="legend-item">
                <div class="legend-color" style="background: ${config.colors.target || '#7F8C8D'}"></div>
                <span>Target</span>
            </div>`;
    }

    legendHTML += '</div>';
    container.innerHTML = legendHTML;
}

// CSS für Legende
/*
.chart-legend {
    display: flex;
    justify-content: center;
    gap: 24px;
    margin-top: 15px;
    flex-wrap: wrap;
}
.legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #333;
}
.legend-color {
    width: 16px;
    height: 16px;
    border-radius: 2px;
}
*/
```

### 8. Hinweise zur Connector-Logik bei Varianzanalysen

```javascript
// ============================================
// KRITISCH: Connector-Regeln für Varianzanalysen
// ============================================

// Bei Varianzanalysen mit Target/Compare:
// - Connector ENDET beim Actual-Balken
// - KEIN Connector zwischen Actual und Target!

function shouldDrawConnector(currentBar, nextBar) {
    // Kein Connector vor Target/Compare
    if (nextBar.type === 'target' || nextBar.type === 'compare') {
        return false;
    }

    // Kein Connector nach End/Actual (wenn danach Target folgt)
    if ((currentBar.type === 'end' || currentBar.type === 'actual') &&
        (nextBar.type === 'target' || nextBar.type === 'compare')) {
        return false;
    }

    return true;
}
```

<!-- PROMPT-INCLUDE -->

## KRITISCH: ORIGINAL-LABELS UND SPRACHE BEIBEHALTEN!

### Regel 1: Sprache beibehalten
- Deutsche Quelldaten → Deutsche Labels im Output
- Englische Quelldaten → Englische Labels im Output
- NIEMALS übersetzen!

### Regel 2: Labels exakt übernehmen
- Verwende EXAKT die Schreibweise aus den Quelldaten
- Groß-/Kleinschreibung beibehalten
- Keine Abkürzungen hinzufügen oder entfernen

### Regel 3: Keine erfundenen Labels
❌ VERBOTEN: Labels die NICHT in den Quelldaten stehen
❌ VERBOTEN: Übersetzungen (z.B. "Kosten" → "Costs")
❌ VERBOTEN: Synonyme (z.B. "Umsatz" → "Erlöse")

### Beispiele:
| Quelldaten | ❌ FALSCH | ✅ RICHTIG |
|------------|----------|-----------|
| Materialaufwand | Material Costs | Materialaufwand |
| Revenue | Umsatz | Revenue |
| EBIT | Betriebsergebnis | EBIT |
| Personalkosten | Personnel | Personalkosten |

<!-- PROMPT-INCLUDE-END -->
