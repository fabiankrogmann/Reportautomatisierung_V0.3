# Waterfall-Chart Feature-Analyse

## Teil 1: Neu zu implementierende Features

### 1. Mehrere Datenreihen / Szenario-Vergleiche
**Beschreibung:** Parallele Waterfall-Bridges nebeneinander darstellen, um verschiedene Szenarien, Zeiträume oder Entitäten direkt zu vergleichen.

**Beispiele:**
- **Budget vs. Forecast vs. Actual:** Drei parallele Bridges zeigen die Entwicklung von Umsatz zu EBIT für jedes Szenario
- **Regionen-Vergleich:** EMEA, Americas, APAC als separate aber synchronisierte Bridges mit gemeinsamer Y-Achse

**Mögliche Konfiguration:**
```javascript
scenarios: [
    { id: 'budget', label: 'Budget 2024', color: '#2C3E50' },
    { id: 'forecast', label: 'FC Q3', color: '#3498DB' },
    { id: 'actual', label: 'Actual', color: '#27AE60' }
]
```

---

### 2. Gruppierung / Kategorisierung von Balken
**Beschreibung:** Mehrere aufeinanderfolgende Balken visuell zu einer Gruppe zusammenfassen mit übergreifender Klammer und Gruppen-Label. Optional: Subtotal pro Gruppe.

**Beispiele:**
- **Kostenarten-Gruppierung:** "Operative Kosten" als Klammer über Material, Personal, Sonstige Kosten mit Gruppen-Subtotal
- **Segment-Gruppierung:** "Wachstumsmärkte" fasst China, Indien, Brasilien zusammen

**Mögliche Konfiguration:**
```javascript
groups: [
    {
        label: 'Operative Kosten',
        fromIndex: 2,
        toIndex: 5,
        showSubtotal: true,
        subtotalLabel: 'Summe OpEx'
    }
]
```

---

### 3. Negative Bridges (vollständig negative Waterfalls)
**Beschreibung:** Bridges die komplett im negativen Bereich verlaufen (z.B. Verlust-zu-Verlust) oder die Nulllinie kreuzen.

**Beispiele:**
- **Verlustanalyse:** Von -50 Mio. EBIT zu -30 Mio. EBIT (Verbesserung im negativen Bereich)
- **Nulllinien-Kreuzung:** Von +20 Mio. Operating Profit zu -5 Mio. nach Sondereffekten

**Besonderheiten:**
- Increase-Balken im negativen Bereich wächst "nach oben" (wird weniger negativ)
- Decrease-Balken im negativen Bereich wächst "nach unten" (wird stärker negativ)
- Nulllinie prominent darstellen bei Kreuzung

---

### 4. Zeitreihen-Integration
**Beschreibung:** Automatische Darstellung von Veränderungen über Zeitperioden mit intelligenter Aggregation und Delta-Berechnung.

**Beispiele:**
- **Jahresvergleich:** 2020 → 2021 → 2022 → 2023 → 2024 mit automatischen Δ-Balken zwischen Jahren
- **Quartals-Entwicklung:** Q1 als Start, Q2/Q3/Q4 als Veränderungen, YTD als End

**Mögliche Konfiguration:**
```javascript
timeSeries: {
    enabled: true,
    periods: ['2020', '2021', '2022', '2023', '2024'],
    values: [80, 85, 92, 88, 105],
    showDeltas: true,  // Automatisch Δ-Balken zwischen Perioden
    aggregation: 'cumulative'  // oder 'period-over-period'
}
```

---

### 5. Benchmark-Linien / Referenzwerte
**Beschreibung:** Horizontale Linien zur Markierung von Zielwerten, Schwellenwerten oder Vergleichsgrößen.

**Beispiele:**
- **Budget-Ziel:** Horizontale gestrichelte Linie bei €1.1 Mio. mit Label "Budget Target"
- **Break-Even:** Linie bei 0 mit farbiger Hervorhebung des Bereichs darüber/darunter

**Mögliche Konfiguration:**
```javascript
benchmarkLines: [
    {
        value: 1100000,
        label: 'Budget Target',
        color: '#E74C3C',
        style: 'dashed',
        labelPosition: 'right'
    },
    {
        value: 0,
        label: 'Break-Even',
        color: '#333',
        style: 'solid',
        highlight: true  // Bereich über/unter Linie schattieren
    }
]
```

---

### 6. Intelligente Bracket-Auswahl (Smart Comparison Brackets)
**Beschreibung:** Die KI entscheidet selbstständig, welcher Vergleich für die Bracket-Annotation am sinnvollsten ist – nicht zwangsläufig Start→End, sondern kontextabhängig der aussagekräftigste Vergleich.

**Entscheidungslogik der KI:**

| Datenkontext | Empfohlener Vergleich | Bracket-Label |
|--------------|----------------------|---------------|
| Budget vs. Actual vorhanden | Budget → Actual | "+5,2% vs. Budget" |
| Vorjahreswert vorhanden | PY → CY | "+12,3% YoY" |
| Mehrere Jahre (≥3) | Erstes → Letztes Jahr | "CAGR 8,5%" |
| Target/Guidance vorhanden | Actual → Target | "-2,1% vs. Target" |
| Forecast vorhanden | FC → Actual | "+0,8% vs. FC" |
| Nur Start/End | Start → End | "+15,4%" |

**Beispiele:**

- **Varianzanalyse mit Budget & Target:**
  ```
  Budget (1.000) → [Effekte] → Actual (1.098) → Target (1.100)
  ```
  KI wählt: Budget → Actual mit Label "+9,8% vs. Budget"
  *Alternativ möglich:* Actual → Target mit Label "-0,2% vs. Target"

- **Mehrjahres-Zeitreihe:**
  ```
  2020 (80) → Δ2021 → Δ2022 → Δ2023 → 2024 (105)
  ```
  KI wählt: 2020 → 2024 mit Label "CAGR 7,0%" (nicht simple +31,3%)

- **Forecast-Abweichung:**
  ```
  FC Q3 (950) → [Effekte] → Actual Q3 (980)
  ```
  KI wählt: FC → Actual mit Label "+3,2% vs. FC"

**Mögliche Konfiguration:**
```javascript
bracket: {
    mode: 'auto',  // 'auto' | 'manual' | 'multiple'
    // Bei 'auto': KI entscheidet basierend auf Kontext
    // Bei 'manual': fromIndex/toIndex wie bisher
    // Bei 'multiple': Mehrere Brackets möglich

    // Optional: Präferenzen für Auto-Modus
    preferences: {
        preferCAGR: true,        // Bei ≥3 Jahren CAGR statt simple %
        preferBudgetComparison: true,  // Budget vs. Actual priorisieren
        showMultiple: false      // Nur ein Bracket oder mehrere?
    },

    // Fallback bei 'manual'
    fromIndex: 0,
    toIndex: 6,
    label: '+8.7%'
}
```

**KI-Entscheidungsbaum:**
```
1. Gibt es Budget UND Actual?
   → JA: Vergleiche Budget → Actual (primär)

2. Gibt es Vorjahreswert (PY/LY)?
   → JA: Vergleiche PY → CY ("YoY")

3. Sind ≥3 Zeitperioden vorhanden?
   → JA: Berechne CAGR statt simple Δ%

4. Gibt es Target/Guidance?
   → JA: Zeige Actual → Target als sekundären Vergleich

5. Gibt es Forecast?
   → JA: Vergleiche FC → Actual

6. Fallback:
   → Start → End mit simple Δ%
```

**Berechnung CAGR:**
```javascript
// CAGR = (Endwert / Startwert)^(1/n) - 1
function calculateCAGR(startValue, endValue, years) {
    return Math.pow(endValue / startValue, 1 / years) - 1;
}

// Beispiel: 80 → 105 über 4 Jahre
// CAGR = (105/80)^(1/4) - 1 = 7,0%
```

**Mehrere Brackets (mode: 'multiple'):**

Die KI kann mehrere sinnvolle Vergleiche gleichzeitig darstellen, wenn diese unterschiedliche Aussagen liefern.

**Beispiel 1: Zeitreihe mit CAGR + YoY**
```
                    ┌────[CAGR 7,0%]────────────────────┐
                    │                                    ↓
                    │        ┌──[+12% YoY]──┐
                    │        │              ↓
   80              85       92            88           105
  2020            2021     2022         2023          2024
```
→ Oberes Bracket: Langfristige Entwicklung (CAGR über 4 Jahre)
→ Unteres Bracket: Kurzfristige Entwicklung (aktuelles Jahr vs. Vorjahr)

**Beispiel 2: Budget-Varianz + Target-Gap**
```
  ┌─────────[+9,8% vs. Budget]─────────┐
  │                                     ↓
  │                              ┌─[-0,2% vs. Target]─┐
  │                              │                     ↓
 1.000    +85   +42   -35   -22    1.098             1.100
Budget   Vol.  Preis Kost.  FX    Actual            Target
```
→ Oberes Bracket: Wie gut vs. Budget? (+9,8% Übererfüllung)
→ Unteres Bracket: Wie weit vom Target entfernt? (-0,2% Gap)

**Beispiel 3: P&L Bridge mit Margen-Vergleich**
```
        ┌───[Bruttomarge 40%]───┐
        │                       ↓
  ┌─────────────────[EBIT-Marge 12%]──────────────────┐
  │                                                    ↓
 100     -60        40        -18      -10           12
Umsatz  COGS    Gross     SG&A      R&D          EBIT
              Profit
```
→ Oberes Bracket: Bruttomarge (Umsatz → Gross Profit)
→ Unteres Bracket: EBIT-Marge (Umsatz → EBIT)

**Beispiel 4: Subtotal-Vergleiche innerhalb einer Bridge**
```
                  ┌──[OpEx Ratio 28%]──┐
                  │                     ↓
  ┌───────────────────[Gesamtmarge 8,5%]───────────────────┐
  │                                                         ↓
 1.320    -618    -324     -54      -12     112
Umsatz  Material Personal Sonst.  Abschr.  EBIT
         ↑_______OpEx Total_______↑
```
→ Oberes Bracket: OpEx als % vom Umsatz (nur Kostenblock)
→ Unteres Bracket: EBIT-Marge (Gesamtbild)

**Sinnvolle Kombinationen (KI-Logik):**

| Kontext | Bracket 1 (primär) | Bracket 2 (sekundär) |
|---------|-------------------|---------------------|
| Budget + Actual + Target | Budget → Actual | Actual → Target |
| Zeitreihe ≥3 Jahre | CAGR (gesamt) | YoY (letztes Jahr) |
| P&L mit Subtotals | Umsatz → EBIT | Umsatz → Gross Profit |
| Varianz mit Kategorien | Gesamt-Δ% | Größter Einzeleffekt |
| Forecast + Actual + PY | FC → Actual | PY → Actual (YoY) |

**Konfiguration für Multiple Brackets:**
```javascript
bracket: {
    mode: 'multiple',
    maxBrackets: 2,  // Maximal 2 Brackets zur Vermeidung von Überladung

    // KI wählt automatisch ODER manuelle Vorgabe:
    brackets: [
        { fromIndex: 0, toIndex: 6, label: '+9,8% vs. Budget', level: 'primary' },
        { fromIndex: 6, toIndex: 7, label: '-0,2% vs. Target', level: 'secondary' }
    ],

    // Styling pro Level
    styling: {
        primary: { lineWidth: 1.5, bubbleSize: 'large' },
        secondary: { lineWidth: 1, bubbleSize: 'small', color: '#666' }
    }
}
```

**Positionierungs-Logik bei mehreren Brackets:**
```
Level 1 (primary):   Ganz oben, dickere Linie, größere Bubble
Level 2 (secondary): Darunter, dünnere Linie, kleinere Bubble, ggf. andere Farbe

Vertikaler Abstand zwischen Brackets: mindestens 25px
Brackets dürfen sich NICHT überschneiden (horizontal)
Bei Überlappung: Sekundäres Bracket nach unten verschieben
```

---

## Teil 2: Bestehende Features

### Kern-Features (ESSENTIELL – müssen in Hauptdatei bleiben)

| Feature | Beschreibung | Auslagerbar? |
|---------|--------------|:------------:|
| **Balkentypen** | 7 Typen: start, increase, decrease, end, compare, subtotal, delta | ❌ Nein |
| **Kumulatives Rendering** | Schwebende/hängende Balken basierend auf vorherigem Wert | ❌ Nein |
| **Connector-Linien** | Gestrichelte Verbindungen zwischen Balken | ❌ Nein |
| **Y-Skala-Berechnung** | Automatische Skalierung inkl. negativer Werte | ❌ Nein |
| **Auto-End-Berechnung** | End-Wert = Start + Σ(Änderungen) | ❌ Nein |
| **Wert-Labels (Basis)** | Anzeige der Werte über/im Balken | ❌ Nein |
| **X-Achsen-Labels** | Beschriftung unter Balken | ❌ Nein |
| **Basis-Farbkonfiguration** | Farben für start, end, positive, negative | ❌ Nein |
| **Layout-Berechnung** | Balkenbreite, Abstände, Margins | ❌ Nein |

---

### Optionale Features (AUSLAGERBAR in separate Dateien)

#### Datei: `WATERFALL-ANNOTATIONS.md`

| Feature | Beschreibung | Komplexität |
|---------|--------------|:-----------:|
| **Bracket-Annotation** | Prozentuale Veränderung zwischen zwei Balken mit Bubble und Pfeil | Mittel |
| **Category-Brackets** | Prozent-Anteile über einzelnen Balken ("51,2% vom Umsatz") | Mittel |
| **Tooltip-System** | Hover-Informationen mit Details | Niedrig |

#### Datei: `WATERFALL-ADVANCED-LAYOUT.md`

| Feature | Beschreibung | Komplexität |
|---------|--------------|:-----------:|
| **Skalenbruch** | Zickzack-Linien für extreme Wertsprünge | Mittel |
| **Compare-Bars-Konfiguration** | Schmale Vergleichsbalken neben Hauptbalken (FC, Budget) | Hoch |
| **Farbkodierte Varianz-Labels** | Grüne/rote Labels für positive/negative Varianzen | Niedrig |

#### Datei: `WATERFALL-STYLING.md`

| Feature | Beschreibung | Komplexität |
|---------|--------------|:-----------:|
| **Erweiterte Farbkonfiguration** | Zusätzliche Typen (budget, actual, target) | Niedrig |
| **Dynamische Legende** | Automatisch generierte Legende basierend auf verwendeten Typen | Niedrig |
| **CSS-Klassen (erweitert)** | Hover-Effekte, Animationen | Niedrig |
| **Mehrzeilige Labels** | \n Support mit tspan-Rendering | Niedrig |

#### Datei: `WATERFALL-USE-CASES.md`

| Feature | Beschreibung | Komplexität |
|---------|--------------|:-----------:|
| **P&L Bridge Beispiel** | Umsatz → Gewinn mit Kostenarten | Dokumentation |
| **Cash Flow Bridge Beispiel** | Opening → Closing Cash | Dokumentation |
| **Varianzanalyse Beispiel** | Budget vs. Actual mit Effekten | Dokumentation |
| **EBITDA Bridge Beispiel** | FY-über-FY mit Effekten | Dokumentation |
| **Working Capital Bridge** | WC-Komponenten Analyse | Dokumentation |
| **Marktanteils-Bridge** | Segment-Effekte | Dokumentation |
| **Personalkosten-Bridge** | HC + Gehaltseffekte | Dokumentation |

---

## Teil 3: Zusammenfassung

### Struktur-Empfehlung

```
WATERFALL-CHART-PROMPT.md (Hauptdatei, ~400 Zeilen)
├── Kern-Features
├── Basis-Konfiguration
└── Minimales Rendering

WATERFALL-ANNOTATIONS.md (~150 Zeilen)
├── Bracket-Annotation
├── Category-Brackets
└── Tooltip-System

WATERFALL-ADVANCED-LAYOUT.md (~200 Zeilen)
├── Skalenbruch
├── Compare-Bars
└── Farbkodierte Labels

WATERFALL-STYLING.md (~100 Zeilen)
├── Erweiterte Farben
├── Legende
└── CSS-Erweiterungen

WATERFALL-USE-CASES.md (~300 Zeilen)
└── Alle Beispiele

WATERFALL-NEW-FEATURES.md (NEU zu entwickeln)
├── Mehrere Datenreihen
├── Gruppierung
├── Negative Bridges
├── Zeitreihen-Integration
├── Benchmark-Linien
└── Intelligente Bracket-Auswahl
```

### Prioritäten für neue Features

| Priorität | Feature | Begründung |
|:---------:|---------|------------|
| 🔴 Hoch | Negative Bridges | Grundlegend für vollständige Finanzanalysen |
| 🔴 Hoch | Benchmark-Linien | Häufig benötigt, relativ einfach |
| 🔴 Hoch | Intelligente Bracket-Auswahl | Reduziert manuelle Konfiguration, verbessert Aussagekraft |
| 🟡 Mittel | Gruppierung | Verbessert Lesbarkeit bei vielen Balken |
| 🟡 Mittel | Zeitreihen | Häufiger Use-Case, automatisiert Arbeit |
| 🟢 Niedrig | Multi-Szenario | Komplex, aber mächtiges Feature |
