# Finale Architektur: Chart-Generator Pipeline

## Übersicht: User Flow & Seiten

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           USER JOURNEY                                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│              │    │              │    │              │    │              │
│  upload.html │───▶│ results.html │───▶│  colors.html │───▶│  charts.html │
│              │    │              │    │              │    │              │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
       │                   │                   │                   │
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
   Datei hoch-        Analyse-            Farbschema          Finale Charts
   laden              Ergebnisse          auswählen           anzeigen
   (CSV/XLSX)         anzeigen &                              (3-10 Varianten)
                      Chart-Typ
                      wählen
```

---

## Seiten-Spezifikation

### 1. upload.html - Datei-Upload

```
┌─────────────────────────────────────────────────────────────────┐
│  UPLOAD.HTML                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ZWECK:                                                         │
│  • User lädt CSV oder XLSX Datei hoch                          │
│  • Datei wird an Backend/API gesendet                          │
│  • PROMPT 1 (Universal Analyzer) wird ausgeführt               │
│                                                                 │
│  USER SIEHT:                                                    │
│  • Drag & Drop Zone oder Datei-Auswahl Button                  │
│  • Unterstützte Formate: CSV, XLSX                             │
│  • Loading-Indikator während Analyse läuft                     │
│                                                                 │
│  NACH UPLOAD:                                                   │
│  • Weiterleitung zu results.html mit Analyse-Daten             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  TECHNISCH:                                                     │
│                                                                 │
│  Input:   Datei (CSV/XLSX)                                     │
│  Aufruf:  PROMPT 1 - Universal Analyzer                        │
│  Output:  analysisResult (JSON) → wird an results.html übergeben│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 2. results.html - Analyse & Chart-Typ-Auswahl

```
┌─────────────────────────────────────────────────────────────────┐
│  RESULTS.HTML                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ZWECK:                                                         │
│  • Zeigt Ergebnisse der Datenanalyse                           │
│  • User wählt Chart-Typ (Waterfall / Bar / Stacked Bar)        │
│                                                                 │
│  USER SIEHT:                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  ANALYSE-ERGEBNIS                                       │   │
│  │                                                         │   │
│  │  Datei:        GuV_Report_2025.xlsx                     │   │
│  │  Report-Typ:   Gewinn- und Verlustrechnung              │   │
│  │  Zeitraum:     Jan-Dez 2025                             │   │
│  │  Szenarien:    IST, FC, BUD                             │   │
│  │  Positionen:   16 Zeilen                                │   │
│  │  Währung:      EUR (TEUR)                               │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  CHART-TYP AUSWÄHLEN                                    │   │
│  │                                                         │   │
│  │  ● Waterfall Chart    (empfohlen)                       │   │
│  │    "Ideal für GuV-Überleitungen"                        │   │
│  │                                                         │   │
│  │  ○ Bar Chart                                            │   │
│  │    "Für Szenario- und Periodenvergleiche"               │   │
│  │                                                         │   │
│  │  ○ Stacked Bar Chart                                    │   │
│  │    "Für Zusammensetzungen und Anteile"                  │   │
│  │                                                         │   │
│  │                              [Weiter →]                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  TECHNISCH:                                                     │
│                                                                 │
│  Input:   analysisResult von upload.html                       │
│  Output:  selectedChartType → wird an colors.html übergeben    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3. colors.html - Farbschema-Auswahl

```
┌─────────────────────────────────────────────────────────────────┐
│  COLORS.HTML                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ZWECK:                                                         │
│  • User wählt Farbschema für die Charts                        │
│  • Optional: Corporate Design / Branding                        │
│                                                                 │
│  USER SIEHT:                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  FARBSCHEMA WÄHLEN                                      │   │
│  │                                                         │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │   │
│  │  │ ■■■■■■  │  │ ■■■■■■  │  │ ■■■■■■  │  │ ■■■■■■  │   │   │
│  │  │ Default │  │Corporate│  │ Ampel   │  │  Mono   │   │   │
│  │  │   ●     │  │   ○     │  │   ○     │  │   ○     │   │   │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘   │   │
│  │                                                         │   │
│  │  Vorschau:                                              │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  ■ Start/Ende    ■ Positiv    ■ Negativ        │   │   │
│  │  │  #4472C4         #70AD47      #C00000          │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  │                              [Charts generieren →]      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  TECHNISCH:                                                     │
│                                                                 │
│  Input:   analysisResult + selectedChartType                   │
│  Aufruf:  PROMPT 2 - Variant Generator (nach Klick "Weiter")   │
│  Aufruf:  PROMPT 3 - Config Generator (für jede Variante)      │
│  Output:  chartConfigs[] → wird an charts.html übergeben       │
│                                                                 │
│  HINWEIS: Hier werden die Prompts 2+3 ausgeführt, da erst      │
│  jetzt Chart-Typ UND Farbschema feststehen.                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### 4. charts.html - Finale Chart-Anzeige

```
┌─────────────────────────────────────────────────────────────────┐
│  CHARTS.HTML                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ZWECK:                                                         │
│  • Zeigt alle generierten Chart-Varianten (3-10 Stück)         │
│  • User kann Charts ansehen, exportieren, auswählen            │
│                                                                 │
│  USER SIEHT:                                                    │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  6 CHART-VARIANTEN GENERIERT                            │   │
│  │                                                         │   │
│  │  ┌─────────────────┐  ┌─────────────────┐              │   │
│  │  │ ██              │  │ ██              │              │   │
│  │  │ ██ ▃▃ ▃▃ ██    │  │ ██ ▃▃ ▃▃ ██ ── │              │   │
│  │  │ Variante 1      │  │ Variante 2      │              │   │
│  │  │ GuV Gesamtjahr  │  │ GuV IST vs BUD  │              │   │
│  │  │ [Export] [✓]    │  │ [Export] [✓]    │              │   │
│  │  └─────────────────┘  └─────────────────┘              │   │
│  │                                                         │   │
│  │  ┌─────────────────┐  ┌─────────────────┐              │   │
│  │  │ ██              │  │ ██              │              │   │
│  │  │ ██ ▃▃ ██       │  │ ██ ▃▃ ▃▃ ██    │              │   │
│  │  │ Variante 3      │  │ Variante 4      │              │   │
│  │  │ Executive View  │  │ Q4 Detail       │              │   │
│  │  │ [Export] [✓]    │  │ [Export] [✓]    │              │   │
│  │  └─────────────────┘  └─────────────────┘              │   │
│  │                                                         │   │
│  │  ... weitere Varianten ...                              │   │
│  │                                                         │   │
│  │  [Alle exportieren]  [Ausgewählte exportieren]         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  TECHNISCH:                                                     │
│                                                                 │
│  Input:   chartConfigs[] von colors.html                       │
│  Aufruf:  PROMPT 4 - SVG Renderer (für jede Config)            │
│           ODER: Deterministische Rendering-Engine              │
│  Output:  SVG-Charts zur Anzeige und Export                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Datenfluss zwischen Seiten

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATENFLUSS                                     │
└─────────────────────────────────────────────────────────────────────────────┘

upload.html                     results.html
───────────                     ────────────
    │                               │
    │  ┌─────────────────────┐     │
    ├─▶│ PROMPT 1            │     │
    │  │ Universal Analyzer  │     │
    │  └──────────┬──────────┘     │
    │             │                 │
    │             ▼                 │
    │  ┌─────────────────────┐     │
    │  │ analysisResult      │─────┼────────────────────────┐
    │  │ {                   │     │                        │
    │  │   reportType,       │     │                        │
    │  │   structure,        │     │                        │
    │  │   extractedData,    │     │                        │
    │  │   chartRecommendation│    │                        │
    │  │ }                   │     │                        │
    │  └─────────────────────┘     │                        │
    │                               │                        │
    │                               │  User wählt:           │
    │                               │  selectedChartType     │
    │                               │  ("waterfall")         │
    │                               │         │              │
    │                               │         ▼              │
    │                               │                        │
colors.html                                                  │
───────────                                                  │
    │                                                        │
    │  ◀────────────────────────────────────────────────────┘
    │
    │  User wählt:
    │  selectedColorScheme
    │  ("default")
    │         │
    │         ▼
    │  ┌─────────────────────┐
    ├─▶│ PROMPT 2            │
    │  │ Variant Generator   │
    │  │                     │
    │  │ Input:              │
    │  │ • analysisResult    │
    │  │ • selectedChartType │
    │  │ • templateLibrary   │
    │  └──────────┬──────────┘
    │             │
    │             ▼
    │  ┌─────────────────────┐
    │  │ variants[]          │
    │  │ (3-10 Varianten)    │
    │  └──────────┬──────────┘
    │             │
    │             ▼
    │  ┌─────────────────────┐
    ├─▶│ PROMPT 3            │  (für jede Variante)
    │  │ Config Generator    │
    │  │                     │
    │  │ Input:              │
    │  │ • variant           │
    │  │ • extractedData     │
    │  │ • colorScheme       │
    │  └──────────┬──────────┘
    │             │
    │             ▼
    │  ┌─────────────────────┐
    │  │ chartConfigs[]      │──────────────────────┐
    │  │ (3-10 Configs)      │                      │
    │  └─────────────────────┘                      │
    │                                               │
    │                                               │
charts.html                                         │
───────────                                         │
    │                                               │
    │  ◀────────────────────────────────────────────┘
    │
    │  ┌─────────────────────┐
    ├─▶│ PROMPT 4            │  (für jede Config)
    │  │ SVG Renderer        │
    │  │                     │
    │  │ ODER:               │
    │  │ Deterministische    │
    │  │ Rendering Engine    │
    │  └──────────┬──────────┘
    │             │
    │             ▼
    │  ┌─────────────────────┐
    │  │ SVG Charts[]        │
    │  │ (3-10 fertige SVGs) │
    │  └─────────────────────┘
    │
    ▼
  [Anzeige & Export]
```

---

## Prompt-Übersicht

### PROMPT 1: Universal Analyzer

```
┌─────────────────────────────────────────────────────────────────┐
│  PROMPT 1: UNIVERSAL ANALYZER                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AUFRUF:      upload.html (nach Datei-Upload)                  │
│                                                                 │
│  INPUT:       Rohdaten (CSV/XLSX Inhalt als Text/JSON)         │
│                                                                 │
│  AUFGABEN:                                                      │
│  1. Struktur erkennen (Matrix/Faktentabelle, Report-Typ)       │
│  2. Daten extrahieren und normalisieren                        │
│  3. Metadaten identifizieren (Währung, Einheit, Zeitraum)      │
│  4. Hierarchien erkennen (Cluster → Detail)                    │
│  5. Chart-Typ empfehlen mit Begründung                         │
│                                                                 │
│  KRITISCHE REGEL - SPRACHERHALTUNG:                            │
│  ══════════════════════════════════                            │
│  • Alle Begriffe, Labels und Namen EXAKT beibehalten           │
│  • KEINE Übersetzungen oder Umformulierungen                   │
│  • Deutsch bleibt Deutsch, Englisch bleibt Englisch            │
│  • "Umsatzerlöse" → "Umsatzerlöse" (NICHT "Revenue")          │
│  • "Cost of Sales" → "Cost of Sales" (NICHT "Vertriebskosten")│
│  • Diese Regel gilt durchgängig bis zum finalen Chart-Output   │
│                                                                 │
│  OUTPUT:                                                        │
│  {                                                              │
│    "analysis": {                                                │
│      "reportType": "income-statement",                         │
│      "dataFormat": "matrix-complex",                           │
│      "currency": "EUR",                                        │
│      "unit": "TEUR",                                           │
│      "timeRange": { "periods": [...], "year": "2025" },        │
│      "scenarios": ["IST", "FC", "BUD"],                        │
│      "hierarchy": { "detected": true/false, ... }              │
│    },                                                           │
│    "extractedData": {                                           │
│      "normalized": [...],                                       │
│      "positions": { "start": [...], "costs": [...], ... }      │
│    },                                                           │
│    "chartRecommendation": {                                     │
│      "primary": "waterfall",                                   │
│      "alternatives": ["bar", "stacked-bar"],                   │
│      "reasoning": "GuV-Struktur mit Überleitung..."            │
│    }                                                            │
│  }                                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### PROMPT 2: Variant Generator

```
┌─────────────────────────────────────────────────────────────────┐
│  PROMPT 2: VARIANT GENERATOR                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AUFRUF:      colors.html (nach Klick "Charts generieren")     │
│                                                                 │
│  INPUT:                                                         │
│  • analysisResult (von Prompt 1)                               │
│  • selectedChartType ("waterfall" | "bar" | "stacked-bar")     │
│  • templateLibrary (alle verfügbaren Templates)                │
│                                                                 │
│  AUFGABEN:                                                      │
│  1. Passende Templates aus Bibliothek auswählen                │
│  2. Templates an Daten anpassen wenn nötig                     │
│  3. 3-10 UNTERSCHIEDLICHE Varianten definieren                 │
│  4. Sicherstellen: Jede Variante = eigener Mehrwert            │
│  5. Keine Duplikate oder quasi-identische Charts               │
│                                                                 │
│  REGELN:                                                        │
│  • Minimum: So viele wie sinnvoll (kann 3 sein)                │
│  • Maximum: 10                                                  │
│  • Jede Variante muss neuen Erkenntnisgewinn bieten            │
│  • Unterscheidung durch: Datenauswahl, Zeitraum, Szenario,     │
│    Hierarchie-Ebene, Detail-Tiefe                              │
│  • SPRACHERHALTUNG: Originalbegriffe aus Quelldaten verwenden  │
│                                                                 │
│  OUTPUT:                                                        │
│  {                                                              │
│    "variants": [                                                │
│      {                                                          │
│        "id": 1,                                                 │
│        "templateId": "WF-01",                                  │
│        "title": "GuV Gesamtjahr 2025",                         │
│        "subtitle": "Überleitung Umsatz zu Ergebnis",           │
│        "focus": "annual-total",                                │
│        "dataFilter": { "scenario": "IST", "period": "all" },   │
│        "uniqueValue": "Gesamtbild der Ertragslage"             │
│      },                                                         │
│      { ... },  // Variante 2                                   │
│      { ... }   // Variante 3-10                                │
│    ],                                                           │
│    "variantCount": 6,                                          │
│    "notGeneratedReasons": [                                     │
│      "Keine Vorjahresdaten für PY-Vergleich",                  │
│      "Nur ein Segment vorhanden"                               │
│    ]                                                            │
│  }                                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### PROMPT 3: Config Generator

```
┌─────────────────────────────────────────────────────────────────┐
│  PROMPT 3: CONFIG GENERATOR                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AUFRUF:      colors.html (für jede Variante aus Prompt 2)     │
│                                                                 │
│  INPUT:                                                         │
│  • variant (eine Variante aus Prompt 2)                        │
│  • extractedData (aus Prompt 1)                                │
│  • templateDefinition (aus Template-Bibliothek)                │
│  • colorScheme (User-Auswahl aus colors.html)                  │
│                                                                 │
│  AUFGABEN:                                                      │
│  1. Daten gemäß dataFilter selektieren                         │
│  2. Daten auf Template-Struktur mappen                         │
│  3. Alle Werte, Labels, Achsen befüllen                        │
│     → WICHTIG: Original-Labels aus Quelldaten übernehmen!      │
│     → KEINE Übersetzung oder Umformulierung!                   │
│  4. Farben aus colorScheme anwenden                            │
│  5. Vollständige, render-fertige Config erstellen              │
│                                                                 │
│  OUTPUT:                                                        │
│  {                                                              │
│    "chartConfig": {                                             │
│      "type": "waterfall",                                      │
│      "title": "GuV Gesamtjahr 2025",                           │
│      "subtitle": "in TEUR",                                    │
│      "data": [                                                  │
│        { "label": "Umsatzerlöse", "value": 2195000,            │
│          "type": "start", "color": "#4472C4" },                │
│        { "label": "Materialaufwand", "value": -1168000,        │
│          "type": "decrease", "color": "#C00000" },             │
│        ...                                                      │
│      ],                                                         │
│      "axes": { "y": { "label": "TEUR", "min": 0, ... } },      │
│      "styling": { "barWidth": 0.6, "connectorLine": true }     │
│    }                                                            │
│  }                                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### PROMPT 4: SVG Renderer

```
┌─────────────────────────────────────────────────────────────────┐
│  PROMPT 4: SVG RENDERER                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AUFRUF:      charts.html (für jede chartConfig)               │
│                                                                 │
│  INPUT:       chartConfig (von Prompt 3)                       │
│                                                                 │
│  AUFGABEN:                                                      │
│  1. SVG-Code generieren basierend auf chartConfig              │
│  2. Alle Elemente korrekt positionieren                        │
│  3. Responsive/skalierbar gestalten                            │
│                                                                 │
│  OUTPUT:      SVG-String (render-fertig)                       │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ALTERNATIVE: Deterministische Rendering-Engine                 │
│                                                                 │
│  Statt LLM kann eine JavaScript-Bibliothek (D3.js, Chart.js)   │
│  verwendet werden, die chartConfig direkt in SVG rendert.      │
│                                                                 │
│  Vorteile:                                                      │
│  • Schneller (kein API-Call)                                   │
│  • Konsistenter (keine LLM-Varianz)                            │
│  • Günstiger (keine Token-Kosten)                              │
│                                                                 │
│  Empfehlung: Deterministische Engine bevorzugen,               │
│  LLM nur als Fallback für Sonderfälle.                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Template-Bibliothek

### Übersicht

```
┌─────────────────────────────────────────────────────────────────┐
│  TEMPLATE-BIBLIOTHEK                                            │
│  (Baukasten für Prompt 2 - Variant Generator)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Die KI bekommt diese Templates als Kontext und kann:           │
│  • Passende Templates AUSWÄHLEN                                 │
│  • Templates ANPASSEN wenn Daten es erfordern                  │
│  • Templates KOMBINIEREN für neue Perspektiven                 │
│  • Im Notfall FREI GENERIEREN wenn kein Template passt         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

WATERFALL TEMPLATES (WF-01 bis WF-10)
─────────────────────────────────────
WF-01   GuV Bridge Simple           Umsatz → Kosten → EBIT
WF-02   GuV Bridge mit Vergleich    + Vergleichslinie (BUD/FC/PY)
WF-03   GuV Bridge Kurzform         Nur 5-7 Hauptpositionen
WF-04   GuV Bridge Detailliert      Alle Positionen inkl. Sub
WF-05   EBITDA Bridge               EBITDA PY → Δ → EBITDA CY
WF-06   Revenue Bridge              Umsatz-Treiber-Analyse
WF-07   Cost Bridge                 Kosten-Breakdown
WF-08   Cashflow Bridge             EBITDA → WC → Invest → FCF
WF-09   Zeitreihen-Wasserfall       Jahr 1 → Δ → Jahr n
WF-10   Segment-Wasserfall          Teil A + B + C = Gesamt


BAR CHART TEMPLATES (BC-01 bis BC-08)
─────────────────────────────────────
BC-01   Szenario-Vergleich          IST | FC | BUD nebeneinander
BC-02   Perioden-Vergleich          2022 | 2023 | 2024 | 2025
BC-03   Segment-Vergleich           Region A | B | C
BC-04   Varianz-Darstellung         Delta-Balken (pos/neg)
BC-05   Top-N Ranking               Top 10 sortiert
BC-06   Kennzahlen-Vergleich        KPI 1 | 2 | 3 gruppiert
BC-07   Cluster-Vergleich           Aggregierte Cluster
BC-08   Detail in Cluster           Länder innerhalb DACH


STACKED BAR TEMPLATES (SB-01 bis SB-06)
───────────────────────────────────────
SB-01   Zusammensetzung über Zeit   Stacks = Kategorien, X = Zeit
SB-02   Segment-Breakdown           Stacks = Segmente
SB-03   Cluster-Detail              Stacks = Länder eines Clusters
SB-04   100% Stacked                Prozentuale Anteile
SB-05   Kosten-Breakdown            Stacks = Kostenarten
SB-06   Zusammensetzung Vergleich   IST vs BUD Struktur
```

---

## Farbschemata

```
┌─────────────────────────────────────────────────────────────────┐
│  VORDEFINIERTE FARBSCHEMATA                                     │
│  (Auswahl in colors.html)                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DEFAULT                                                        │
│  ├── Start/Ende:    #4472C4 (Blau)                             │
│  ├── Positiv:       #70AD47 (Grün)                             │
│  ├── Negativ:       #C00000 (Rot)                              │
│  └── Neutral:       #7F7F7F (Grau)                             │
│                                                                 │
│  CORPORATE (Beispiel)                                           │
│  ├── Start/Ende:    #003366 (Dunkelblau)                       │
│  ├── Positiv:       #006633 (Dunkelgrün)                       │
│  ├── Negativ:       #990000 (Dunkelrot)                        │
│  └── Neutral:       #666666 (Dunkelgrau)                       │
│                                                                 │
│  AMPEL                                                          │
│  ├── Start/Ende:    #FFC000 (Gelb)                             │
│  ├── Positiv:       #00B050 (Grün)                             │
│  ├── Negativ:       #FF0000 (Rot)                              │
│  └── Neutral:       #808080 (Grau)                             │
│                                                                 │
│  MONOCHROM                                                      │
│  ├── Start/Ende:    #2F5496 (Dunkelblau)                       │
│  ├── Positiv:       #5B9BD5 (Hellblau)                         │
│  ├── Negativ:       #1F3864 (Sehr dunkelblau)                  │
│  └── Neutral:       #8FAADC (Blaugrau)                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Übergreifende Regeln (für ALLE Prompts)

```
┌─────────────────────────────────────────────────────────────────┐
│  SPRACHERHALTUNG & DATENINTEGRITÄT                              │
│  ═══════════════════════════════════════════════════════════════│
│                                                                 │
│  GRUNDREGEL:                                                    │
│  Alle Begriffe, Labels, Namen und Bezeichnungen aus den         │
│  Quelldaten müssen EXAKT so beibehalten werden, wie sie in      │
│  der hochgeladenen Datei stehen.                                │
│                                                                 │
│  ───────────────────────────────────────────────────────────    │
│                                                                 │
│  VERBOTEN:                                                      │
│  ✗ Übersetzen (DE→EN oder EN→DE)                               │
│  ✗ Umformulieren oder "Verbessern"                             │
│  ✗ Kürzen oder Abkürzen (außer bei Platzmangel im Chart)       │
│  ✗ Synonyme verwenden                                          │
│  ✗ Fachbegriffe "verdeutschen" oder anglizisieren              │
│                                                                 │
│  ───────────────────────────────────────────────────────────    │
│                                                                 │
│  BEISPIELE:                                                     │
│                                                                 │
│  Quelldaten (DE)          │  Output (korrekt)                  │
│  ─────────────────────────┼────────────────────────────────────│
│  "Umsatzerlöse"           │  "Umsatzerlöse"                    │
│  "Materialaufwand"        │  "Materialaufwand"                 │
│  "EBITDA"                 │  "EBITDA"                          │
│  "Sonstige Erträge"       │  "Sonstige Erträge"                │
│                                                                 │
│  Quelldaten (EN)          │  Output (korrekt)                  │
│  ─────────────────────────┼────────────────────────────────────│
│  "Revenue"                │  "Revenue"                         │
│  "Cost of Sales"          │  "Cost of Sales"                   │
│  "Operating Expenses"     │  "Operating Expenses"              │
│  "Net Income"             │  "Net Income"                      │
│                                                                 │
│  ───────────────────────────────────────────────────────────    │
│                                                                 │
│  FALSCH (Beispiele für Fehler):                                │
│  ✗ "Umsatzerlöse" → "Revenue"                                  │
│  ✗ "Cost of Sales" → "Herstellungskosten"                      │
│  ✗ "Materialaufwand" → "Material costs"                        │
│  ✗ "Net Income" → "Nettoergebnis"                              │
│                                                                 │
│  ───────────────────────────────────────────────────────────    │
│                                                                 │
│  AUSNAHME - Nur bei Chart-Titles:                               │
│  Die KI darf beschreibende Titel generieren wie:                │
│  • "GuV Gesamtjahr 2025" (auch wenn Datei englisch ist)        │
│  • "P&L Annual Overview" (auch wenn Datei deutsch ist)         │
│  ABER: Die Daten-Labels im Chart bleiben IMMER original!       │
│                                                                 │
│  ───────────────────────────────────────────────────────────    │
│                                                                 │
│  GELTUNGSBEREICH:                                               │
│  Diese Regel gilt für die gesamte Pipeline:                     │
│  Prompt 1 → Prompt 2 → Prompt 3 → Prompt 4 → Chart Output      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Varianten-Generierung: Logik & Regeln

```
┌─────────────────────────────────────────────────────────────────┐
│  REGELN FÜR VARIANTEN-GENERIERUNG                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MUSS-REGELN:                                                   │
│                                                                 │
│  1. KEINE DUPLIKATE                                             │
│     → Jede Variante muss sich DEUTLICH unterscheiden           │
│     → Unterschied in: Datenauswahl, Aggregation, Perspektive   │
│                                                                 │
│  2. ECHTER MEHRWERT                                             │
│     → Jede Variante muss neue Erkenntnis ermöglichen           │
│     → Frage: "Was lernt User hier, was andere Charts nicht     │
│       zeigen?"                                                  │
│                                                                 │
│  3. SINNVOLLE ANZAHL                                            │
│     → Minimum: So viele wie sinnvoll (mind. 1)                 │
│     → Maximum: 10                                               │
│     → Lieber 5 gute als 10 mittelmäßige                        │
│                                                                 │
│  4. PASSEND ZUM CHART-TYP                                       │
│     → Waterfall: Nur wenn Überleitung/Bridge Sinn macht        │
│     → Bar: Nur wenn Vergleich Sinn macht                       │
│     → Stacked: Nur wenn Zusammensetzung Sinn macht             │
│                                                                 │
│  5. DATEN MÜSSEN VORHANDEN SEIN                                 │
│     → Keine Variante für nicht-existente Daten                 │
│     → Keine "Phantasie-Perspektiven"                           │
│                                                                 │
│  ───────────────────────────────────────────────────────────    │
│                                                                 │
│  VARIANTEN-DIMENSIONEN (Unterscheidungsmerkmale):               │
│                                                                 │
│  A. DATENAUSWAHL                                                │
│     • Alle Daten vs. gefiltert                                 │
│     • Aggregiert vs. Detail                                    │
│                                                                 │
│  B. ZEITLICHE PERSPEKTIVE                                       │
│     • Einzelperiode (Monat, Quartal)                           │
│     • Kumuliert (YTD)                                          │
│     • Periodenvergleich                                        │
│     • Jahresvergleich                                          │
│                                                                 │
│  C. SZENARIO-PERSPEKTIVE                                        │
│     • Nur IST                                                  │
│     • IST vs. Budget                                           │
│     • IST vs. Forecast                                         │
│     • IST vs. Vorjahr                                          │
│                                                                 │
│  D. HIERARCHIE-EBENE                                            │
│     • Konzern gesamt                                           │
│     • Cluster/Segment                                          │
│     • Detail (Land, Produkt, Kunde)                            │
│                                                                 │
│  E. DETAIL-TIEFE                                                │
│     • Executive Summary (5-7 Positionen)                       │
│     • Standard (10-15 Positionen)                              │
│     • Detail (alle Positionen)                                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Testplan: Prompt-Validierung vor Implementierung

```
┌─────────────────────────────────────────────────────────────────┐
│  TESTSTRATEGIE                                                  │
│  ═══════════════════════════════════════════════════════════════│
│                                                                 │
│  ZIEL:                                                          │
│  Die Prompt-Engine ist das Herzstück des Systems. Bevor das     │
│  vollständige Tool implementiert wird, müssen alle 4 Prompts    │
│  mit den 50 Testdateien validiert werden.                       │
│                                                                 │
│  VORGEHEN:                                                      │
│  1. Prompts isoliert testen (ohne Frontend)                     │
│  2. Ergebnisse in JSON speichern                                │
│  3. Visuelle Validierung auf Test-HTML-Seite                    │
│  4. Iterative Prompt-Verbesserung                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Testphasen

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: PROMPT 1 - UNIVERSAL ANALYZER                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TEST-SETUP:                                                    │
│  • Input: Jede der 50 Testdateien einzeln                       │
│  • Output: analysisResult.json pro Datei                        │
│                                                                 │
│  VALIDIERUNGSKRITERIEN:                                         │
│  ☐ Report-Typ korrekt erkannt?                                  │
│  ☐ Struktur korrekt identifiziert (Matrix/Faktentabelle)?       │
│  ☐ Währung/Einheit korrekt?                                     │
│  ☐ Szenarien vollständig erkannt (IST/FC/BUD/PY)?              │
│  ☐ Perioden korrekt extrahiert?                                 │
│  ☐ Hierarchien erkannt (wo vorhanden)?                          │
│  ☐ Labels EXAKT beibehalten (Spracherhaltung)?                  │
│  ☐ Chart-Empfehlung sinnvoll?                                   │
│                                                                 │
│  OUTPUT-ORDNER:                                                 │
│  /test-results/phase1-analyzer/                                 │
│  ├── 01_GuV_Monatssicht_IST_FC_BUD_analysis.json               │
│  ├── 02_GuV_Faktentabelle_SEL_CUM_analysis.json                │
│  └── ... (50 Dateien)                                          │
│                                                                 │
│  ERFOLGS-METRIK:                                                │
│  • 100% korrekte Report-Typ-Erkennung                          │
│  • 100% Spracherhaltung                                         │
│  • 100% korrekte Struktur-Erkennung                            │
│  • 100% korrekte Währung/Einheit                               │
│  • 100% korrekte Szenarien-Erkennung                           │
│                                                                 │
│  ⚠️  KEINE FEHLER ERLAUBT - Dies ist die Basis für alles!      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  AUTOMATISCHE VALIDIERUNGS-CHECKS (Phase 1)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CHECK 1: JSON-Schema-Validierung                               │
│  ────────────────────────────────                               │
│  • Pflichtfelder vorhanden: reportType, dataFormat, currency,   │
│    unit, timeRange, scenarios, extractedData                    │
│  • Datentypen korrekt (strings, arrays, objects)                │
│  • Keine null/undefined bei Pflichtfeldern                      │
│                                                                 │
│  CHECK 2: Spracherhaltung (automatisch prüfbar)                 │
│  ─────────────────────────────────────────────                  │
│  • Extrahiere alle Labels aus extractedData                     │
│  • Vergleiche mit Original-Labels aus Quelldatei                │
│  • FAIL wenn: Label übersetzt oder verändert wurde              │
│  • Algorithmus: Fuzzy-Match mit Threshold 95%                   │
│                                                                 │
│  CHECK 3: Szenarien-Vollständigkeit                             │
│  ──────────────────────────────────                             │
│  • Parse Quelldatei nach Spaltenheadern                         │
│  • Erkenne IST/FC/BUD/PY/Actual/Budget/Forecast Varianten       │
│  • Vergleiche mit erkannten Szenarien im Output                 │
│  • FAIL wenn: Szenario in Quelle aber nicht im Output           │
│                                                                 │
│  CHECK 4: Perioden-Vollständigkeit                              │
│  ─────────────────────────────────                              │
│  • Erkenne Zeitperioden in Quelldatei (Jan-Dez, Q1-Q4, etc.)   │
│  • Vergleiche mit timeRange.periods im Output                   │
│  • FAIL wenn: Periode fehlt oder falsch benannt                 │
│                                                                 │
│  CHECK 5: Datenwert-Stichprobe                                  │
│  ────────────────────────────                                   │
│  • Wähle 5 zufällige Werte aus Quelldatei                       │
│  • Suche diese Werte in extractedData                           │
│  • FAIL wenn: Wert nicht gefunden oder verändert                │
│                                                                 │
│  CHECK 6: Report-Typ-Plausibilität                              │
│  ─────────────────────────────────                              │
│  • Dateiname enthält "GuV/PL" → reportType muss P&L sein       │
│  • Dateiname enthält "Bilanz/Balance" → balance-sheet           │
│  • Dateiname enthält "Cashflow" → cashflow                      │
│  • FAIL wenn: Mismatch zwischen Dateiname und reportType        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: PROMPT 2 - VARIANT GENERATOR                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TEST-SETUP:                                                    │
│  • Input: analysisResult + chartType (3x pro Datei)             │
│  • Output: variants.json pro Datei/ChartType-Kombination        │
│                                                                 │
│  TEST-MATRIX:                                                   │
│  • 50 Dateien × 3 Chart-Typen = 150 Test-Kombinationen         │
│  • Nicht alle Kombinationen sinnvoll → erwartete Ablehnung     │
│                                                                 │
│  VALIDIERUNGSKRITERIEN:                                         │
│  ☐ Anzahl Varianten sinnvoll (1-10)?                           │
│  ☐ Jede Variante hat eindeutigen Mehrwert?                     │
│  ☐ Keine Duplikate oder quasi-identische Varianten?            │
│  ☐ Template-IDs existieren in Bibliothek?                      │
│  ☐ dataFilter ist valide (existierende Szenarien/Perioden)?    │
│  ☐ Bei unpassenden Daten: sinnvolle Ablehnung?                 │
│                                                                 │
│  VARIANTEN-ANZAHL:                                              │
│  • Minimum: 1 (wenn nur eine sinnvolle Darstellung möglich)    │
│  • Maximum: 10                                                  │
│  • Es müssen NICHT immer 3+ sein!                              │
│  • Qualität vor Quantität                                      │
│                                                                 │
│  OUTPUT-ORDNER:                                                 │
│  /test-results/phase2-variants/                                 │
│  ├── 01_GuV_Monatssicht_waterfall_variants.json                │
│  ├── 01_GuV_Monatssicht_bar_variants.json                      │
│  ├── 01_GuV_Monatssicht_stacked_variants.json                  │
│  └── ... (bis zu 150 Dateien)                                  │
│                                                                 │
│  ERFOLGS-METRIK:                                                │
│  • 0% Duplikate innerhalb einer Varianten-Liste                │
│  • 100% valide Template-IDs                                     │
│  • 100% valide dataFilter (nur existierende Daten referenziert)│
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  AUTOMATISCHE VALIDIERUNGS-CHECKS (Phase 2)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CHECK 1: Template-ID-Validierung                               │
│  ────────────────────────────────                               │
│  • Lade TEMPLATE-LIBRARY.json                                   │
│  • Prüfe: Jede templateId existiert in Bibliothek              │
│  • FAIL wenn: Unbekannte Template-ID verwendet                  │
│                                                                 │
│  CHECK 2: Duplikat-Erkennung                                    │
│  ───────────────────────────                                    │
│  • Vergleiche alle Varianten paarweise                          │
│  • Prüfe: templateId + dataFilter Kombination                   │
│  • FAIL wenn: Zwei Varianten haben identische Kombination       │
│                                                                 │
│  CHECK 3: dataFilter-Validierung                                │
│  ───────────────────────────────                                │
│  • Lade analysisResult aus Phase 1                              │
│  • Prüfe: Referenzierte Szenarien existieren                    │
│  • Prüfe: Referenzierte Perioden existieren                     │
│  • FAIL wenn: dataFilter referenziert nicht-existente Daten     │
│                                                                 │
│  CHECK 4: Varianten-Anzahl                                      │
│  ─────────────────────────                                      │
│  • Prüfe: 1 ≤ Anzahl ≤ 10                                      │
│  • WARN wenn: 0 Varianten (sollte begründet sein)              │
│  • FAIL wenn: > 10 Varianten                                    │
│                                                                 │
│  CHECK 5: Mehrwert-Differenzierung (semi-automatisch)           │
│  ────────────────────────────────────────────────────           │
│  • Extrahiere "uniqueValue" aus jeder Variante                  │
│  • Prüfe: Alle uniqueValue-Texte sind unterschiedlich           │
│  • WARN wenn: Ähnliche uniqueValue-Beschreibungen               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  PHASE 3: PROMPT 3 - CONFIG GENERATOR                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TEST-SETUP:                                                    │
│  • Input: variant + extractedData + colorScheme                 │
│  • Output: chartConfig.json pro Variante                        │
│                                                                 │
│  VOLLSTÄNDIGER TEST:                                            │
│  • JEDE Variante aus Phase 2 bekommt eine Config                │
│  • Keine Stichproben - alle Varianten werden getestet           │
│  • Geschätzt: 50 Dateien × 3 ChartTypes × ~5 Varianten          │
│    = ca. 750 Configs                                            │
│                                                                 │
│  VALIDIERUNGSKRITERIEN:                                         │
│  ☐ JSON-Schema valide?                                          │
│  ☐ Alle Pflichtfelder vorhanden?                               │
│  ☐ Datenwerte korrekt aus Quelldaten übernommen?               │
│  ☐ Labels EXAKT wie in Quelldaten (Spracherhaltung)?           │
│  ☐ Farben aus colorScheme korrekt angewendet?                  │
│  ☐ Achsen-Skalierung sinnvoll?                                 │
│  ☐ Keine NULL/undefined Werte wo Zahlen erwartet?              │
│                                                                 │
│  OUTPUT-ORDNER:                                                 │
│  /test-results/phase3-configs/                                  │
│  ├── 01_GuV_waterfall_v1_config.json                           │
│  ├── 01_GuV_waterfall_v2_config.json                           │
│  └── ... (alle Varianten-Configs)                              │
│                                                                 │
│  ERFOLGS-METRIK:                                                │
│  • 100% valide JSON-Schemas                                     │
│  • 100% Spracherhaltung bei Labels                              │
│  • 100% korrekte Datenwerte                                     │
│  • 100% korrekte Farbzuweisung                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  AUTOMATISCHE VALIDIERUNGS-CHECKS (Phase 3)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CHECK 1: JSON-Schema-Validierung                               │
│  ────────────────────────────────                               │
│  • Pflichtfelder: type, title, data[], axes, styling            │
│  • data[].label, data[].value, data[].type, data[].color        │
│  • FAIL wenn: Pflichtfeld fehlt oder falscher Typ               │
│                                                                 │
│  CHECK 2: Spracherhaltung (Labels)                              │
│  ─────────────────────────────────                              │
│  • Extrahiere alle data[].label aus Config                      │
│  • Vergleiche mit Original-Labels aus Quelldatei                │
│  • FAIL wenn: Label übersetzt oder verändert                    │
│                                                                 │
│  CHECK 3: Datenwert-Validierung                                 │
│  ──────────────────────────────                                 │
│  • Für jeden data[].value:                                      │
│    - Suche korrespondierenden Wert in Quelldatei                │
│    - Prüfe: Wert ist identisch (Toleranz: 0.01 für Rundung)    │
│  • FAIL wenn: Wert nicht in Quelldatei gefunden                 │
│  • FAIL wenn: Wert abweicht (außerhalb Toleranz)               │
│                                                                 │
│  CHECK 4: Farb-Validierung                                      │
│  ─────────────────────────                                      │
│  • Lade verwendetes colorScheme                                 │
│  • Prüfe: Jede data[].color kommt aus colorScheme              │
│  • FAIL wenn: Farbe nicht im Schema definiert                   │
│                                                                 │
│  CHECK 5: Typ-Konsistenz                                        │
│  ────────────────────────                                       │
│  • Waterfall: data[].type muss start/increase/decrease/end sein│
│  • Bar: data[].type muss category/value sein                   │
│  • Stacked: data[].type muss stack/segment sein                │
│  • FAIL wenn: Falscher Typ für Chart-Art                        │
│                                                                 │
│  CHECK 6: Mathematische Konsistenz (Waterfall)                  │
│  ─────────────────────────────────────────────                  │
│  • Bei Waterfall: Start + Deltas = End                          │
│  • Berechne Summe aller Werte                                   │
│  • FAIL wenn: Summe ≠ End-Wert (Toleranz: 1%)                  │
│                                                                 │
│  CHECK 7: Keine leeren/null Werte                               │
│  ────────────────────────────────                               │
│  • Prüfe: Kein data[].value ist null/undefined/NaN             │
│  • Prüfe: Kein data[].label ist leer                           │
│  • FAIL wenn: Leere oder ungültige Werte gefunden               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  PHASE 4: PROMPT 4 - SVG RENDERER (oder deterministisch)        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ENTSCHEIDUNG VORAB:                                            │
│  → Option A: LLM rendert SVG (flexibel, aber variabel)         │
│  → Option B: Deterministische Engine (D3.js/Chart.js)          │
│  → Empfehlung: Option B für Konsistenz                         │
│                                                                 │
│  Falls Option A (LLM):                                          │
│  TEST-SETUP:                                                    │
│  • Input: chartConfig.json                                      │
│  • Output: chart.svg                                            │
│                                                                 │
│  VALIDIERUNGSKRITERIEN:                                         │
│  ☐ SVG valide und renderbar?                                   │
│  ☐ Alle Datenpunkte sichtbar?                                  │
│  ☐ Labels lesbar und korrekt positioniert?                     │
│  ☐ Farben wie in Config?                                       │
│  ☐ Skalierung korrekt?                                         │
│                                                                 │
│  Falls Option B (Deterministisch):                              │
│  • Kein Prompt-Test nötig                                       │
│  • Stattdessen: Unit-Tests für Rendering-Engine                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Validierungs-Report & Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│  AUTOMATISCHES VALIDIERUNGS-REPORTING                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Nach jedem Test-Lauf wird ein Report generiert:                │
│                                                                 │
│  validation-summary.json                                        │
│  {                                                              │
│    "timestamp": "2026-01-26T15:30:00Z",                        │
│    "phase": 1,                                                  │
│    "promptVersion": "1.0.3",                                   │
│    "totalTests": 50,                                           │
│    "passed": 48,                                                │
│    "failed": 2,                                                 │
│    "passRate": 96.0,                                           │
│    "checks": {                                                  │
│      "jsonSchema": { "passed": 50, "failed": 0 },              │
│      "languagePreservation": { "passed": 50, "failed": 0 },    │
│      "scenarioDetection": { "passed": 48, "failed": 2 },       │
│      "periodExtraction": { "passed": 49, "failed": 1 },        │
│      "reportTypeMatch": { "passed": 50, "failed": 0 }          │
│    },                                                           │
│    "failures": [                                                │
│      {                                                          │
│        "file": "49_Sparse_Data_with_Gaps.csv",                 │
│        "check": "scenarioDetection",                           │
│        "expected": ["IST", "FC"],                              │
│        "actual": ["IST"],                                      │
│        "message": "FC-Szenario nicht erkannt"                  │
│      }                                                          │
│    ]                                                            │
│  }                                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  VALIDIERUNGS-DASHBOARD (in prompt-validator.html)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  GESAMTÜBERSICHT                                        │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                         │   │
│  │  Phase 1: Universal Analyzer                            │   │
│  │  ████████████████████████████████████████░░  96% (48/50)│   │
│  │                                                         │   │
│  │  Phase 2: Variant Generator                             │   │
│  │  ██████████████████████████████████████████  100% (150) │   │
│  │                                                         │   │
│  │  Phase 3: Config Generator                              │   │
│  │  ████████████████████████████████████████░░  98% (735)  │   │
│  │                                                         │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │                                                         │   │
│  │  CHECK-DETAILS (Phase 1):                               │   │
│  │                                                         │   │
│  │  ✓ JSON-Schema............... 50/50  [████████████] 100%│   │
│  │  ✓ Spracherhaltung........... 50/50  [████████████] 100%│   │
│  │  ✗ Szenarien-Erkennung....... 48/50  [██████████░░]  96%│   │
│  │  ✓ Perioden-Extraktion....... 50/50  [████████████] 100%│   │
│  │  ✓ Report-Typ................ 50/50  [████████████] 100%│   │
│  │  ✓ Datenwert-Stichprobe...... 50/50  [████████████] 100%│   │
│  │                                                         │   │
│  │  ─────────────────────────────────────────────────────  │   │
│  │                                                         │   │
│  │  FEHLGESCHLAGENE TESTS:                                 │   │
│  │                                                         │   │
│  │  [!] 49_Sparse_Data_with_Gaps.csv                      │   │
│  │      Check: scenarioDetection                          │   │
│  │      Erwartet: IST, FC                                 │   │
│  │      Erhalten: IST                                     │   │
│  │      [Details anzeigen]                                │   │
│  │                                                         │   │
│  │  [!] 50_Multi_Currency_Report.xlsx                     │   │
│  │      Check: currencyDetection                          │   │
│  │      Erwartet: EUR, USD, CHF                           │   │
│  │      Erhalten: EUR                                     │   │
│  │      [Details anzeigen]                                │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  AKTIONEN:                                                      │
│  [Alle Tests erneut ausführen]                                 │
│  [Nur fehlgeschlagene erneut testen]                           │
│  [Report exportieren (JSON)]                                   │
│  [Report exportieren (CSV)]                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### End-to-End Validierung

```
┌─────────────────────────────────────────────────────────────────┐
│  END-TO-END PIPELINE-TEST                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ZWECK:                                                         │
│  Teste die komplette Pipeline für ausgewählte Dateien           │
│                                                                 │
│  ABLAUF:                                                        │
│  Testdatei → Prompt 1 → Prompt 2 → Prompt 3 → Chart-Preview    │
│                                                                 │
│  TEST-AUSWAHL (10 repräsentative Dateien):                     │
│  1.  01_GuV_Monatssicht_IST_FC_BUD.xlsx    (Standard P&L)      │
│  2.  09_Bilanz_Jahresvergleich.xlsx        (Bilanz)            │
│  3.  15_Cashflow_Statement_Annual.xlsx     (Cashflow)          │
│  4.  20_Segment_Revenue_by_Region.xlsx     (Segmente)          │
│  5.  29_Revenue_by_Customer_Top20.csv      (Ranking)           │
│  6.  33_OpEx_Breakdown_Monthly.xlsx        (Kosten)            │
│  7.  42_EBITDA_Bridge_PY_to_CY.xlsx        (Bridge)            │
│  8.  44_KPI_Dashboard_Monthly.xlsx         (KPIs)              │
│  9.  47_Financials_Long_Format.csv         (Long-Format)       │
│  10. 50_Multi_Currency_Report.xlsx         (Multi-Währung)     │
│                                                                 │
│  FÜR JEDE DATEI:                                                │
│  • Alle 3 Chart-Typen testen (Waterfall, Bar, Stacked)         │
│  • Alle generierten Varianten bis zur Config führen             │
│  • Chart-Preview rendern (mit deterministischer Engine)         │
│  • Manuelle visuelle Prüfung                                    │
│                                                                 │
│  VALIDIERUNGSKRITERIEN (E2E):                                   │
│  ☐ Pipeline läuft ohne Fehler durch?                           │
│  ☐ Charts sind visuell korrekt?                                │
│  ☐ Labels lesbar und korrekt?                                  │
│  ☐ Datenwerte stimmen mit Quelle überein?                      │
│  ☐ Farben wie erwartet?                                        │
│  ☐ Keine visuellen Artefakte?                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Test-HTML-Seite: prompt-validator.html

```
┌─────────────────────────────────────────────────────────────────┐
│  TEST-VALIDATOR UI                                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ZWECK:                                                         │
│  Visuelle Validierung der Prompt-Outputs vor Implementierung    │
│                                                                 │
│  ───────────────────────────────────────────────────────────    │
│                                                                 │
│  LAYOUT:                                                        │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  PROMPT VALIDATOR                                       │   │
│  ├─────────────────────────────────────────────────────────┤   │
│  │                                                         │   │
│  │  [Datei wählen ▼]  [Phase wählen ▼]  [Test starten]    │   │
│  │                                                         │   │
│  │  ┌───────────────────┬─────────────────────────────┐   │   │
│  │  │                   │                             │   │   │
│  │  │  INPUT            │  OUTPUT                     │   │   │
│  │  │  (Quelldaten)     │  (Prompt-Ergebnis)          │   │   │
│  │  │                   │                             │   │   │
│  │  │  Datei: 01_GuV... │  Report-Typ: P&L ✓          │   │   │
│  │  │                   │  Struktur: Matrix ✓         │   │   │
│  │  │  [Rohdaten        │  Währung: EUR ✓             │   │   │
│  │  │   anzeigen]       │  Szenarien: IST,FC,BUD ✓    │   │   │
│  │  │                   │                             │   │   │
│  │  │                   │  [JSON anzeigen]            │   │   │
│  │  │                   │                             │   │   │
│  │  └───────────────────┴─────────────────────────────┘   │   │
│  │                                                         │   │
│  │  ┌─────────────────────────────────────────────────┐   │   │
│  │  │  VALIDIERUNG                                    │   │   │
│  │  │                                                 │   │   │
│  │  │  ☑ Report-Typ korrekt                          │   │   │
│  │  │  ☑ Spracherhaltung OK                          │   │   │
│  │  │  ☐ Hierarchie erkannt (manuell prüfen)         │   │   │
│  │  │  ☑ Chart-Empfehlung sinnvoll                   │   │   │
│  │  │                                                 │   │   │
│  │  │  Kommentar: ______________________________     │   │   │
│  │  │                                                 │   │   │
│  │  │  [✓ Bestanden]  [✗ Fehlgeschlagen]  [Weiter →] │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ───────────────────────────────────────────────────────────    │
│                                                                 │
│  FEATURES:                                                      │
│  • Datei-Auswahl aus 50 Testdateien                            │
│  • Phase 1-4 einzeln testbar                                    │
│  • Seite-an-Seite: Input vs. Output                            │
│  • Checkbox-Validierung für Kriterien                          │
│  • Kommentarfeld für Notizen                                   │
│  • Export der Testergebnisse als JSON                          │
│                                                                 │
│  ───────────────────────────────────────────────────────────    │
│                                                                 │
│  TECHNISCH:                                                     │
│  • Standalone HTML (kein Backend nötig für Anzeige)            │
│  • API-Key-Eingabe für Live-Tests                              │
│  • Offline-Modus: Lädt gespeicherte JSON-Ergebnisse            │
│  • Fortschritts-Tracking über alle 50 Dateien                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Test-Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│  ITERATIVER TEST-WORKFLOW                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SCHRITT 1: Prompt schreiben                                    │
│  ─────────────────────────────                                  │
│  • Prompt 1 (Universal Analyzer) als Markdown erstellen         │
│  • In /Prompt/ Ordner speichern                                 │
│                                                                 │
│  SCHRITT 2: Batch-Test                                          │
│  ─────────────────────────                                      │
│  • Script: test-prompt.js (oder Python)                         │
│  • Führt Prompt gegen alle 50 Dateien aus                       │
│  • Speichert Ergebnisse in /test-results/                       │
│                                                                 │
│  SCHRITT 3: Visuelle Validierung                                │
│  ───────────────────────────────                                │
│  • prompt-validator.html öffnen                                 │
│  • Jedes Ergebnis manuell prüfen                                │
│  • Bestanden/Fehlgeschlagen markieren                           │
│                                                                 │
│  SCHRITT 4: Prompt iterieren                                    │
│  ──────────────────────────                                     │
│  • Fehler analysieren                                           │
│  • Prompt anpassen                                              │
│  • Zurück zu Schritt 2                                          │
│                                                                 │
│  SCHRITT 5: Phase abschließen                                   │
│  ───────────────────────────                                    │
│  • ≥90% Erfolgsquote erreicht                                  │
│  • Prompt als "stabil" markieren                                │
│  • Weiter zur nächsten Phase                                    │
│                                                                 │
│  ───────────────────────────────────────────────────────────    │
│                                                                 │
│  ZEITPLAN (geschätzt):                                          │
│                                                                 │
│  Phase 1 (Analyzer):    2-3 Iterationen → ~2 Tage              │
│  Phase 2 (Variants):    3-4 Iterationen → ~3 Tage              │
│  Phase 3 (Config):      2-3 Iterationen → ~2 Tage              │
│  Phase 4 (Renderer):    1-2 Iterationen → ~1 Tag               │
│                                                                 │
│  GESAMT: ~8-10 Tage für stabile Prompt-Engine                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Dateistruktur für Tests

```
/Testfiles/
├── Prompt/
│   ├── ARCHITEKTUR-FINALE-V2.md
│   ├── PROMPT-1-UNIVERSAL-ANALYZER.md      ← zu erstellen
│   ├── PROMPT-2-VARIANT-GENERATOR.md       ← zu erstellen
│   ├── PROMPT-3-CONFIG-GENERATOR.md        ← zu erstellen
│   ├── PROMPT-4-SVG-RENDERER.md            ← optional
│   └── TEMPLATE-LIBRARY.json               ← zu erstellen
│
├── test-results/
│   ├── phase1-analyzer/
│   │   ├── 01_analysis.json
│   │   └── ...
│   ├── phase2-variants/
│   │   ├── 01_waterfall_variants.json
│   │   └── ...
│   ├── phase3-configs/
│   │   ├── 01_waterfall_v1_config.json
│   │   └── ...
│   └── validation-summary.json             ← Gesamtübersicht
│
├── test-tools/
│   ├── prompt-validator.html               ← Validierungs-UI
│   ├── test-runner.js                      ← Batch-Test-Script
│   └── schema-validator.js                 ← JSON-Schema-Prüfung
│
└── 01_GuV_Monatssicht_IST_FC_BUD.xlsx
└── ... (50 Testdateien)
```

---

## Zusammenfassung

```
┌─────────────────────────────────────────────────────────────────┐
│  GESAMTÜBERSICHT                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  SEITEN:                                                        │
│  • upload.html    → Datei hochladen                            │
│  • results.html   → Analyse sehen, Chart-Typ wählen            │
│  • colors.html    → Farbschema wählen, Generation starten      │
│  • charts.html    → 3-10 fertige Charts anzeigen               │
│                                                                 │
│  PROMPTS:                                                       │
│  • Prompt 1: Universal Analyzer    (in upload.html)            │
│  • Prompt 2: Variant Generator     (in colors.html)            │
│  • Prompt 3: Config Generator      (in colors.html, pro Var.)  │
│  • Prompt 4: SVG Renderer          (in charts.html, pro Conf.) │
│                                                                 │
│  TEMPLATE-BIBLIOTHEK:                                           │
│  • ~24 vordefinierte Templates als Baukasten                   │
│  • KI wählt, passt an, kombiniert                              │
│  • Fallback: KI generiert frei                                 │
│                                                                 │
│  CHART-VARIANTEN:                                               │
│  • 3-10 unterschiedliche Charts                                │
│  • Jeder mit eigenem Mehrwert                                  │
│  • Keine Duplikate                                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

*Architektur-Dokument Version 2.0*
*Mit Integration der bestehenden HTML-Seiten*
*Erstellt: 2026-01-26*
