# Think-Cell Style Bar Chart Generator Prompt

## Anwendung
Verwende diesen Prompt, um pixel-perfekte, dynamische Bar-Charts (Säulendiagramme) im Think-Cell-Stil zu generieren. Bar-Charts eignen sich ideal für den Vergleich von Werten über Kategorien oder Zeitperioden hinweg - typische Anwendungsfälle sind Umsatzvergleiche, Performance-Metriken und Periodenvergleiche in Finanzpräsentationen, Consulting-Decks und Management-Reporting.

### Chart-Typ: Bar-Chart (Säulendiagramm)
- **Struktur**: Vertikale Balken nebeneinander für verschiedene Perioden/Kategorien
- **Anwendung**: Vergleich einzelner Werte über Zeit oder Kategorien
- **Abgrenzung zu Stacked Bar**: Bei Bar-Charts steht jeder Balken für sich, es gibt keine gestapelten Segmente innerhalb eines Balkens

---

<!-- PROMPT-START -->

## Der Prompt

Erstelle ein dynamisches, interaktives Bar-Chart (Säulendiagramm) im Think-Cell-Stil mit folgenden Spezifikationen:

### CHART-TYP: BAR-CHART (Vertikales Säulendiagramm)
Ein Bar-Chart zeigt einzelne Werte als vertikale Balken, die nebeneinander angeordnet sind. Jeder Balken repräsentiert einen einzelnen Datenwert für eine bestimmte Kategorie oder Periode. Dies unterscheidet sich vom Stacked Bar Chart, bei dem mehrere Segmente innerhalb eines Balkens gestapelt werden.

## TECHNOLOGIE
- **Reines SVG + Vanilla JavaScript** (kein Framework, keine externe Library)
- Responsive über SVG viewBox
- Alle Elemente werden programmatisch aus einem config-Objekt generiert

## DATENSTRUKTUR (config-Objekt)
Das Chart wird vollständig aus diesem JavaScript-Objekt generiert:

```javascript
// ============================================
// KONFIGURATION: Bar-Chart Datenstruktur
// ============================================

const config = {
    // PERIODEN: Beliebige Anzahl, jede mit eigenem Label, Farbe UND TYP
    // - label: Anzeigename (z.B. "2022", "Q1 2024")
    // - color: HEX-Farbcode für den Balken
    // - type: Datentyp (IST, PLAN, BUD, FC) - wichtig für Legende und Styling
    periods: [
        { label: '2022', color: '#CCCCCC', type: 'IST' },
        { label: '2023', color: '#999999', type: 'IST' },
        { label: '2024', color: '#0066B1', type: 'PLAN' },
        { label: '2025', color: '#0066B1', type: 'BUD' }
    ],

    // KATEGORIEN: Beliebige Anzahl, jede mit Name, Untertitel und Werten pro Periode
    // - name: Kategoriename (z.B. "Revenue", "EBIT")
    // - subtitle: Einheit oder Beschreibung (z.B. "in Mio. EUR")
    // - values: Array mit einem Wert pro Periode (gleiche Länge wie periods!)
    // - useScaleBreak: Optional - aktiviert Skalenbruch bei extremen Werten
    categories: [
        {
            name: 'Revenue',
            subtitle: 'in million euros',
            values: [1200, 1350, 1480, 1620],  // Ein Wert pro Periode
            useScaleBreak: false
        },
        {
            name: 'Cloud Revenue',
            subtitle: 'in million euros',
            values: [50, 180, 2400],  // Extremer Unterschied → Skalenbruch sinnvoll
            useScaleBreak: true
        }
        // ... beliebig erweiterbar
    ],

    // OPTIONAL: Skalenbruch-Schwellenwert (Standard: 3)
    // Wenn max/min > threshold, dann wird Skalenbruch empfohlen
    scaleBreakThreshold: 3
};

## KRITISCH: ALLE DATENPUNKTE EINZELN DARSTELLEN!

**JEDER Datenpunkt in den Quelldaten wird ein EIGENER Balken!**

❌ FALSCH: Nur 3 Balken (IST, PLAN, BUD) als Aggregation
✅ RICHTIG: 7+ Balken für jeden einzelnen Datenpunkt (2020, 2021, 2022, 2023, 2024, 2025, 2026 PLAN, 2026 BUD)

**KEINE Aggregation! Keine erfundenen Kategorien!**

## KRITISCH: IST/PLAN/BUD KLASSIFIZIERUNG

**Die korrekte Interpretation der Datentypen ist ESSENZIELL!**

| Bezeichnung in Daten | Typ | Beschreibung |
|---------------------|-----|--------------|
| IST, Ist, Actual, Act | `IST` | Realisierte/abgeschlossene Werte |
| PLAN, Plan, Forecast, FC | `PLAN` | Geplante/prognostizierte Werte |
| BUD, Budget | `BUD` | Budgetwerte |
| VJ, Vorjahr, PY | `VJ` | Letztes Jahr |

**KRITISCH: Der Typ wird IMMER aus den Quelldaten extrahiert - NIEMALS geraten!**

**Daraus generierte periods:**
```javascript
// Typ kommt aus der Spalte "Scenario" - NICHT aus dem Jahr!
periods: [
    { label: '2020', color: '#CCCCCC', type: 'IST' },     // aus Spalte "Scenario"
    { label: '2025', color: '#666666', type: 'IST' },     // aus Spalte "Scenario"
    { label: '2026 PLAN', color: '#0066B1', type: 'PLAN' },
    { label: '2026 BUD', color: '#0066B1', type: 'BUD' }
]
```

**Wenn KEINE Typ-Spalte vorhanden:**
- Alle Perioden bekommen `type: 'default'`
- Keine Legende anzeigen (nur X-Achsen-Labels)

### Visuelle Unterscheidung:

| Typ | Farbe | Stil |
|-----|-------|------|
| IST | Grautöne (#E0E0E0 → #333333) | Solid, automatische Abstufung |
| PLAN | Akzentfarbe (#0066B1) | **Gestrichelter Rand** + halbtransparente Füllung |
| BUD | Akzentfarbe (#27AE60) | **Gestrichelter Rand** + halbtransparente Füllung |

**Gestrichelte Balken für Prognosen:**
```javascript
// PLAN/BUD/FORECAST-Balken mit visueller Unterscheidung
if (period.type === 'PLAN' || period.type === 'BUD' || period.type === 'FC') {
    svgContent += `<rect
        fill="${period.color}"
        fill-opacity="0.3"
        stroke="${period.color}"
        stroke-width="2"
        stroke-dasharray="4,2"
        ...
    />`;
}
```

**FEHLER VERMEIDEN:**
- ❌ Nach Jahreszahlen raten oder Annahmen machen
- ❌ Feste Regeln wie "2024+ = PLAN" anwenden
- ❌ Type-Feld weglassen wenn Typ-Spalte in Daten existiert
- ✅ Typ-Spalte in Quelldaten suchen ("Scenario", "Typ", "Art", etc.)
- ✅ Werte EXAKT übernehmen wie sie in den Daten stehen
- ✅ Bei fehlender Typ-Spalte: `type: 'default'` setzen

## CHART-ELEMENTE

### 1. Balken
- Dynamische Breite basierend auf Anzahl der Perioden
- Farbe aus config.periods[].color
- Abgerundete Ecken (rx="2")
- Hover-Effekt: opacity 0.8, cursor pointer
- data-Attribute für Tooltip: data-category, data-period, data-value

```javascript
// ============================================
// ELEMENT: Balken rendern
// ============================================

function renderBar(barX, barY, barWidth, barHeight, period, category, value) {
    // Basis-Attribute für alle Balken
    let rectAttrs = `
        x="${barX}"
        y="${barY}"
        width="${barWidth}"
        height="${barHeight}"
        rx="2"
        class="bar"
        data-category="${category.name}"
        data-period="${period.label}"
        data-value="${value}"
    `;

    // Unterschiedliche Stile je nach Typ
    if (period.type === 'PLAN' || period.type === 'BUD' || period.type === 'FC') {
        // Prognose-Balken: halbtransparent mit gestricheltem Rand
        return `<rect ${rectAttrs}
            fill="${period.color}"
            fill-opacity="0.3"
            stroke="${period.color}"
            stroke-width="2"
            stroke-dasharray="4,2"
        />`;
    } else {
        // IST-Balken: solid gefüllt
        return `<rect ${rectAttrs} fill="${period.color}"/>`;
    }
}
```

### 2. Wert-Labels

**Position**: Direkt über jedem Balken (6px Abstand)
**Schrift**: 13px, bold, #1a1a1a
**Textanker**: middle (horizontal zentriert)

**KRITISCH: Automatische Einheiten-Skalierung für bessere Lesbarkeit!**

| Wertebereich | Anzeige | Beispiel |
|--------------|---------|----------|
| < 10.000 | Originalwert | 1.200 → "1.200" |
| 10.000 - 999.999 | in Tausend (T€) | 1.200.000 → "1.200 T€" |
| ≥ 1.000.000 | in Millionen (Mio €) | 1.500.000 → "1,5 Mio €" |

```javascript
// ============================================
// HILFSFUNKTION: Wert-Formatierung mit Einheit
// ============================================

function formatValueWithUnit(value) {
    const absValue = Math.abs(value);

    if (absValue >= 1000000) {
        // Millionen: 1.500.000 → "1,5 Mio €"
        const mio = value / 1000000;
        return mio.toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' Mio €';
    } else if (absValue >= 10000) {
        // Tausend: 45.000 → "45 T€"
        const tsd = value / 1000;
        return tsd.toLocaleString('de-DE', { maximumFractionDigits: 0 }) + ' T€';
    } else {
        // Unter 10.000: Originalwert mit Tausendertrennzeichen
        return value.toLocaleString('de-DE');
    }
}
```

**WICHTIG:** Der Untertitel (subtitle) muss die verwendete Einheit widerspiegeln!
- Wenn Werte in T€ angezeigt werden → subtitle: "in TEUR" oder "in T€"
- Wenn Werte in Mio € angezeigt werden → subtitle: "in Mio. EUR"

### 3. Bracket-Annotations (KRITISCH)

Brackets zeigen prozentuale Änderungen zwischen Balken. **Die korrekte Positionierung ist entscheidend!**

**Struktur von oben nach unten:**
1. **Bubble** mit Prozent-Änderung (automatisch berechnet)
2. **Horizontale Linien** links und rechts der Bubble
3. **Linke vertikale Linie** (von Label nach oben)
4. **Rechte vertikale Linie + Pfeilspitze** (von oben nach Label)

**KRITISCH: Labels direkt über Balken, Brackets auf einheitlicher Höhe!**

```javascript
// ============================================
// ELEMENT: Bracket-Annotations mit variablen Pfeillängen
// ============================================

function renderBracketsWithVariableArrows(barPositions, values) {
    const labelGap = 8;           // Abstand Balken → Label
    const labelHeight = 15;       // Höhe des Label-Texts
    const bracketGap = 12;        // Mindestabstand Label → Bracket
    const bubbleHeight = 18;      // Höhe der Bubble

    let svgContent = '';

    // SCHRITT 1: Label-Positionen berechnen (direkt über jedem Balken)
    const labelPositions = barPositions.map((bar, i) => ({
        x: bar.x + bar.width / 2,
        y: bar.y - labelGap,                    // Label-Baseline
        topY: bar.y - labelGap - labelHeight,   // Label-Oberkante
        value: values[i]
    }));

    // SCHRITT 2: Wert-Labels rendern (individuelle Höhen)
    labelPositions.forEach(label => {
        svgContent += `<text class="value-label"
            x="${label.x}"
            y="${label.y}"
            text-anchor="middle"
            font-size="13px"
            font-weight="bold"
            fill="#1a1a1a">${formatValueWithUnit(label.value)}</text>`;
    });

    // SCHRITT 3: Bracket-Ebene OBERHALB des höchsten Labels
    // → Alle Bubbles auf gleicher Höhe!
    const highestLabelTop = Math.min(...labelPositions.map(l => l.topY));
    const bubbleY = highestLabelTop - bracketGap - bubbleHeight;
    const bubbleCenterY = bubbleY + bubbleHeight / 2;

    // SCHRITT 4: Brackets zwischen aufeinanderfolgenden Balken
    for (let i = 0; i < barPositions.length - 1; i++) {
        const label1 = labelPositions[i];
        const label2 = labelPositions[i + 1];
        const x1 = label1.x;
        const x2 = label2.x;
        const midX = (x1 + x2) / 2;

        // Prozentuale Änderung berechnen
        const change = ((values[i+1] - values[i]) / values[i] * 100).toFixed(0);
        const changeText = change >= 0 ? `+${change}%` : `${change}%`;
        const bubbleWidth = calculateBubbleWidth(changeText);

        // Linke vertikale Linie (VARIABLE LÄNGE je nach Balkenhöhe)
        // Hoher Balken = kurze Linie, niedriger Balken = lange Linie
        svgContent += `<line class="bracket-line"
            x1="${x1}" y1="${label1.topY}"
            x2="${x1}" y2="${bubbleCenterY}"
            stroke="#333" stroke-width="1.5"/>`;

        // Horizontale Linie links
        svgContent += `<line class="bracket-line"
            x1="${x1}" y1="${bubbleCenterY}"
            x2="${midX - bubbleWidth/2}" y2="${bubbleCenterY}"
            stroke="#333" stroke-width="1.5"/>`;

        // Bubble (Pill-Form)
        svgContent += `<rect class="bracket-bubble"
            x="${midX - bubbleWidth/2}" y="${bubbleY}"
            width="${bubbleWidth}" height="${bubbleHeight}"
            rx="9" fill="white" stroke="#333" stroke-width="1.5"/>`;

        // Bubble-Text
        svgContent += `<text class="change-label"
            x="${midX}" y="${bubbleCenterY}"
            text-anchor="middle" dominant-baseline="middle"
            font-size="10px" font-weight="bold" fill="#1a1a1a">${changeText}</text>`;

        // Horizontale Linie rechts
        svgContent += `<line class="bracket-line"
            x1="${midX + bubbleWidth/2}" y1="${bubbleCenterY}"
            x2="${x2}" y2="${bubbleCenterY}"
            stroke="#333" stroke-width="1.5"/>`;

        // Rechte vertikale Linie (VARIABLE LÄNGE)
        svgContent += `<line class="bracket-line"
            x1="${x2}" y1="${bubbleCenterY}"
            x2="${x2}" y2="${label2.topY}"
            stroke="#333" stroke-width="1.5"/>`;

        // Pfeilspitze
        svgContent += `<polygon class="arrow-head"
            points="${x2},${label2.topY} ${x2-4},${label2.topY-6} ${x2+4},${label2.topY-6}"
            fill="#333"/>`;
    }

    return svgContent;
}

// Dynamische Bubble-Breite basierend auf Textlänge
function calculateBubbleWidth(text, fontSize = 10) {
    const avgCharWidth = fontSize * 0.6;
    const horizontalPadding = 16;
    const minWidth = 36;
    return Math.max(minWidth, text.length * avgCharWidth + horizontalPadding);
}
```

**Visualisierung der variablen Pfeillängen:**
```
           ┌──────┐    ┌──────┐    ┌──────┐
           │ +13% │    │ +10% │    │ +9%  │     ← Bubbles auf EINHEITLICHER Höhe
           └──┬───┘    └──┬───┘    └──┬───┘
      ┌───────┘ │         │ │         │ └───────┐
      │ (kurz)  │         │ │ (lang)  │         │  ← VARIABLE Pfeillängen
      ▼         │         ▼ │         ▼         ▼
    1.200     1.350     1.480      1.620          ← Labels DIREKT über Balken
    ┌───┐     ┌───┐     ┌───┐      ┌───┐
    │   │     │   │     │   │      │   │         ← Unterschiedliche Balkenhöhen
    └───┘     └───┘     └───┘      └───┘
```

### 4. Skalenbruch (Scale Break)

Für extreme Werteunterschiede (z.B. 50 vs. 2400):

```javascript
// ============================================
// ELEMENT: Skalenbruch für extreme Werte
// ============================================

const breakGapHeight = 20;  // Höhe der Lücke für Zickzack
const breakCenterY = margin.top + chartHeight * 0.5;

// Prüfen ob Skalenbruch nötig
const maxValue = Math.max(...category.values);
const minValue = Math.min(...category.values.filter(v => v > 0));
const ratio = maxValue / minValue;
const needsScaleBreak = ratio > scaleBreakThreshold && category.useScaleBreak !== false;

// Zickzack-Pfad zeichnen
function drawScaleBreak(x, y, width, amplitude = 4) {
    const segments = 3;
    const segmentWidth = width / segments;
    let path = `M ${x} ${y}`;

    for (let i = 0; i < segments; i++) {
        const direction = i % 2 === 0 ? -1 : 1;
        path += ` L ${x + segmentWidth * (i + 0.5)} ${y + amplitude * direction}`;
        path += ` L ${x + segmentWidth * (i + 1)} ${y}`;
    }
    return path;
}
```

### 5. Kategorie-Überschriften (bei mehreren Kategorien!)

```javascript
// ============================================
// ELEMENT: Kategorie-Überschriften
// ============================================

// Nur bei mehreren Kategorien anzeigen!
if (config.categories.length > 1) {
    config.categories.forEach((category, catIndex) => {
        const groupCenterX = margin.left + groupWidth * catIndex + groupWidth / 2;
        const categoryTitleY = margin.top - 50;  // Oberhalb der Brackets

        // Kategoriename
        svgContent += `<text class="category-title"
            x="${groupCenterX}" y="${categoryTitleY}"
            text-anchor="middle" font-weight="bold"
            font-size="14px" fill="#1a1a1a">${category.name}</text>`;

        // Optional: Untertitel
        if (category.subtitle) {
            svgContent += `<text class="category-subtitle"
                x="${groupCenterX}" y="${categoryTitleY + 14}"
                text-anchor="middle" font-size="11px"
                fill="#666">${category.subtitle}</text>`;
        }
    });
}
```

### 6. Legende (KRITISCH: Keine Redundanz!)

**Die Legende zeigt den DATENTYP an (IST, PLAN, BUD), NICHT die Perioden-Labels!**

```javascript
// ============================================
// ELEMENT: Legende nach Typ gruppiert
// ============================================

// Perioden nach Typ gruppieren (nicht nach Label!)
const typeGroups = {};
config.periods.forEach(p => {
    if (!typeGroups[p.type]) {
        typeGroups[p.type] = { color: p.color, label: p.type };
    }
});
// Ergibt z.B.: { IST: {...}, PLAN: {...} } → nur 2 Legenden-Einträge!

// KEINE Legende wenn:
// - Alle Perioden denselben Typ haben
// - Kein `type` definiert ist
const showLegend = Object.keys(typeGroups).length > 1;
```

### 7. Tooltip

```javascript
// ============================================
// ELEMENT: Tooltip bei Hover
// ============================================

function setupTooltip() {
    const tooltip = document.getElementById('tooltip');

    document.querySelectorAll('.bar').forEach(bar => {
        bar.addEventListener('mouseenter', (e) => {
            const category = e.target.dataset.category;
            const period = e.target.dataset.period;
            const value = e.target.dataset.value;

            tooltip.innerHTML = `
                <strong>${category}</strong><br>
                ${period}: ${formatValueWithUnit(parseFloat(value))}
            `;
            tooltip.classList.add('visible');
        });

        bar.addEventListener('mousemove', (e) => {
            tooltip.style.left = `${e.clientX + 15}px`;
            tooltip.style.top = `${e.clientY - 10}px`;
        });

        bar.addEventListener('mouseleave', () => {
            tooltip.classList.remove('visible');
        });
    });
}
```

## LAYOUT-BERECHNUNG

```javascript
// ============================================
// LAYOUT: Dimensionen und Positionen
// ============================================

// Dynamische Dimensionen (16:9 für PowerPoint-Kompatibilität)
const width = 1320;
const height = 500;
const margin = { top: 100, right: 40, bottom: 60, left: 40 };

const chartWidth = width - margin.left - margin.right;
const chartHeight = height - margin.top - margin.bottom;

// Gruppen-Layout (bei mehreren Kategorien)
const numCategories = config.categories.length;
const numPeriods = config.periods.length;
const groupWidth = chartWidth / numCategories;

// Balkenbreite dynamisch berechnen
const barWidth = Math.min(40, (groupWidth - 40) / numPeriods - 5);
const barGap = Math.min(8, barWidth * 0.2);

// Balken zentrieren innerhalb der Gruppe
const totalBarsWidth = numPeriods * barWidth + (numPeriods - 1) * barGap;
const barsStartX = groupCenterX - totalBarsWidth / 2;

// Y-Skala
function yScale(value) {
    const maxValue = Math.max(...allValues) * 1.15;  // 15% Headroom
    return margin.top + chartHeight - (value / maxValue) * chartHeight;
}
```

## CSS-KLASSEN

```css
/* ============================================
   STYLES: Bar Chart Elemente
   ============================================ */

/* Balken */
.bar {
    cursor: pointer;
    transition: opacity 0.2s ease;
}
.bar:hover {
    opacity: 0.8;
}

/* Bracket-Elemente */
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
.arrow-head {
    fill: #333;
}

/* Labels */
.value-label {
    font-size: 13px;
    font-weight: bold;
    fill: #1a1a1a;
    text-anchor: middle;
}
.change-label {
    font-size: 10px;
    font-weight: bold;
    fill: #1a1a1a;
    text-anchor: middle;
    dominant-baseline: middle;
}

/* Skalenbruch */
.scale-break-line {
    stroke: #666;
    stroke-width: 1.5;
    fill: none;
}

/* Tooltip */
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
.tooltip.visible {
    opacity: 1;
}
```

## DYNAMIK-PRINZIPIEN

1. **Anzahl Perioden**: Beliebig (2, 3, 4, 5, ...) - Balkenbreite passt sich an
2. **Anzahl Kategorien**: Beliebig - Gruppenbreite passt sich an
3. **Farben**: Pro Periode individuell oder automatische Graustufen für IST
4. **Brackets**: SELEKTIV - nicht zwischen jedem Balken, nur strategische Verbindungen
5. **Prozent-Berechnung**: Automatisch aus den Werten
6. **Skalenbruch**: Automatisch bei extremen Werteunterschieden
7. **Forecast-Stil**: Automatisch gestrichelte Ränder für PLAN/BUD/FC

## ANPASSUNG FÜR SPEZIFISCHE USE-CASES

### Selektive Brackets (bei vielen Perioden):
```javascript
// Bei > 4 Perioden: Nicht zwischen jedem Balkenpaar!
const config = {
    periods: [...],
    categories: [...],
    // Option 1: Explizite Brackets definieren
    brackets: [
        { fromIndex: 0, toIndex: 5 },   // Erster → Letzter IST
        { fromIndex: 5, toIndex: 6 }    // Letzter IST → PLAN
    ],
    // Option 2: Alle Brackets erzwingen (NICHT empfohlen bei > 4)
    showAllBrackets: false
};
```

### Trendlinie aktivieren:
```javascript
const config = {
    periods: [...],
    categories: [
        {
            name: 'Revenue',
            values: [245, 268, 312, 358],
            trendColor: '#E20074'  // Farbe der Trendlinie
        }
    ],
    showTrendline: true  // Bezier-Kurve durch Balken-Oberkanten
};
```

---

Generiere nun einen vollständigen, funktionsfähigen HTML-Code basierend auf diesen Spezifikationen.
Die Daten sollen sein: [HIER DATEN EINFÜGEN]
Das Farbschema soll sein: [HIER FARBEN EINFÜGEN]
Skalenbruch verwenden: [JA/NEIN - für welche Kategorien?]
```

---

## Erweiterte Use-Cases

### 1. YoY-Dashboard mit paarweisen Brackets

Für Dashboards mit mehreren Mini-Charts nebeneinander, bei denen zwischen jedem Balkenpaar ein Bracket angezeigt wird:

```javascript
// ============================================
// USE-CASE: YoY Growth Dashboard (5 KPIs)
// ============================================

const dashboardConfig = {
    // Layout: Grid mit 5 Spalten
    layout: 'grid',
    columns: 5,

    // Gemeinsame Perioden für alle Charts
    periods: [
        { label: 'FY22', color: '#B0B0B0', type: 'IST' },   // Grau = vergangen
        { label: 'FY23', color: '#006B6B', type: 'IST' },   // Dunkel-Teal
        { label: 'FY24', color: '#00A5A5', type: 'IST' }    // Hell-Teal = aktuell
    ],

    // Mehrere Mini-Charts
    charts: [
        { title: 'Revenue', subtitle: 'in billion €', values: [72, 78, 85] },
        { title: 'Digital Ind.', subtitle: 'in billion €', values: [19, 21, 24] },
        { title: 'Smart Infra', subtitle: 'in billion €', values: [17, 19, 22] },
        { title: 'Mobility', subtitle: 'in billion €', values: [9, 10, 12] },
        { title: 'Free CF', subtitle: 'in billion €', values: [8.2, 9.5, 11.2] }
    ],

    // KRITISCH: Paarweise Brackets zwischen aufeinanderfolgenden Balken
    bracketMode: 'pairwise',  // Bracket zwischen FY22→FY23 UND FY23→FY24

    // Alternative: Nur strategische Brackets
    // brackets: [{ from: 0, to: 2 }]  // Nur FY22→FY24
};
```

**Visuelles Ergebnis:**
```
   Revenue       Digital Ind.    Smart Infra     Mobility       Free CF
   in billion €  in billion €    in billion €    in billion €   in billion €

   [+8%]→[+9%]   [+11%]→[+14%]  [+12%]→[+16%]  [+11%]→[+20%]  [+16%]→[+18%]
      ↓     ↓        ↓     ↓        ↓     ↓        ↓     ↓        ↓     ↓
     72  78  85     19  21  24     17  19  22      9  10  12    8.2 9.5 11.2
     ██  ██  ██     ██  ██  ██     ██  ██  ██     ██  ██  ██     ██  ██  ██
    FY22 FY23 FY24
```

### 2. Gestrichelte Balken für Forecasts/Projektionen

PLAN, BUD und Forecast-Werte werden mit gestricheltem Rand + halbtransparenter Füllung dargestellt:

```javascript
// ============================================
// USE-CASE: Quartale mit Forecast-Projektion
// ============================================

const forecastConfig = {
    periods: [
        { label: 'Q1', color: '#A8C5E2', type: 'IST' },
        { label: 'Q2', color: '#7BA3D0', type: 'IST' },
        { label: 'Q3', color: '#5580BD', type: 'IST' },
        { label: 'Q4', color: '#3366AA', type: 'IST' },
        { label: 'Q1 (Proj.)', color: '#8888DD', type: 'FC', dashed: true }  // ← KRITISCH!
    ],
    categories: [
        { name: 'Gross Margin', subtitle: 'in %', values: [42.3, 43.8, 44.2, 45.1, 46.5] }
    ],
    // Brackets zwischen letztem IST und Forecast
    brackets: [
        { fromIndex: 0, toIndex: 3, label: '+6.6%' },   // Q1→Q4 (IST-Entwicklung)
        { fromIndex: 3, toIndex: 4, label: '+3.1%' }    // Q4→Q1 Proj. (IST→FC)
    ]
};

// Rendering für gestrichelte Balken:
function renderDashedBar(barX, barY, barWidth, barHeight, period) {
    if (period.dashed || period.type === 'FC' || period.type === 'PLAN' || period.type === 'BUD') {
        return `
            <rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}"
                  fill="${period.color}" fill-opacity="0.2"
                  stroke="${period.color}" stroke-width="2" stroke-dasharray="4,2"
                  rx="2" class="bar"/>
        `;
    }
    return `<rect x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}"
                  fill="${period.color}" rx="2" class="bar"/>`;
}
```

**Visuelles Ergebnis:**
```
                                    ┌╌╌╌╌╌┐
            ┌─────┐                 ╎     ╎  ← Gestrichelt = Forecast
   ┌─────┐  │█████│  ┌─────┐       ╎  46.5╎
   │█████│  │█████│  │█████│       ╎█████╎
   │█████│  │█████│  │█████│  ┌────┴─────┴
   │42.3 │  │43.8 │  │44.2 │  │45.1 │
   └─────┘  └─────┘  └─────┘  └─────┘
     Q1       Q2       Q3       Q4     Q1 (Proj.)
```

### 3. Farbkonventionen für Zeitreihen

Standardisierte Farbcodierung für konsistente Dashboards:

```javascript
// ============================================
// FARBKONVENTIONEN: Zeitliche Einordnung
// ============================================

const COLOR_CONVENTIONS = {
    // Vergangene Perioden: Grautöne (heller → dunkler)
    historical: {
        oldest: '#E0E0E0',   // Hellgrau (z.B. FY20)
        middle: '#B0B0B0',   // Mittelgrau (z.B. FY21)
        recent: '#808080'    // Dunkelgrau (z.B. FY22)
    },

    // Aktuelle Periode: Kräftige Akzentfarbe
    current: '#006B6B',      // Dunkel-Teal (oder Firmenfarbe)

    // Forecast/Plan: Hellere Version der Akzentfarbe + gestrichelt
    forecast: {
        color: '#00A5A5',    // Hell-Teal
        dashed: true,
        fillOpacity: 0.3
    },

    // Budget: Alternative Akzentfarbe + gestrichelt
    budget: {
        color: '#27AE60',    // Grün
        dashed: true,
        fillOpacity: 0.3
    }
};

// Automatische Farbzuweisung basierend auf Periode
function getBarColor(period, allPeriods) {
    const index = allPeriods.indexOf(period);
    const totalIST = allPeriods.filter(p => p.type === 'IST').length;

    if (period.type === 'FC' || period.type === 'PLAN') {
        return { color: COLOR_CONVENTIONS.forecast.color, dashed: true };
    }
    if (period.type === 'BUD') {
        return { color: COLOR_CONVENTIONS.budget.color, dashed: true };
    }

    // IST-Perioden: Graustufen von hell nach dunkel
    const istIndex = allPeriods.filter(p => p.type === 'IST').indexOf(period);
    const grayValue = Math.round(224 - (istIndex / (totalIST - 1)) * 144);
    return { color: `rgb(${grayValue},${grayValue},${grayValue})`, dashed: false };
}
```

### 4. Konsekutive Brackets (zwischen allen Nachbarbalken)

Wenn zwischen JEDEM Balkenpaar eine Änderung angezeigt werden soll:

```javascript
// ============================================
// USE-CASE: Regionale Vergleiche mit konsekutiven Brackets
// ============================================

const regionalConfig = {
    periods: [
        { label: 'DACH', value: 45 },
        { label: 'UK', value: 52 },
        { label: 'France', value: 48 },
        { label: 'Nordics', value: 38 },
        { label: 'Benelux', value: 42 },
        { label: 'Spain', value: 35 },
        { label: 'Italy', value: 31 }
    ],

    // Konsekutive Brackets: Zwischen JEDEM Paar
    bracketMode: 'consecutive',

    // ACHTUNG: Bei > 5 Balken können Brackets sehr eng werden!
    // Alternative: Nur strategische Brackets
    // bracketMode: 'selective',
    // brackets: [{ from: 0, to: 6, label: '-31%' }]  // Nur Gesamt
};

// Rendering: Brackets zwischen allen Nachbarbalken
function renderConsecutiveBrackets(barData, values) {
    let svgContent = '';

    for (let i = 0; i < barData.length - 1; i++) {
        const change = ((values[i+1] - values[i]) / values[i] * 100).toFixed(0);
        const changeText = change >= 0 ? `+${change}%` : `${change}%`;

        // Bracket zwischen barData[i] und barData[i+1]
        svgContent += renderSingleBracket(
            barData[i], barData[i+1], changeText
        );
    }

    return svgContent;
}
```

**Visuelles Ergebnis:**
```
  [+16%] [-8%] [-21%] [+11%] [-17%] [-11%]
     ↓      ↓     ↓      ↓      ↓      ↓
    45    52    48    38    42    35    31
    ██    ██    ██    ██    ██    ██    ██
   DACH   UK   France Nordics Benelux Spain Italy
```

### 5. Budget vs. Actual vs. Forecast (3er-Gruppen)

Drei Werte pro Kategorie für vollständigen Vergleich:

```javascript
// ============================================
// USE-CASE: Budget/Actual/Forecast pro Quartal
// ============================================

const bafConfig = {
    layout: 'grid',
    columns: 3,

    // Jedes Quartal als separate Chart-Gruppe
    charts: [
        {
            title: 'Q1 2024',
            periods: [
                { label: 'Budget', color: '#AAAAAA', type: 'BUD' },
                { label: 'Actual', color: '#2E5A88', type: 'IST' },
                { label: 'Forecast', color: '#5B8DBE', type: 'FC', dashed: true }
            ],
            values: [3000, 2850, 3100]
        },
        {
            title: 'Q2 2024',
            periods: [/* ... */],
            values: [3200, 3350, 3400]
        },
        {
            title: 'Q3 2024',
            periods: [/* ... */],
            values: [3400, 3280, 3500]
        }
    ],

    // Bracket nur zwischen Actual und Forecast
    brackets: [{ fromIndex: 1, toIndex: 2 }]
};
```

### 6. Gemeinsame Legende für Dashboard

Bei Multi-Chart-Dashboards: Eine Legende für alle Charts:

```javascript
// ============================================
// ELEMENT: Gemeinsame Dashboard-Legende
// ============================================

function renderDashboardLegend(periods, containerId) {
    const container = document.getElementById(containerId);
    const legend = document.createElement('div');
    legend.className = 'dashboard-legend';
    legend.style.cssText = `
        display: flex;
        justify-content: center;
        gap: 30px;
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px solid #eee;
    `;

    // Nach Typ gruppieren (nicht nach Label!)
    const uniqueTypes = [...new Set(periods.map(p => p.type))];

    uniqueTypes.forEach(type => {
        const period = periods.find(p => p.type === type);
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.style.cssText = 'display: flex; align-items: center; gap: 8px;';

        // Farbbox (gestrichelt für FC/PLAN/BUD)
        const colorBox = document.createElement('div');
        colorBox.style.cssText = `
            width: 16px; height: 16px;
            background: ${period.dashed ? 'none' : period.color};
            border: ${period.dashed ? `2px dashed ${period.color}` : 'none'};
            border-radius: 2px;
        `;

        // Label
        const label = document.createElement('span');
        label.textContent = period.label;
        label.style.fontSize = '12px';

        item.appendChild(colorBox);
        item.appendChild(label);
        legend.appendChild(item);
    });

    container.appendChild(legend);
}
```

---

## Beispiel-Aufruf

```
Erstelle einen dynamischen, interaktiven Bar-Chart im Think-Cell-Stil mit folgenden Spezifikationen:

[... vollständiger Prompt von oben ...]

Die Daten sollen sein:
- Perioden: 2022, 2023, 2024
- Kategorien:
  - Cloud Revenue (50, 180, 2400) - MIT Skalenbruch
  - On-Premise (800, 750, 680) - ohne Skalenbruch
  - Services (120, 145, 190) - ohne Skalenbruch

Das Farbschema soll sein: Rot-Grau (Grau für ältere Jahre, Rot #E63946 für aktuelles)
```

---

## Technische Begründung

### Warum Bar-Charts?

| Use Case | Vorteil |
|----------|---------|
| Periodenvergleich | Zeigt Entwicklung über Zeit (FY22 → FY25) |
| Kategorienvergleich | Ermöglicht direkten Vergleich von Werten |
| Wachstumsanalyse | Mit Brackets: Prozentuale Änderungen sichtbar |
| Extremwert-Darstellung | Mit Skalenbruch: Große Unterschiede darstellbar |

### Warum reines SVG statt Chart-Libraries?

| Aspekt | ECharts/Highcharts | Reines SVG |
|--------|-------------------|------------|
| Bracket-Annotations | Kompliziert, Y-Koordinaten-Bugs | Pixel-perfekte Kontrolle |
| Skalenbruch | Nicht nativ unterstützt | Vollständig anpassbar |
| Bundle-Größe | 500KB+ | 0KB (native Browser-API) |
| Customization | Framework-Grenzen | Unbegrenzt |

### Kritische Implementierungsdetails

1. **SVG Y-Koordinaten**: Y=0 ist oben, Y wächst nach unten
2. **Text-Positionierung**: `text-anchor: middle` für horizontal, `dominant-baseline: middle` für vertikal
3. **Bracket-Reihenfolge**: Erst alle Balken rendern, dann alle Brackets (wegen Z-Index)
4. **Tooltip-Position**: `position: fixed` mit `clientX/clientY`
5. **Dynamische Bubble-Breite**: NIEMALS statische Breiten - immer basierend auf Textlänge

---

## Häufige Fehler vermeiden

| Problem | Ursache | Lösung |
|---------|---------|--------|
| Brackets überlappen Labels | Bracket-Ebene zu niedrig | Brackets auf einheitlicher Höhe OBERHALB aller Labels |
| Alle Pfeile gleich lang | Labels auf einheitlicher Höhe | Labels DIREKT über Balken, Pfeillängen variieren |
| Text überläuft Bubble | Statische bubbleWidth | `text.length * charWidth + padding` |
| Labels abgeschnitten | Margin zu klein | `margin.top` erhöhen |
| Legende redundant | Zeigt Perioden statt Typen | Nach `type` gruppieren, nicht nach `label` |

<!-- PROMPT-END -->

---

## Visualisierung

```
        Revenue Development
        in million euros
                                    ┌───────┐
                          ┌───────┐ │ 1,620 │
                ┌───────┐ │ 1,480 │ │███████│
      ┌───────┐ │ 1,350 │ │███████│ │███████│
      │ 1,200 │ │███████│ │███████│ │███████│
      │███████│ │███████│ │███████│ │███████│
      │███████│ │███████│ │███████│ │███████│
      └───────┴─┴───────┴─┴───────┴─┴───────┘
       FY 2022   FY 2023   FY 2024   FY 2025

              ┌─────────────────────┐
              │ +12%  +10%  +9%     │ ← Bracket-Annotations
              └─────────────────────┘
```

## Skalenbruch-Visualisierung

```
                    2,400
  ┌────────────────────────┐
  │████████████████████████│  ← Oberer Teil
  │████████████████████████│
  ├─ ∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿ ─┤  ← Zickzack (Skalenbruch)
  │████████████████████████│
  │████████████████████████│  ← Unterer Teil
  └────────────────────────┘
         180          50
  ┌──────────────┐  ┌────┐
  │██████████████│  │████│    ← Normale Balken
  └──────────────┘  └────┘
       2023          2022
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
