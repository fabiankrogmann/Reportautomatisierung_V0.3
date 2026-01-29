# Feature: Grouping (Balken-Gruppierung)

## 1. METADATA
- **ID**: `grouping`
- **Version**: 1.0
- **Kategorie**: layout
- **Komplexität**: hoch

## 2. BESCHREIBUNG
Fasst zusammengehörige Balken zu visuellen Gruppen zusammen, die durch geschweifte Klammern oder Linien unterhalb der X-Achse verbunden werden. Typische Anwendungsfälle sind die Gruppierung von Kostenarten (Material, Personal, Sonstige → "Betriebskosten"), Cashflow-Kategorien (Operating, Investing, Financing) oder Segmentgruppen.

Die Gruppierung hilft dem Betrachter, die hierarchische Struktur der Daten zu erkennen und Zusammenhänge auf einen Blick zu erfassen.

## 3. TEMPLATE-KOMPATIBILITÄT
| Template-Kategorie | Kompatibel | Hinweise |
|--------------------|:----------:|----------|
| Structure (WF-01,02,05-07,10) | ✓ | Kostenarten, CF-Kategorien, Segmente |
| Variance (WF-03,04,08,09,12) | ✗ | Deltas sind atomar, nicht gruppierbar |
| Trend (WF-11,13) | ✗ | Perioden sind nicht hierarchisch |
| Compare-Bars (WF-14-19) | ✗ | Zu komplex mit Vergleichsbalken |

## 4. AKTIVIERUNGSREGELN

### 4.1 Natürliche Sprache
"Aktiviere Gruppierung wenn die Daten eine erkennbare hierarchische Struktur aufweisen und das Template eine Structure-Kategorie hat. Gruppen müssen mindestens 2 Balken umfassen und es müssen mindestens 2 verschiedene Gruppen identifizierbar sein.

Besonders sinnvoll bei:
- P&L-Detail (WF-02): Kostengruppen (Material, Personal, Sonstige → Betriebskosten)
- Cashflow (WF-06): CF-Kategorien (Operating, Investing, Financing)
- Segment-Analyse (WF-10): Segmente nach Region oder Sparte

NICHT aktivieren bei:
- Variance-Templates (Deltas sind atomar)
- Trend-Templates (Perioden haben keine Hierarchie)
- Compare-Bars-Templates (zu komplex)
- Weniger als 6 Balken (Gruppierung hat keinen Mehrwert)
- Wenn keine logischen Gruppen erkennbar sind"

### 4.2 Pseudo-Code
```
IF templateCategory == 'structure'
   AND bars.length >= 6
   AND hierarchy.detected == true
   AND hierarchy.groups.length >= 2
   AND hierarchy.groups.every(g => g.items.length >= 2)
THEN:
    grouping.enabled = true
    grouping.groups = []

    FOR each group in hierarchy.groups:
        grouping.groups.push({
            label: group.name,
            fromIndex: group.firstBarIndex,
            toIndex: group.lastBarIndex,
            color: group.color || '#666'
        })

    // Validierung: Gruppen dürfen sich nicht überlappen
    FOR i = 0 to grouping.groups.length - 2:
        IF grouping.groups[i].toIndex >= grouping.groups[i+1].fromIndex:
            // Überlappung → Grouping deaktivieren
            grouping.enabled = false
            grouping._reason = "Gruppen überlappen sich"
            BREAK

ELSE:
    grouping.enabled = false
    IF templateCategory != 'structure':
        grouping._reason = "Nicht für " + templateCategory + "-Templates"
    ELSE IF bars.length < 6:
        grouping._reason = "Zu wenige Balken (" + bars.length + "), Gruppierung hat keinen Mehrwert"
    ELSE:
        grouping._reason = "Keine hierarchischen Gruppen erkannt"
```

### 4.3 Parameter-Berechnungsformeln
| Parameter | Formel | Beispiel |
|-----------|--------|----------|
| groups[].label | Gruppenname aus Hierarchie | "Betriebskosten" |
| groups[].fromIndex | Index des ersten Balkens in der Gruppe | 2 |
| groups[].toIndex | Index des letzten Balkens in der Gruppe | 4 |
| groups[].color | Aus Kontext oder Standard-Grau | "#666" |

## 5. CONFIG-SCHEMA

### 5.1 Minimale Config
```json
{
  "grouping": {
    "enabled": true,
    "groups": [
      { "label": "Betriebskosten", "fromIndex": 1, "toIndex": 3 },
      { "label": "Finanzergebnis", "fromIndex": 4, "toIndex": 5 }
    ]
  }
}
```

### 5.2 Vollständige Config
```json
{
  "grouping": {
    "enabled": true,
    "groups": [
      {
        "label": "Betriebskosten",
        "fromIndex": 1,
        "toIndex": 3,
        "color": "#555"
      },
      {
        "label": "Finanzergebnis",
        "fromIndex": 4,
        "toIndex": 5,
        "color": "#555"
      }
    ],
    "position": "bottom",
    "style": "bracket",
    "_reason": "P&L-Struktur mit 2 logischen Gruppen: Betriebskosten (Material, Personal, Sonstige) und Finanzergebnis (Zinsen, Beteiligungen)"
  }
}
```

## 6. RENDERING-LOGIK

### 6.1 Voraussetzungen
- Benötigt: `getBarX()`, `barWidth`, `chartHeight`, `margin`
- Abhängig von: Muss NACH Basis-Balken und X-Achsen-Labels gerendert werden

### 6.2 SVG-Code
```javascript
// FEATURE: GROUPING
// Wird ausgeführt wenn config.features.grouping.enabled = true

if (config.features?.grouping?.enabled) {
    const groups = config.features.grouping.groups || [];
    const groupStyle = config.features.grouping.style || 'bracket';
    const groupY = chartHeight - margin.bottom + 30;  // Unterhalb X-Achsen-Labels
    const bracketHeight = 12;

    groups.forEach((group, i) => {
        const fromX = getBarX(group.fromIndex);
        const toX = getBarX(group.toIndex) + barWidth;
        const centerX = (fromX + toX) / 2;
        const groupColor = group.color || '#555';

        if (groupStyle === 'bracket') {
            // Geschweifte Klammer unterhalb der X-Achse

            // Linker Fuß
            svgContent += `<line class="group-bracket"
                x1="${fromX}" y1="${groupY}"
                x2="${fromX}" y2="${groupY + bracketHeight / 2}"
                stroke="${groupColor}" stroke-width="1.5"/>`;

            // Horizontale Linie links
            svgContent += `<line class="group-bracket"
                x1="${fromX}" y1="${groupY + bracketHeight / 2}"
                x2="${centerX - 5}" y2="${groupY + bracketHeight / 2}"
                stroke="${groupColor}" stroke-width="1.5"/>`;

            // Spitze nach unten (Mitte)
            svgContent += `<line class="group-bracket"
                x1="${centerX - 5}" y1="${groupY + bracketHeight / 2}"
                x2="${centerX}" y2="${groupY + bracketHeight}"
                stroke="${groupColor}" stroke-width="1.5"/>`;
            svgContent += `<line class="group-bracket"
                x1="${centerX}" y1="${groupY + bracketHeight}"
                x2="${centerX + 5}" y2="${groupY + bracketHeight / 2}"
                stroke="${groupColor}" stroke-width="1.5"/>`;

            // Horizontale Linie rechts
            svgContent += `<line class="group-bracket"
                x1="${centerX + 5}" y1="${groupY + bracketHeight / 2}"
                x2="${toX}" y2="${groupY + bracketHeight / 2}"
                stroke="${groupColor}" stroke-width="1.5"/>`;

            // Rechter Fuß
            svgContent += `<line class="group-bracket"
                x1="${toX}" y1="${groupY}"
                x2="${toX}" y2="${groupY + bracketHeight / 2}"
                stroke="${groupColor}" stroke-width="1.5"/>`;

            // Gruppen-Label
            svgContent += `<text class="group-label"
                x="${centerX}" y="${groupY + bracketHeight + 14}"
                text-anchor="middle"
                font-size="10" fill="${groupColor}" font-weight="600">
                ${group.label}
            </text>`;

        } else if (groupStyle === 'line') {
            // Einfache Linie mit Label

            svgContent += `<line class="group-line"
                x1="${fromX}" y1="${groupY}"
                x2="${toX}" y2="${groupY}"
                stroke="${groupColor}" stroke-width="2"/>`;

            // Kleine vertikale Endkappen
            svgContent += `<line x1="${fromX}" y1="${groupY - 3}"
                x2="${fromX}" y2="${groupY + 3}"
                stroke="${groupColor}" stroke-width="2"/>`;
            svgContent += `<line x1="${toX}" y1="${groupY - 3}"
                x2="${toX}" y2="${groupY + 3}"
                stroke="${groupColor}" stroke-width="2"/>`;

            // Label
            svgContent += `<text class="group-label"
                x="${centerX}" y="${groupY + 16}"
                text-anchor="middle"
                font-size="10" fill="${groupColor}" font-weight="600">
                ${group.label}
            </text>`;
        }
    });
}
```

### 6.3 Positionierung
- **Z-Index**: Nach Basis-Balken und X-Achsen-Labels, VOR Bracket/Arrows
- **Anchor**: Unterhalb der X-Achsen-Labels
- **Spacing**: Benötigt ca. 40px zusätzlich in margin.bottom (12px Klammer + 14px Label + Puffer)

## 7. CSS-STYLES

```css
.group-bracket {
    stroke: #555;
    stroke-width: 1.5;
    fill: none;
}

.group-line {
    stroke: #555;
    stroke-width: 2;
    fill: none;
}

.group-label {
    font-size: 10px;
    font-weight: 600;
    fill: #555;
    text-anchor: middle;
}
```

## 8. KONFLIKTE & ABHÄNGIGKEITEN

### Konflikte
| Konflikt mit | Grund | Lösung |
|--------------|-------|--------|
| Variance-Templates | Deltas sind atomar, nicht gruppierbar | Grouping deaktivieren |
| Trend-Templates | Perioden haben keine Hierarchie | Grouping deaktivieren |
| Compare-Bars | Visuell zu überladen mit Vergleichsbalken | Grouping deaktivieren |

### Abhängigkeiten
| Benötigt | Grund |
|----------|-------|
| hierarchy.detected | Hierarchie-Erkennung aus PROMPT-1 |

### Interaktion mit anderen Features
| Feature | Interaktion |
|---------|------------|
| categoryBrackets | Beide zeigen Gruppen, aber unterschiedlich: Grouping = unterhalb, CategoryBrackets = oberhalb. Können koexistieren. |
| footnotes | Footnotes müssen NACH Grouping positioniert werden (weiter unten) |

## 9. EDGE-CASES & FEHLERBEHANDLUNG

| Situation | Verhalten |
|-----------|-----------|
| Keine Hierarchie erkannt | Feature deaktivieren |
| Nur 1 Gruppe | Feature deaktivieren (kein Mehrwert) |
| Gruppen überlappen sich | Feature deaktivieren |
| Start-/End-Balken in einer Gruppe | Erlaubt, aber unüblich |
| > 4 Gruppen | Auf 4 begrenzen (Platzgründe) |
| Gruppe mit nur 1 Balken | Gruppe ignorieren |
| < 6 Balken gesamt | Feature deaktivieren (kein Mehrwert) |
| Footnotes auch aktiv | margin.bottom um zusätzliche 40px erhöhen |

## 10. BEISPIELE

### Beispiel 1: P&L-Detail mit Kostengruppen
**Input:**
```json
{
  "grouping": {
    "enabled": true,
    "groups": [
      { "label": "Betriebskosten", "fromIndex": 1, "toIndex": 3 },
      { "label": "Finanzergebnis", "fromIndex": 5, "toIndex": 6 }
    ],
    "style": "bracket",
    "_reason": "P&L-Detail mit klaren Kostengruppen: Material+Personal+Sonstige = Betriebskosten, Zinsen+Beteiligungen = Finanzergebnis"
  }
}
```

**Ergebnis:**
```
  2.195
  ┌─────┐
  │█████│ -1.168   -618   -258
  │█████│  ┌────┐ ┌────┐ ┌────┐  ┌────┐  -25   +12    ┌─────┐
  │█████│  │░░░░│ │░░░░│ │░░░░│  │████│  ┌──┐  ┌──┐   │█████│
  └─────┘  └────┘ └────┘ └────┘  └────┘  │░░│  │██│   └─────┘
  Umsatz   Mat.   Pers.  Sonst.  Rohert.  Zins  Bet.   EBT
           └──────────┬──────────┘         └──┬──┘
             Betriebskosten              Finanzergebnis
```

### Beispiel 2: Cashflow mit CF-Kategorien
**Input:**
```json
{
  "grouping": {
    "enabled": true,
    "groups": [
      { "label": "Operating CF", "fromIndex": 1, "toIndex": 3 },
      { "label": "Investing CF", "fromIndex": 4, "toIndex": 5 },
      { "label": "Financing CF", "fromIndex": 6, "toIndex": 7 }
    ],
    "style": "bracket",
    "_reason": "Cashflow-Statement mit 3 Standard-CF-Kategorien"
  }
}
```

**Ergebnis:**
```
  500
  ┌─────┐
  │█████│  +180  +95   -30    -250  -45     +120  -70    ┌─────┐
  │█████│  ┌──┐  ┌──┐  ┌──┐  ┌───┐ ┌──┐   ┌──┐  ┌──┐   │█████│
  │█████│  │██│  │██│  │░░│  │░░░│ │░░│   │██│  │░░│   │█████│
  └─────┘  └──┘  └──┘  └──┘  └───┘ └──┘   └──┘  └──┘   └─────┘
  Start    NI    D&A   WC    CapEx  Acq.   Debt  Div.   End
           └──────┬──────┘    └──┬──┘       └──┬──┘
            Operating CF     Investing CF   Financing CF
```
