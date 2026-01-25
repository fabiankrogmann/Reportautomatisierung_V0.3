# Think-Cell Style Stacked Bar Chart Generator Prompt

## Anwendung
Verwende diesen Prompt, um pixel-perfekte, dynamische gestapelte Säulendiagramme im Think-Cell-Stil zu generieren. Ideal für Kostenaufschlüsselungen, Marktanteile, Portfolio-Analysen und Zusammensetzungs-Vergleiche.

### Chart-Typ: Stacked Bar Chart (Gestapeltes Säulendiagramm)
- **Struktur**: Vertikale Balken bestehend aus mehreren farblich unterschiedlichen Segmenten, die von unten nach oben gestapelt sind
- **Anwendung**: Darstellung von Teil-Ganzes-Beziehungen, Kostenstrukturen, Marktanteile, Portfolio-Zusammensetzungen
- **Abgrenzung**: Im Gegensatz zum einfachen Bar-Chart zeigt der Stacked Bar die Zusammensetzung jedes Balkens aus mehreren Kategorien

---

<!-- PROMPT-START -->

## Der Prompt

Erstelle ein dynamisches, interaktives Stacked Bar Chart (gestapeltes Säulendiagramm) im Think-Cell-Stil mit folgenden Spezifikationen:

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
    title: 'Kostenstruktur nach Standort',
    subtitle: 'in Tausend Euro',

    // ============================================
    // ABSCHNITT: Kategorien (X-Achse)
    // ============================================
    // Die Hauptbalken - jede Kategorie wird ein Balken
    // hatched: true = schraffiert (für vergangene/historische Jahre)
    // hatched: false = solid (für aktuelles Jahr oder Plan/Forecast)
    // sublabel: optionaler Text unter dem Hauptlabel (z.B. Jahr, "(Plan)")
    categories: [
        { label: '2021', sublabel: '', hatched: true },      // Vergangen = schraffiert
        { label: '2022', sublabel: '', hatched: true },      // Vergangen = schraffiert
        { label: '2023', sublabel: '', hatched: true },      // Vergangen = schraffiert
        { label: '2024', sublabel: '', hatched: false },     // Aktuell = solid
        { label: '2025', sublabel: '(Plan)', hatched: false } // Plan = solid + Markierung
    ],

    // ============================================
    // ABSCHNITT: Segmente (Schichten im Balken)
    // ============================================
    // Jedes Segment hat einen Namen, eine Farbe und Werte für JEDE Kategorie
    // Segmente werden von UNTEN nach OBEN gestapelt (erstes Segment = unten)
    segments: [
        {
            name: 'Personal',           // Segment-Name für Legende
            color: '#2E5A88',           // Dunkelblau (unten = dunkel)
            values: [450, 520, 380, 410, 430]  // Ein Wert pro Kategorie!
        },
        {
            name: 'Miete',
            color: '#5B8DBE',           // Mittleres Blau
            values: [180, 280, 150, 220, 240]
        },
        {
            name: 'Material',
            color: '#8BBDE0',           // Helles Blau
            values: [120, 95, 140, 85, 90]
        },
        {
            name: 'Sonstiges',
            color: '#C4E0F0',           // Sehr helles Blau (oben = hell)
            values: [50, 45, 30, 65, 70]
        }
    ],

    // ============================================
    // ABSCHNITT: Optionen
    // ============================================
    options: {
        // Wert-Anzeige
        showValues: true,           // Werte in Segmenten anzeigen
        showPercentages: false,     // Prozentangaben statt absoluter Werte
        showTotals: true,           // Gesamtsumme über Balken

        // Legende
        showLegend: true,           // Legende anzeigen
        legendPosition: 'bottom',   // 'bottom', 'right', 'top'

        // Layout
        minSegmentHeight: 25,       // Mindesthöhe für Label im Segment (px)
        barWidth: 80,               // Balkenbreite (optional, sonst dynamisch)
        sortSegments: 'none',       // 'none', 'ascending', 'descending'

        // ============================================
        // ABSCHNITT: Bracket-Konfiguration
        // ============================================
        // WICHTIG: Bei 4+ Kategorien NICHT showBrackets: true verwenden!
        showBrackets: false,        // Automatische Brackets zwischen ALLEN Balken

        // EMPFOHLEN: Selektive Brackets nur für wichtige Übergänge
        brackets: [
            { fromCategory: 2, toCategory: 3 },   // 2023 → 2024 (IST → IST)
            { fromCategory: 3, toCategory: 4 }    // 2024 → 2025 (IST → PLAN)
        ],

        // Format der Bracket-Anzeige
        bracketFormat: 'both',      // 'percent', 'absolute', 'both' (empfohlen)
        // 'percent': +18%
        // 'absolute': +150
        // 'both': +150 (+18%)

        // Highlight (optional)
        highlight: {
            segmentIndex: 0,        // Welches Segment hervorheben
            strokeColor: '#000',
            strokeWidth: 2
        }
    }
};

## KRITISCH: Anzahl der Werte muss zur Anzahl der Kategorien passen!

**Jedes Segment MUSS genau so viele Werte haben wie es Kategorien gibt!**

❌ FALSCH: 3 Kategorien aber nur 2 Werte pro Segment
✅ RICHTIG: 3 Kategorien = 3 Werte pro Segment

## CHART-ELEMENTE

### 1. Gestapelte Balken

Jeder Balken besteht aus mehreren Segmenten, die von unten nach oben gestapelt werden:

```javascript
// ============================================
// Segment-Stapelung von unten nach oben
// ============================================

// Gesamtsumme pro Kategorie berechnen
const categoryTotals = config.categories.map((_, catIndex) =>
    config.segments.reduce((sum, seg) => sum + seg.values[catIndex], 0)
);

// Maximale Gesamtsumme für Y-Skala
const maxTotal = Math.max(...categoryTotals);

// Für jede Kategorie die Segmente stapeln
config.categories.forEach((category, catIndex) => {
    let currentY = chartBottom;  // Starte am Boden des Charts

    config.segments.forEach((segment, segIndex) => {
        const value = segment.values[catIndex];

        // Höhe proportional zum Maximalwert
        const segmentHeight = (value / maxTotal) * chartHeight;

        // Y-Position (SVG: Y=0 ist OBEN!)
        const segmentY = currentY - segmentHeight;

        // Segment zeichnen
        const isTopSegment = segIndex === config.segments.length - 1;
        svgContent += `<rect
            class="stacked-bar"
            x="${barX}"
            y="${segmentY}"
            width="${barWidth}"
            height="${segmentHeight}"
            fill="${category.hatched ? `url(#hatch-${segIndex})` : segment.color}"
            ${isTopSegment ? 'rx="2"' : ''}
            data-category="${catIndex}"
            data-segment="${segIndex}"
            data-value="${value}"
        />`;

        // Position für nächstes Segment merken
        currentY = segmentY;
    });
});
```

### 2. Schraffur für historische Jahre (hatched)

Wenn `category.hatched: true`, werden Segmente mit diagonaler Schraffur + Transparenz dargestellt:

```javascript
// ============================================
// SVG Pattern Definition in <defs>
// ============================================
// Für jede Segment-Farbe ein eigenes Schraffur-Pattern

function createHatchPattern(id, baseColor) {
    return `
        <pattern id="${id}"
                 patternUnits="userSpaceOnUse"
                 width="6" height="6"
                 patternTransform="rotate(45)">
            <!-- Halbtransparente Grundfarbe -->
            <rect width="6" height="6"
                  fill="${baseColor}"
                  fill-opacity="0.6"/>
            <!-- Weiße diagonale Linien -->
            <line x1="0" y1="0" x2="0" y2="6"
                  stroke="white"
                  stroke-width="1"
                  stroke-opacity="0.3"/>
        </pattern>
    `;
}

// Pattern-Definitionen im SVG erstellen
let defs = '<defs>';
config.segments.forEach((seg, i) => {
    defs += createHatchPattern(`hatch-${i}`, seg.color);
});
defs += '</defs>';

// Am Anfang des SVG-Contents einfügen
svgContent = defs + svgContent;
```

**Visueller Effekt:**
- 60% Opacity der Grundfarbe
- Feine weiße 45°-Linien (30% Opacity)
- Klare visuelle Unterscheidung zwischen "vergangen" und "aktuell"

### 3. Segment-Labels (Werte im Balken)

```javascript
// ============================================
// Wert-Labels in Segmenten
// ============================================
const minHeightForLabel = config.options.minSegmentHeight || 25;

// Nur anzeigen wenn Segment groß genug
if (segmentHeight >= minHeightForLabel) {
    // Position: Vertikal zentriert im Segment
    const labelY = segmentY + segmentHeight / 2;

    // Kontrastfarbe für Lesbarkeit
    const textColor = getContrastColor(segment.color);

    // Wert formatieren
    const displayValue = config.options.showPercentages
        ? `${Math.round(value / categoryTotals[catIndex] * 100)}%`
        : value.toLocaleString('de-DE');

    svgContent += `<text
        class="segment-label"
        x="${barCenterX}"
        y="${labelY}"
        fill="${textColor}"
    >${displayValue}</text>`;
}

// Kontrast-Berechnung für Textfarbe
function getContrastColor(hexColor) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    // Luminanz berechnen
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Dunkel auf hellem Hintergrund, Hell auf dunklem
    return luminance > 0.5 ? '#333333' : '#FFFFFF';
}
```

### 4. Gesamt-Labels (über Balken)

```javascript
// ============================================
// Gesamtsumme über jedem Balken
// ============================================
if (config.options.showTotals) {
    const total = categoryTotals[catIndex];
    const topY = chartBottom - (total / maxTotal) * chartHeight;

    svgContent += `<text
        class="total-label"
        x="${barCenterX}"
        y="${topY - 8}"
    >${total.toLocaleString('de-DE')}</text>`;
}
```

### 5. X-Achsen-Labels (Zweizeilig möglich)

```javascript
// ============================================
// Kategorie-Labels mit optionalem Sublabel
// ============================================
config.categories.forEach((category, catIndex) => {
    const barCenterX = getBarCenterX(catIndex);

    svgContent += `<text
        class="category-text"
        x="${barCenterX}"
        y="${xAxisY}"
        text-anchor="middle"
    >
        <!-- Hauptlabel -->
        <tspan class="category-label" x="${barCenterX}">
            ${category.label}
        </tspan>

        <!-- Sublabel (falls vorhanden) -->
        ${category.sublabel ? `
            <tspan class="category-sublabel"
                   x="${barCenterX}"
                   dy="14">
                ${category.sublabel}
            </tspan>
        ` : ''}
    </text>`;
});
```

### 6. Legende

```javascript
// ============================================
// Legende automatisch aus Segmenten generieren
// ============================================
if (config.options.showLegend) {
    let legendX = margin.left;
    let legendY = height - 30;  // Unten

    // Für horizontale Legende: Abstand zwischen Items
    const legendItemWidth = 100;

    config.segments.forEach((segment, index) => {
        svgContent += `
            <g class="legend-item" data-segment="${index}">
                <!-- Farbiges Rechteck -->
                <rect x="${legendX}"
                      y="${legendY}"
                      width="12" height="12"
                      fill="${segment.color}"
                      rx="2"/>

                <!-- Segment-Name -->
                <text class="legend-text"
                      x="${legendX + 18}"
                      y="${legendY + 10}">
                    ${segment.name}
                </text>
            </g>
        `;

        legendX += legendItemWidth;  // Nächstes Item
    });
}
```

### 7. Bracket-Annotations (Änderungen zwischen Balken)

```javascript
// ============================================
// Bracket zwischen zwei Kategorien
// ============================================

function renderBracket(fromCatIndex, toCatIndex, bracketFormat) {
    const total1 = categoryTotals[fromCatIndex];
    const total2 = categoryTotals[toCatIndex];

    // Änderungen berechnen
    const absoluteChange = total2 - total1;
    const percentChange = ((absoluteChange / total1) * 100).toFixed(0);

    // Text formatieren basierend auf bracketFormat
    let changeText;
    switch (bracketFormat) {
        case 'absolute':
            changeText = absoluteChange >= 0
                ? `+${absoluteChange.toLocaleString('de-DE')}`
                : absoluteChange.toLocaleString('de-DE');
            break;
        case 'both':
            const absText = absoluteChange >= 0
                ? `+${absoluteChange.toLocaleString('de-DE')}`
                : absoluteChange.toLocaleString('de-DE');
            const pctText = `${percentChange >= 0 ? '+' : ''}${percentChange}%`;
            changeText = `${absText} (${pctText})`;
            break;
        default: // 'percent'
            changeText = `${percentChange >= 0 ? '+' : ''}${percentChange}%`;
    }

    // X-Positionen
    const x1 = getBarCenterX(fromCatIndex);
    const x2 = getBarCenterX(toCatIndex);
    const midX = (x1 + x2) / 2;

    // Y-Positionen (oberhalb der Total-Labels)
    const topY1 = chartBottom - (total1 / maxTotal) * chartHeight;
    const topY2 = chartBottom - (total2 / maxTotal) * chartHeight;
    const labelGap = 25;  // Abstand zu Total-Label
    const higherTop = Math.min(topY1, topY2) - labelGap;

    // Bubble-Dimensionen
    const bubbleHeight = 18;
    const bubbleWidth = changeText.length * 6.5 + 16;
    const bubbleY = higherTop - 8 - bubbleHeight;
    const bubbleCenterY = bubbleY + bubbleHeight / 2;

    let bracketSVG = '';

    // Bubble (Hintergrund)
    bracketSVG += `<rect class="bracket-bubble"
                         x="${midX - bubbleWidth / 2}"
                         y="${bubbleY}"
                         width="${bubbleWidth}"
                         height="${bubbleHeight}"
                         rx="9"/>`;

    // Bubble Text
    bracketSVG += `<text class="change-label"
                         x="${midX}"
                         y="${bubbleCenterY}">
                     ${changeText}
                   </text>`;

    // Horizontale Linien
    bracketSVG += `<line class="bracket-line"
                         x1="${x1}" y1="${bubbleCenterY}"
                         x2="${midX - bubbleWidth / 2}" y2="${bubbleCenterY}"/>`;
    bracketSVG += `<line class="bracket-line"
                         x1="${midX + bubbleWidth / 2}" y1="${bubbleCenterY}"
                         x2="${x2}" y2="${bubbleCenterY}"/>`;

    // Vertikale Linien
    bracketSVG += `<line class="bracket-line"
                         x1="${x1}" y1="${topY1 - labelGap}"
                         x2="${x1}" y2="${bubbleCenterY}"/>`;
    bracketSVG += `<line class="bracket-line"
                         x1="${x2}" y1="${bubbleCenterY}"
                         x2="${x2}" y2="${topY2 - labelGap}"/>`;

    // Pfeilspitze am Ende
    const arrowSize = 5;
    bracketSVG += `<polygon class="arrow-head"
                            points="${x2},${topY2 - labelGap}
                                    ${x2 - arrowSize},${topY2 - labelGap - arrowSize * 1.5}
                                    ${x2 + arrowSize},${topY2 - labelGap - arrowSize * 1.5}"/>`;

    return bracketSVG;
}

// Brackets rendern (NACH allen Balken für korrekten Z-Index)
if (config.options.brackets && config.options.brackets.length > 0) {
    const format = config.options.bracketFormat || 'percent';
    config.options.brackets.forEach(bracket => {
        svgContent += renderBracket(
            bracket.fromCategory,
            bracket.toCategory,
            format
        );
    });
}
```

### 8. Tooltip

```javascript
// ============================================
// Tooltip bei Hover über Segment
// ============================================

// HTML Tooltip-Element erstellen
const tooltip = document.createElement('div');
tooltip.className = 'tooltip';
document.body.appendChild(tooltip);

// Event Listener für Segmente
document.querySelectorAll('.stacked-bar').forEach(bar => {
    bar.addEventListener('mouseenter', (e) => {
        const catIndex = e.target.dataset.category;
        const segIndex = e.target.dataset.segment;
        const value = e.target.dataset.value;

        const segment = config.segments[segIndex];
        const category = config.categories[catIndex];
        const total = categoryTotals[catIndex];
        const percentage = Math.round(value / total * 100);

        tooltip.innerHTML = `
            <strong>${segment.name}</strong><br>
            ${Number(value).toLocaleString('de-DE')} (${percentage}%)<br>
            <small>${category.label}</small>
        `;
        tooltip.classList.add('visible');
    });

    bar.addEventListener('mousemove', (e) => {
        tooltip.style.left = e.clientX + 15 + 'px';
        tooltip.style.top = e.clientY - 10 + 'px';
    });

    bar.addEventListener('mouseleave', () => {
        tooltip.classList.remove('visible');
    });
});
```

## LAYOUT-BERECHNUNG

```javascript
// ============================================
// ABSCHNITT: Dimensionen und Layout
// ============================================

// Feste Dimensionen (anpassbar)
const width = 900;
const height = 500;
const margin = { top: 80, right: 40, bottom: 80, left: 40 };

// Berechnete Chart-Fläche
const chartWidth = width - margin.left - margin.right;
const chartHeight = height - margin.top - margin.bottom;

// ============================================
// ABSCHNITT: Balken-Layout
// ============================================
const numCategories = config.categories.length;

// Balkenbreite: Konfiguriert oder dynamisch
const barWidth = config.options.barWidth ||
                 Math.min(80, (chartWidth / numCategories) * 0.6);

// Lücke zwischen Balken
const barGap = (chartWidth - (numCategories * barWidth)) / (numCategories + 1);

// X-Position für jeden Balken
function getBarX(catIndex) {
    return margin.left + barGap + catIndex * (barWidth + barGap);
}

function getBarCenterX(catIndex) {
    return getBarX(catIndex) + barWidth / 2;
}

// Chart-Boden (Y-Achsen-Basis)
const chartBottom = margin.top + chartHeight;

// X-Achsen-Position für Labels
const xAxisY = chartBottom + 20;
```

## CSS-KLASSEN

```css
/* ============================================
   BALKEN-STYLES
   ============================================ */
.stacked-bar {
    cursor: pointer;
    transition: opacity 0.2s ease;
}
.stacked-bar:hover {
    opacity: 0.85;
}

/* ============================================
   LABEL-STYLES
   ============================================ */
.segment-label {
    font-size: 11px;
    font-weight: bold;
    text-anchor: middle;
    dominant-baseline: middle;
    pointer-events: none;  /* Klicks durchlassen */
}

.total-label {
    font-size: 13px;
    font-weight: bold;
    fill: #1a1a1a;
    text-anchor: middle;
}

.category-label {
    font-size: 12px;
    font-weight: bold;
    fill: #333;
}

.category-sublabel {
    font-size: 10px;
    fill: #666;
}

/* ============================================
   LEGENDE
   ============================================ */
.legend-item {
    cursor: pointer;
}
.legend-item:hover {
    opacity: 0.8;
}
.legend-text {
    font-size: 11px;
    fill: #333;
}

/* ============================================
   BRACKET-ANNOTATION
   ============================================ */
.bracket-line {
    stroke: #333;
    stroke-width: 1.5;
    fill: none;
}

.bracket-bubble {
    fill: white;
    stroke: #333;
    stroke-width: 1.5;
}

.change-label {
    font-size: 10px;
    font-weight: bold;
    fill: #1a1a1a;
    text-anchor: middle;
    dominant-baseline: middle;
}

.arrow-head {
    fill: #333;
}

/* ============================================
   TOOLTIP
   ============================================ */
.tooltip {
    position: fixed;
    background: rgba(0, 0, 0, 0.85);
    color: white;
    padding: 10px 14px;
    border-radius: 6px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s;
    z-index: 1000;
}
.tooltip.visible {
    opacity: 1;
}
```

## DYNAMIK-PRINZIPIEN

1. **Anzahl Kategorien**: Beliebig (2, 3, 4, ...) - Balkenbreite passt sich an
2. **Anzahl Segmente**: Beliebig - Farben und Labels aus config
3. **Farben**: Pro Segment individuell (idealerweise Farbabstufungen)
4. **Labels**: Automatisch ein-/ausgeblendet basierend auf Segment-Höhe
5. **Schraffur**: Über hatched-Property pro Kategorie steuerbar
6. **Legende**: Automatisch generiert, interaktiv
7. **Brackets**: Selektiv zwischen wichtigen Kategorien

## ANPASSUNG FÜR SPEZIFISCHE USE-CASES

### Kostenaufschlüsselung:
```javascript
// Blau-Abstufung von dunkel (unten) nach hell (oben)
const config = {
    title: 'Kostenstruktur 2021-2024',
    categories: [
        { label: '2021', hatched: true },
        { label: '2022', hatched: true },
        { label: '2023', hatched: true },
        { label: '2024', hatched: false }
    ],
    segments: [
        { name: 'Personal', color: '#1E3A5F', values: [450, 480, 510, 540] },
        { name: 'Miete', color: '#2E5A88', values: [180, 190, 200, 210] },
        { name: 'Material', color: '#5B8DBE', values: [120, 130, 140, 150] },
        { name: 'Marketing', color: '#8BBDE0', values: [80, 90, 100, 110] },
        { name: 'Sonstiges', color: '#C4E0F0', values: [50, 55, 60, 65] }
    ],
    options: {
        showValues: true,
        showTotals: true,
        brackets: [{ fromCategory: 2, toCategory: 3 }],
        bracketFormat: 'both'
    }
};
```

### Marktanteile (mit Highlight):
```javascript
// Eigenes Produkt hervorheben
const config = {
    title: 'Marktanteile Q1-Q4 2024',
    categories: [
        { label: 'Q1', sublabel: '2024' },
        { label: 'Q2', sublabel: '2024' },
        { label: 'Q3', sublabel: '2024' },
        { label: 'Q4', sublabel: '2024' }
    ],
    segments: [
        { name: 'Unser Produkt', color: '#E63946', values: [35, 38, 42, 45] },
        { name: 'Wettbewerber A', color: '#6C757D', values: [25, 24, 23, 22] },
        { name: 'Wettbewerber B', color: '#ADB5BD', values: [20, 19, 18, 17] },
        { name: 'Andere', color: '#DEE2E6', values: [20, 19, 17, 16] }
    ],
    options: {
        showPercentages: true,  // Prozent statt absolut
        highlight: { segmentIndex: 0, strokeColor: '#000', strokeWidth: 2 }
    }
};
```

### Umsatz nach Regionen (mit Plan):
```javascript
// IST vs. PLAN mit selektivem Bracket
const config = {
    title: 'Umsatz nach Region',
    subtitle: 'in Mio EUR',
    categories: [
        { label: '2022', hatched: true },
        { label: '2023', hatched: true },
        { label: '2024', hatched: false },
        { label: '2025', sublabel: '(Plan)', hatched: false }
    ],
    segments: [
        { name: 'EMEA', color: '#2D6A4F', values: [120, 135, 142, 155] },
        { name: 'Americas', color: '#40916C', values: [200, 215, 228, 250] },
        { name: 'APAC', color: '#74C69D', values: [80, 95, 110, 130] }
    ],
    options: {
        showValues: true,
        showTotals: true,
        // Nur Bracket zwischen IST und PLAN
        brackets: [{ fromCategory: 2, toCategory: 3 }],
        bracketFormat: 'both'
    }
};
```

---

Generiere nun einen vollständigen, funktionsfähigen HTML-Code basierend auf diesen Spezifikationen.
Die Daten sollen sein: [HIER DATEN EINFÜGEN]
Das Farbschema soll sein: [HIER FARBEN EINFÜGEN]
Optionen: [WERTE/PROZENT, TOTALS JA/NEIN, LEGENDE POSITION]
```

---

## Beispiel-Aufruf

```
Erstelle ein dynamisches, interaktives Stacked Bar Chart im Think-Cell-Stil mit folgenden Spezifikationen:

[... vollständiger Prompt von oben ...]

Die Daten sollen sein:
- Kategorien: Berlin, München, Hamburg, Frankfurt (jeweils 2024)
- Segmente:
  - Personal: 450, 520, 380, 410
  - Miete: 180, 280, 150, 220
  - Material: 120, 95, 140, 85
  - Sonstiges: 50, 45, 30, 65

Das Farbschema soll sein: Blau-Abstufung (#1E3A5F bis #C4E0F0)
Optionen: Absolute Werte anzeigen, Totals über Balken, Legende unten
```

---

## Technische Begründung

### Warum gestapelte Balken?

| Use Case | Vorteil |
|----------|---------|
| Kostenstruktur | Zeigt Zusammensetzung UND Gesamtkosten |
| Marktanteile | Visualisiert Teil-Ganzes-Beziehung |
| Budget-Vergleich | Ermöglicht Vergleich von Komponenten über Kategorien |
| Portfolio-Mix | Zeigt Verteilung innerhalb von Zeiträumen |

### Warum Farbabstufungen?

| Ansatz | Wann verwenden |
|--------|----------------|
| Monochrome Abstufung (dunkel→hell) | Professionell, ruhig, für Kostenstrukturen |
| Highlight + Grautöne | Wenn ein Segment besonders wichtig ist |
| Kategorische Farben | Wenn Segmente unabhängig/gleichwertig sind |

### Warum selektive Brackets?

| Situation | Empfehlung |
|-----------|------------|
| 2-3 Kategorien | showBrackets: true möglich |
| 4+ Kategorien | NUR selektive brackets[] |
| IST vs. PLAN | Bracket nur für diesen Übergang |
| Zu viele Brackets | Visuelles Chaos, Lesbarkeit leidet |

---

## Visualisierung

### Aufbau eines Stacked Bar Charts:

```
           Kostenstruktur nach Standort
                 in Tausend Euro

    800 ─┬──────────────────────────────────────
        │         800          940
        │    ┌─────────┐   ┌─────────┐
        │    │░░░░░░░░░│   │░░░░░░░░░│  ← Sonstiges (hell)
    600 ─┤    │░░░░░░░░░│   │░░░░░░░░░│
        │    │▒▒▒▒▒▒▒▒▒│   │▒▒▒▒▒▒▒▒▒│  ← Material
        │    │▒▒▒▒▒▒▒▒▒│   │▓▓▓▓▓▓▓▓▓│
    400 ─┤    │▓▓▓▓▓▓▓▓▓│   │▓▓▓▓▓▓▓▓▓│  ← Miete
        │    │▓▓▓▓▓▓▓▓▓│   │▓▓▓▓▓▓▓▓▓│
        │    │█████████│   │█████████│
    200 ─┤    │█████████│   │█████████│  ← Personal (dunkel)
        │    │█████████│   │█████████│
        │    │█████████│   │█████████│
      0 ─┼────┴─────────┴───┴─────────┴────
              Berlin        München
               2024          2024

    ■ Personal  ▓ Miete  ▒ Material  ░ Sonstiges
```

### Schraffur-Visualisierung (IST vs. PLAN):

```
   2021      2022      2023      2024      2025
   ░░░░      ░░░░      ░░░░      ████      ████
   ░░░░      ░░░░      ░░░░      ████      ████
   ░░░░      ░░░░      ░░░░      ████      ████
  (schraffiert - historisch)   (solid)   (solid)
                                          (Plan)
```

### Bracket-Positionierung:

```
                                    +140 (+18%)
                                 ┌──────────────┐
                                 │              ↓
   700       720       750       800              940
   ░░░░      ░░░░      ░░░░      ████            ████
   2021      2022      2023      2024            2025
                                                 (Plan)

   Nur EIN strategischer Bracket zwischen IST und PLAN!
```

---

## Häufige Fehler vermeiden

| Problem | Ursache | Lösung |
|---------|---------|--------|
| Falsche Anzahl Werte | values.length ≠ categories.length | Jeden Wert pro Kategorie prüfen |
| Zu viele Brackets | showBrackets: true bei vielen Kategorien | Nur selektive brackets[] verwenden |
| Labels überlappen | Segmente zu klein | minSegmentHeight erhöhen |
| Farben zu ähnlich | Schlechte Abstufung | Dunkel-nach-hell Reihenfolge |
| Schraffur nicht sichtbar | Pattern nicht definiert | Alle hatch-${i} Patterns erstellen |
| Legende überlappt | Zu viele Segmente | legendPosition: 'right' verwenden |

<!-- PROMPT-END -->

---

## Erweiterte Use-Cases

### 1. Portfolio-Entwicklung mit Schraffur für historische Daten

Zeigt die Zusammensetzung eines Portfolios über mehrere Jahre, wobei vergangene Jahre schraffiert dargestellt werden:

```javascript
const config = {
    title: 'Anlageportfolio',
    subtitle: 'in Mio EUR',
    categories: [
        { label: '2021', hatched: true, isHistorical: true },
        { label: '2022', hatched: true, isHistorical: true },
        { label: '2023', hatched: true, isHistorical: true },
        { label: '2024', hatched: false }
    ],
    segments: [
        { name: 'Immobilien', color: '#1E3A5F', values: [180, 195, 210, 230] },
        { name: 'Aktien', color: '#2E5A88', values: [150, 165, 175, 195] },
        { name: 'Anleihen', color: '#5B8DBE', values: [120, 130, 140, 150] },
        { name: 'Rohstoffe', color: '#8BBDE0', values: [80, 85, 95, 105] },
        { name: 'Liquidität', color: '#C4E0F0', values: [70, 75, 80, 90] }
    ],
    options: {
        showValues: true,
        showTotals: true,
        showLegend: true,
        legendPosition: 'bottom'
    }
};
```

**Besonderheiten:**
- `hatched: true` + `isHistorical: true` für vergangene Jahre
- Segmentwerte werden im Balken angezeigt
- Gesamtsummen über jedem Balken
- Keine Brackets - Fokus auf Zusammensetzung

### 2. Kostenstruktur nach Standort mit Prozent-Brackets

Vergleicht Kostenstrukturen verschiedener Standorte mit paarweisen Brackets für prozentuale Änderungen:

```javascript
const config = {
    title: 'Kostenstruktur nach Standort',
    subtitle: 'in Tausend EUR',
    categories: [
        { label: 'Berlin' },
        { label: 'München' },
        { label: 'Hamburg' },
        { label: 'Frankfurt' }
    ],
    segments: [
        { name: 'Personal', color: '#1E3A5F', values: [450, 520, 380, 410] },
        { name: 'Miete', color: '#2E5A88', values: [180, 280, 150, 220] },
        { name: 'IT', color: '#5B8DBE', values: [95, 85, 110, 90] },
        { name: 'Sonstiges', color: '#8BBDE0', values: [75, 55, 60, 80] }
    ],
    options: {
        showValues: true,
        showTotals: true,
        // Paarweise Brackets zwischen ALLEN aufeinanderfolgenden Kategorien
        brackets: [
            { fromCategory: 0, toCategory: 1 },
            { fromCategory: 1, toCategory: 2 },
            { fromCategory: 2, toCategory: 3 }
        ],
        bracketFormat: 'percent'  // Nur Prozent: +18%
    }
};
```

**Besonderheiten:**
- Paarweise Brackets zwischen allen aufeinanderfolgenden Balken
- `bracketFormat: 'percent'` für reine Prozentanzeige
- Keine Schraffur (alle Kategorien gleichwertig)

### 3. Umsatz nach Regionen mit kombinierten Absolut+Prozent-Brackets

Kombiniert absolute und prozentuale Änderungen in den Brackets:

```javascript
const config = {
    title: 'Umsatz nach Regionen',
    subtitle: 'in Mio EUR',
    categories: [
        { label: '2022', hatched: true, isHistorical: true },
        { label: '2023', hatched: true, isHistorical: true },
        { label: '2024', hatched: false },
        { label: '2025', sublabel: '(Plan)', hatched: false }
    ],
    segments: [
        { name: 'EMEA', color: '#1E3A5F', values: [280, 310, 345, 410] },
        { name: 'Americas', color: '#2E5A88', values: [220, 250, 285, 340] },
        { name: 'APAC', color: '#5B8DBE', values: [150, 180, 210, 260] },
        { name: 'RoW', color: '#8BBDE0', values: [50, 60, 70, 90] }
    ],
    options: {
        showValues: true,
        showTotals: true,
        brackets: [
            { fromCategory: 0, toCategory: 1 },
            { fromCategory: 1, toCategory: 2 },
            { fromCategory: 2, toCategory: 3 }
        ],
        // Kombiniertes Format: +100 (+14%)
        bracketFormat: 'both'
    }
};
```

**Besonderheiten:**
- `bracketFormat: 'both'` zeigt: `+100 (+14%)`
- Schraffur für historische Jahre (2022, 2023)
- Sublabel `(Plan)` für Forecast-Jahr
- Volle Transparenz über absolute UND relative Änderungen

### 4. Produktportfolio mit Absolut-Brackets

Zeigt nur absolute Differenzen zwischen Kategorien:

```javascript
const config = {
    title: 'Produktportfolio',
    subtitle: 'Stückzahlen in Tausend',
    categories: [
        { label: 'Q1' },
        { label: 'Q2' },
        { label: 'Q3' },
        { label: 'Q4' }
    ],
    segments: [
        { name: 'Premium', color: '#E63946', values: [45, 52, 58, 65] },
        { name: 'Standard', color: '#457B9D', values: [120, 135, 148, 160] },
        { name: 'Basic', color: '#A8DADC', values: [85, 92, 98, 105] }
    ],
    options: {
        showValues: true,
        showTotals: true,
        brackets: [
            { fromCategory: 0, toCategory: 1 },
            { fromCategory: 1, toCategory: 2 },
            { fromCategory: 2, toCategory: 3 }
        ],
        bracketFormat: 'absolute'  // Nur absolut: +30
    }
};
```

**Besonderheiten:**
- `bracketFormat: 'absolute'` zeigt nur absolute Werte: `+30`
- Drei-Farben-Schema mit Highlight für Premium
- Quartalsweise Vergleiche

### 5. Mitarbeiterstruktur mit gestricheltem PLAN-Balken

Zeigt einen gestrichelten Balken für Plan/Forecast-Werte:

```javascript
const config = {
    title: 'Mitarbeiterstruktur',
    subtitle: 'Anzahl FTE',
    categories: [
        { label: '2022', hatched: true, isHistorical: true },
        { label: '2023', hatched: true, isHistorical: true },
        { label: '2024', hatched: false },
        { label: '2025', sublabel: '(Plan)', isDashed: true }  // Gestrichelt!
    ],
    segments: [
        { name: 'Produktion', color: '#1E3A5F', values: [180, 195, 210, 225] },
        { name: 'Vertrieb', color: '#2E5A88', values: [85, 92, 98, 110] },
        { name: 'IT', color: '#5B8DBE', values: [45, 52, 58, 65] },
        { name: 'Verwaltung', color: '#8BBDE0', values: [40, 42, 44, 50] }
    ],
    options: {
        showValues: true,
        showTotals: true,
        brackets: [
            { fromCategory: 2, toCategory: 3 }  // Nur IST → PLAN
        ],
        bracketFormat: 'both'
    }
};
```

**Besonderheiten:**
- `isDashed: true` für gestrichelte Darstellung des Plan-Balkens
- Gestrichelt = `stroke-dasharray: "4,2"` + `fill-opacity: 0.25`
- Nur ein strategischer Bracket zwischen IST (2024) und PLAN (2025)

### 6. Implementierung gestrichelter Balken (isDashed)

```javascript
// Prüfen ob Kategorie gestrichelt sein soll
const isDashed = category.isDashed === true;

if (isDashed) {
    // Gestrichelter Balken: Rahmen gestrichelt, Füllung halbtransparent
    svgContent += `<rect
        class="stacked-bar dashed-bar"
        x="${barX}"
        y="${segmentY}"
        width="${barWidth}"
        height="${segmentHeight}"
        fill="${segment.color}"
        fill-opacity="0.25"
        stroke="${segment.color}"
        stroke-width="2"
        stroke-dasharray="4,2"
        ${isTopSegment ? 'rx="2"' : ''}
    />`;
} else {
    // Normaler oder schraffierter Balken
    svgContent += `<rect
        class="stacked-bar"
        x="${barX}"
        y="${segmentY}"
        width="${barWidth}"
        height="${segmentHeight}"
        fill="${category.hatched ? `url(#hatch-${segIndex})` : segment.color}"
        ${isTopSegment ? 'rx="2"' : ''}
    />`;
}
```

**CSS für gestrichelte Balken:**
```css
.dashed-bar {
    /* Basis-Styles werden inline über Attribute gesetzt */
}

.dashed-bar:hover {
    fill-opacity: 0.35;  /* Leicht stärker beim Hover */
}
```

### 7. Automatische Legende mit Segment-Namen

```javascript
function renderLegend(config, svgWidth, yPosition) {
    let legendHTML = '';
    const itemWidth = 100;
    const totalWidth = config.segments.length * itemWidth;
    let startX = (svgWidth - totalWidth) / 2;  // Zentriert

    config.segments.forEach((segment, index) => {
        legendHTML += `
            <g class="legend-item" data-segment="${index}">
                <rect x="${startX}" y="${yPosition}"
                      width="14" height="14"
                      fill="${segment.color}" rx="2"/>
                <text x="${startX + 20}" y="${yPosition + 11}"
                      class="legend-text">${segment.name}</text>
            </g>
        `;
        startX += itemWidth;
    });

    return legendHTML;
}
```

### 8. Best Practices für erweiterte Stacked Bar Charts

| Situation | Empfehlung |
|-----------|------------|
| Historische vs. aktuelle Daten | `hatched: true` für Vergangenheit |
| Plan/Forecast | `isDashed: true` ODER `sublabel: '(Plan)'` |
| Viele Kategorien (5+) | Nur 1-2 strategische Brackets |
| Änderungen wichtig | `bracketFormat: 'both'` für Vollständigkeit |
| Nur Trend wichtig | `bracketFormat: 'percent'` reicht |
| Segmentwerte wichtig | `showValues: true` + ausreichende Segmenthöhe |
| Gesamtentwicklung | `showTotals: true` für Summen über Balken |

### 9. Kategorie-Properties Übersicht

| Property | Typ | Beschreibung |
|----------|-----|--------------|
| `label` | string | Hauptbeschriftung (z.B. "2024", "Berlin") |
| `sublabel` | string | Optionale Unterbeschriftung (z.B. "(Plan)") |
| `hatched` | boolean | Schraffierte Darstellung für historische Daten |
| `isHistorical` | boolean | Markiert als historisch (für Styling) |
| `isDashed` | boolean | Gestrichelte Darstellung für Plan/Forecast |

### 10. Bracket-Formate im Vergleich

| Format | Beispiel | Wann verwenden |
|--------|----------|----------------|
| `'percent'` | +18% | Wenn relative Änderung wichtiger |
| `'absolute'` | +150 | Wenn absolute Zahlen wichtiger |
| `'both'` | +150 (+18%) | Maximale Information, Consulting-Standard |

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
