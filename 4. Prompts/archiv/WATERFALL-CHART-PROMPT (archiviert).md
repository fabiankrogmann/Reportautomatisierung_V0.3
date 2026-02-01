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
        connector: '#333333',  // Farbe der gestrichelten Verbindungslinien
        // Zusätzliche Bar-Typen
        subtotal: '#6B7280',   // Grau für Zwischenergebnisse (EBITDA, Gross Profit)
        delta: 'auto'          // Automatisch: verwendet positive/negative je nach Vorzeichen
    },

    // ============================================
    // ABSCHNITT: Balkendaten
    // ============================================
    // Jeder Balken hat: type, label, value, displayValue
    // Types: 'start', 'increase', 'decrease', 'end', 'compare', 'subtotal', 'delta'
    // Zusätzlich für Varianzanalyse: 'budget', 'actual', 'target'
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
    },

    // ============================================
    // ABSCHNITT: Compare-Bars (Layout-Varianten WF-14 bis WF-19)
    // ============================================
    // Zeigt zusätzliche Szenario-Werte neben den Haupt-Bridge-Balken
    compareConfig: {
        enabled: false,        // Aktiviert Compare-Bars Feature
        position: 'right',     // 'right' oder 'left' - Position der Vergleichsbalken
        style: 'narrow',       // 'narrow' (schmaler) oder 'equal' (gleiche Breite)
        scenarios: ['FC'],     // Welche Szenarien als Compare-Bars anzeigen
        legend: true           // Legende für Compare-Bars anzeigen
    }
};

// ============================================
// Compare-Bars Rendering (Layout-Varianten)
// ============================================
// Bei aktivierten Compare-Bars werden schmale Vergleichsbalken
// neben den Hauptbalken gerendert.
//
// Beispiel-Struktur in bars[]:
// {
//     type: 'start',
//     label: 'Budget',
//     value: 2100000,
//     compareBars: [
//         { scenario: 'FC', value: 2180000 }
//     ]
// }
//
// Rendering-Logik:
// - compareConfig.position = 'right': Hauptbalken links, Compare rechts
// - compareConfig.position = 'left': Compare links, Hauptbalken rechts
// - compareBarWidth = barWidth * 0.4 bei style: 'narrow'
// - Farbe aus config.colors.compareScenarios['FC'] oder Fallback
//
// Horizontale Positionierung:
// - Bei 'right': xMain = xBase, xCompare = xBase + mainWidth + gap
// - Bei 'left': xCompare = xBase, xMain = xBase + compareWidth + gap
//
// Die Compare-Bars zeigen den gleichen Datenpunkt (z.B. Umsatz) aus einem
// anderen Szenario, sodass der User direkt vergleichen kann.

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

#### Subtotal-Balken (type: 'subtotal')
- Volle Höhe vom Boden bis zum Wert (wie 'end')
- Farbe: colors.subtotal (Standard: Grau #6B7280)
- Für Zwischenergebnisse wie Bruttoergebnis, EBITDA, etc.
- HAT Connector-Linien davor UND danach (im Gegensatz zu 'compare')

```javascript
// ============================================
// Subtotal-Balken Rendering
// ============================================
// Subtotal zeigt Zwischenergebnisse - voller Balken mit Connectors
if (bar.type === 'subtotal') {
    const subtotalValue = bar.value !== undefined ? bar.value : cumulative;

    // Voller Balken von Nulllinie bis Wert
    const barY = yScale(subtotalValue);
    const barHeight = baselineY - barY;

    // Connector für nächsten Balken: Oberkante dieses Balkens
    connectorY = barY;

    // Kumulierten Wert NICHT zurücksetzen - Bridge geht weiter
    // cumulative bleibt unverändert
}
```

#### Delta-Balken (type: 'delta')
- Dynamischer Balken - verhält sich je nach Vorzeichen wie 'increase' oder 'decrease'
- Positiver Wert → Grün, schwebend (wie increase)
- Negativer Wert → Rot, hängend (wie decrease)
- Nützlich wenn Vorzeichen der Varianz nicht vorher bekannt ist

```javascript
// ============================================
// Delta-Balken Rendering (dynamische Varianz)
// ============================================
// Delta-Balken: Farbe und Verhalten basieren auf Vorzeichen
if (bar.type === 'delta') {
    if (bar.value >= 0) {
        // Positiv → wie 'increase'
        const barY = yScale(cumulative + bar.value);
        const barHeight = yScale(cumulative) - barY;
        connectorY = barY;
        // Farbe: colors.positive (grün)
        barColor = config.colors.positive;
    } else {
        // Negativ → wie 'decrease'
        const barY = yScale(cumulative);
        const barHeight = yScale(cumulative + bar.value) - barY;
        connectorY = yScale(cumulative + bar.value);
        // Farbe: colors.negative (rot)
        barColor = config.colors.negative;
    }
    cumulative += bar.value;
}
```

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

### 5. Feature-Rendering (Modulare Features)

Die folgenden Features werden nur gerendert, wenn sie in `config.features` aktiviert sind.
Die vollständige Rendering-Logik befindet sich in den Feature-Modulen unter `Features/Waterfall/`.

**Rendering-Reihenfolge:**
1. Scale-Break (beeinflusst Y-Skala) - wenn `config.features.scaleBreak.enabled`
2. Basis-Balken (immer)
3. Connector-Linien (immer)
4. Wert-Labels (immer)
5. Benchmark-Lines - wenn `config.features.benchmarkLines.enabled`
6. Category-Brackets - wenn `config.features.categoryBrackets.enabled`
7. Bracket ODER Arrows - wenn `config.features.bracket.enabled` bzw. `config.features.arrows.enabled`

<!-- FEATURE-INCLUDE: scaleBreak -->
**Scale-Break** (Skalenbruch): Zickzack-Muster für extreme Wertunterschiede zwischen Start/End-Balken und Deltas.
→ Vollständige Rendering-Logik: `Features/Waterfall/SCALE-BREAK.md`

<!-- FEATURE-INCLUDE: categoryBrackets -->
**Category-Brackets** (Anteil-Annotationen): Prozentuale Anteile über einzelnen Balken (z.B. "51,2% vom Umsatz").
→ Vollständige Rendering-Logik: `Features/Waterfall/CATEGORY-BRACKET.md`

<!-- FEATURE-INCLUDE: bracket -->
**Bracket** (Prozentuale Veränderung): Zeigt Gesamtveränderung zwischen Start- und End-Balken mit Bubble-Label.
→ Vollständige Rendering-Logik: `Features/Waterfall/BRACKET.md`

<!-- FEATURE-INCLUDE: arrows -->
**Arrows** (Balken-Verbindungen): Alternative zu Bracket für spezifische Vergleiche zwischen nicht-benachbarten Balken.
→ Vollständige Rendering-Logik: `Features/Waterfall/ARROWS.md`

<!-- FEATURE-INCLUDE: benchmarkLines -->
**Benchmark-Lines** (Horizontale Zielwert-Linien): Zeigt Target-/Guidance-Werte als horizontale Linien.
→ Vollständige Rendering-Logik: `Features/Waterfall/BENCHMARK-LINES.md`

### Feature-Config Format

Features werden über `config.features` konfiguriert (generiert von PROMPT-3):

```javascript
config.features = {
    bracket: {
        enabled: true,
        mode: "budget",           // standard, yoy, budget, fc, cagr, multiple
        fromIndex: 0,
        toIndex: 6,
        label: "+9.8% vs. Budget",
        _reason: "Budget und IST vorhanden, signifikante Abweichung"
    },
    scaleBreak: {
        enabled: true,
        breakAt: 85000,
        style: "zigzag",
        _reason: "Start (1.000.000) / Ø Delta (42.400) = 25.9 > 3"
    },
    categoryBrackets: {
        enabled: false,
        _reason: "Nicht für Variance-Templates"
    }
};
```

### KRITISCH: Positionierungshierarchie (von oben nach unten)

```
1. Haupt-Bracket (ganz oben, mit gestrichelten Linien)
2. Category-Bracket Description ("vom Umsatz")
3. Category-Bracket Bubble ("51,2%")
4. Wert-Label ("1.320.000 €")
5. Balkenkante
6. ... (Chart-Bereich)
7. X-Achsen-Labels
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

// WICHTIG: FESTE Balkenbreite für Konsistenz zwischen allen Charts!
// Alle Charts verwenden dieselbe Breite, unabhängig von der Balkenanzahl.
// Bei vielen Balken wird die Chart-Breite entsprechend angepasst.
const barWidth = 50;  // Feste Breite in Pixel - NICHT dynamisch berechnen!

// Mindestabstand zwischen Balken
const minBarGap = 15;

// Prüfen ob alle Balken mit dem festen barWidth passen
const requiredWidth = numBars * barWidth + (numBars + 1) * minBarGap;
const availableWidth = chartWidth;

// Lücke zwischen Balken: gleichmäßig verteilt, aber mindestens minBarGap
const barGap = Math.max(minBarGap, (availableWidth - numBars * barWidth) / (numBars + 1));

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
2. **Balkentypen**: start, increase, decrease, end, compare, subtotal, delta - frei kombinierbar
3. **Farben**: Vollständig konfigurierbar pro Typ über config.colors
4. **Labels**: Mehrzeilig mit \n, automatische Zentrierung
5. **Endwert**: Automatisch berechnet wenn nicht explizit gesetzt
6. **Features**: Modulare Features über `config.features` gesteuert (siehe Abschnitt 5)

## Connector-Logik

```
Balkentyp     | Connector startet bei
--------------|----------------------
START         | Oberkante (barY)
INCREASE      | Neue Oberkante (nach +value)
DECREASE      | Neue Unterkante (nach -value)
SUBTOTAL      | Oberkante (wie Start)
END           | (kein Connector danach)
COMPARE       | (kein Connector davor/danach)
```

```javascript
// Connector-Regeln für Varianzanalysen mit Target/Compare:
function shouldDrawConnector(currentBar, nextBar) {
    if (nextBar.type === 'target' || nextBar.type === 'compare') return false;
    if ((currentBar.type === 'end' || currentBar.type === 'actual') &&
        (nextBar.type === 'target' || nextBar.type === 'compare')) return false;
    return true;
}
```

---

## Häufige Fehler vermeiden

| Problem | Ursache | Lösung |
|---------|---------|--------|
| End-Wert stimmt nicht | Manuelle Werte statt Berechnung | Immer Start + Summe(Änderungen) = End |
| Bracket überlappt Labels | Feste Y-Position | Dynamisch höchsten Balken finden |
| Feature-Konflikte | Bracket + Arrows gleichzeitig | Nur eines aktivieren (siehe Feature-Katalog) |
| Connector an falscher Stelle | Decrease-Logik falsch | Nach Decrease: Connector an Unterkante |
| Labels überlappen sich | Zu kleine Balken | minHeightForInsideLabel prüfen |
| Negative Werte falsch | Nur positive Werte bedacht | yScale muss auch negative Werte können |
| Erfundene Kategorien | Daten "angereichert" | NUR echte Daten aus Quelldaten verwenden |

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

<!-- PROMPT-END -->

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
- VERBOTEN: Labels die NICHT in den Quelldaten stehen
- VERBOTEN: Übersetzungen (z.B. "Kosten" -> "Costs")
- VERBOTEN: Synonyme (z.B. "Umsatz" -> "Erlöse")

### Beispiele:
| Quelldaten | FALSCH | RICHTIG |
|------------|--------|---------|
| Materialaufwand | Material Costs | Materialaufwand |
| Revenue | Umsatz | Revenue |
| EBIT | Betriebsergebnis | EBIT |
| Personalkosten | Personnel | Personalkosten |

<!-- PROMPT-INCLUDE-END -->
