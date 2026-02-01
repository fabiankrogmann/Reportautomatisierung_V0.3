# KONZEPT: KI-gestützte Finanzvisualisierung

**Automatisierte Chart-Generierung für Finanzreports**
Waterfall | Stacked Bar | Bar Chart

Version 3.0 | Januar 2026 (Konsolidierte Prompt-Pipeline)

---

## 1. Executive Summary

Dieses System automatisiert die Visualisierung von Finanzdaten durch KI-gestützte Chart-Generierung. Es kombiniert eine statische Template-Bibliothek mit dynamischer KI-Anpassung und erzeugt für jeden Finanzreport optimale Chart-Darstellungen.

### Workflow

Das System folgt einem 4-Seiten-Workflow:

```
upload.html → results.html → colors.html → charts.html
     │              │              │              │
     │              │              │              └── Chart-Generierung + Export
     │              │              └── Farbschema wählen (optional)
     │              └── Analyse anzeigen, Chart-Typ wählen
     └── Datei hochladen, KI analysiert
```

### Kernkomponenten

| Komponente | Funktion |
|------------|----------|
| **Template-Bibliothek** | 40 vordefinierte Layout-Templates (JSON, inkl. Feature-Metadaten) |
| **Prompt-System** | 2 KI-Prompts (Analyse + Varianten) + deterministische Config-Generierung |
| **VariantGenerator** | Erzeugt 3-10 Chart-Varianten pro Typ |
| **DeterministicConfigGenerator** | Erzeugt Chart-Konfigurationen deterministisch (JavaScript) |
| **JS-Rendering-Engine** | Generiert SVG via `renderWaterfallChart()`, `renderBarChart()`, `renderStackedBarChart()` |
| **Export-Engine** | SVG, PNG, PPTX, HTML, ZIP |

### Kernprinzip: KI-Empfehlung + User-Auswahl

Das System zeigt dem User eine KI-Empfehlung für den optimalen Chart-Typ, aber der User MUSS explizit einen Typ wählen. Das System generiert 3-10 sinnvolle Varianten des gewählten Typs. Der User wählt per Checkbox welche Charts exportiert werden.

**Workflow:**
1. KI analysiert Daten und empfiehlt Chart-Typ
2. User wählt Chart-Typ (Waterfall, Bar, Stacked Bar)
3. System generiert 3-10 unterschiedliche Varianten
4. User wählt per Checkbox welche Charts exportiert werden

Charts mit identischem Fingerprint werden automatisch übersprungen.

### Chart-Typen

Nur 3 Chart-Typen sind implementiert (bewusst limitiert):

| Typ | Einsatz |
|-----|---------|
| **Waterfall** | Bridge Charts, P&L-Strukturen, Varianzanalysen |
| **Bar Chart** | Vergleiche, Rankings, Trends |
| **Stacked Bar** | Zusammensetzungen, Kostenstrukturen |

---

## 2. Systemarchitektur

### 2.1 Workflow-Übersicht

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (HTML)                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────┐    ┌────────────┐    ┌────────────┐    ┌──────────┐ │
│  │  upload    │───▶│  results   │───▶│   colors   │───▶│  charts  │ │
│  │   .html    │    │   .html    │    │   .html    │    │   .html  │ │
│  └────────────┘    └────────────┘    └────────────┘    └──────────┘ │
│        │                 │                 │                 │      │
│        ▼                 ▼                 ▼                 ▼      │
│   ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌───────────┐ │
│   │ Datei-  │      │ Analyse │      │ Farb-   │      │ Chart-    │ │
│   │ Upload  │      │ anzeigen│      │ schema  │      │ Rendering │ │
│   │ + Parse │      │ + Auswahl│     │ wählen  │      │ + Export  │ │
│   └─────────┘      └─────────┘      └─────────┘      └───────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼ sessionStorage
┌─────────────────────────────────────────────────────────────────────┐
│                      DATENFLUSS                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  analysisResult ──────────────────────────────────────────────────▶ │
│  {fileName, csvData, detectedLanguage, result: {...}}               │
│                                                                      │
│  companyColors ───────────────────────────────────────────────────▶ │
│  {colors: [...], scheme: "businessNeutral"}                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKEND-KOMPONENTEN (charts.html)                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ PromptLoader │  │TemplateLoader│  │  APIClient   │              │
│  │              │  │              │  │              │              │
│  │ Lädt .md     │  │ Lädt 30      │  │ Anthropic/   │              │
│  │ Prompts      │  │ Templates    │  │ OpenAI       │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│         │                 │                 │                       │
│         └─────────────────┼─────────────────┘                       │
│                           ▼                                         │
│  ┌──────────────┐  ┌──────────────────────┐  ┌──────────────┐     │
│  │ Variant      │  │ Deterministic        │  │ JS-Rendering │     │
│  │ Generator    │  │ ConfigGenerator (JS) │  │ Engine (SVG) │     │
│  └──────────────┘  └──────────────────────┘  └──────────────┘     │
│                                                      │              │
│                                                      ▼              │
│                                               ┌──────────────┐     │
│                                               │ Export-Engine│     │
│                                               │ SVG/PNG/PPTX │     │
│                                               └──────────────┘     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Komponenten-Übersicht

| Komponente | Aufgabe | Typ |
|------------|---------|-----|
| **PromptLoader** | Lädt Prompts aus .md-Dateien (Single Source of Truth) | Statisch |
| **TemplateLoader** | Verwaltet 40 Chart-Templates | Statisch |
| **VariantGenerator** | Erzeugt 3-10 unterschiedliche Chart-Varianten | KI |
| **APIClient** | Zentrale API-Integration (Anthropic/OpenAI) | Integration |
| **DeterministicConfigGenerator** | Generiert Chart-Konfigurationen deterministisch | JavaScript |
| **JS-Rendering-Engine** | Generiert SVG (`renderWaterfallChart`, `renderBarChart`, `renderStackedBarChart`) | JavaScript |
| **Export-Engine** | Exportiert in verschiedene Formate | Export |

### 2.3 Seiten-Funktionen

#### upload.html
- Datei-Upload (CSV, Excel)
- API-Key-Validierung
- Datenvorschau (max. 15 Zeilen)
- Erste KI-Analyse der Datenstruktur (PROMPT-1)
- Sprach-Erkennung (DE/EN)

#### results.html
- Zeigt Analyseergebnisse an
- Chart-Typ-Auswahl (User wählt explizit)
- Datenqualitäts-Score (0-10)
- Editierbare Metadaten (Unit, Zeitraum)

#### colors.html
- 6 vordefinierte Farbschemas
- Custom-Farben möglich (6 Hex-Werte)
- Live-Vorschau der Palette
- Persistenz via localStorage

#### charts.html
- Chart-Generierung: PROMPT-2 (KI-Varianten) + DeterministicConfigGenerator + JS-Renderer
- SVG wird von der JS-Rendering-Engine generiert (kein API-Call nötig)
- Interaktive Tooltips
- Multi-Format-Export

---

## 3. Template-Bibliothek

Die Bibliothek umfasst 40 Templates in `6. Bibliotheken/templates.json`, verteilt auf drei Chart-Typen.

### 3.1 Verteilung nach Chart-Typ

| Chart-Typ | Anzahl | Fokus |
|-----------|--------|-------|
| Waterfall | 19 | Bridges, Strukturen, Varianzen, Layout-Varianten |
| Stacked Bar | 10 | Zusammensetzungen, Trends, Monthly |
| Bar Chart | 10 | Vergleiche, Rankings |
| **Gesamt** | **40** | |

### 3.2 Perspektiven-Matrix

Jedes Template ist einer Perspektive zugeordnet, die eine spezifische Frage beantwortet:

| Perspektive | Frage | Primärer Chart-Typ |
|-------------|-------|-------------------|
| **Structure** | Wie setzt sich das Ergebnis zusammen? | Waterfall |
| **Variance** | Wo weichen wir vom Plan ab? | Waterfall, Bar |
| **Comparison** | Wie stehen Perioden/Kategorien zueinander? | Bar (grouped) |
| **Composition** | Wie verteilen sich die Anteile? | Stacked Bar |
| **Trend** | Wie entwickelt sich der Wert über Zeit? | Bar, Stacked Bar |
| **Ranking** | Was sind die größten Treiber? | Bar (horizontal) |

### 3.3 Waterfall Templates (19)

| Kurz-ID | Name | Perspektive | Beschreibung |
|---------|------|-------------|--------------|
| WF-01 | pnl_waterfall_summary | Structure | Executive Summary, 5-7 Items |
| WF-02 | pnl_waterfall_detail | Structure | Alle Zeilen, 10-18 Items |
| WF-03 | pnl_waterfall_yoy_bridge | Variance | Prior Year → Current Year |
| WF-04 | pnl_waterfall_budget_bridge | Variance | Budget → Actual |
| WF-05 | pnl_waterfall_horizontal | Structure | Horizontale Darstellung |
| WF-06 | cashflow_waterfall | Structure | Operating → Investing → Financing |
| WF-07 | margin_bridge | Structure | Gross Margin → Net Margin |
| WF-08 | cost_variance_waterfall | Variance | Kostenabweichungen |
| WF-09 | revenue_bridge | Variance | Revenue-Veränderung |
| WF-10 | segment_pnl_waterfall | Structure | Nach Geschäftssegmenten |
| WF-11 | quarterly_bridge | Trend | Q1 → Q2 → Q3 → Q4 |
| WF-12 | forecast_variance_bridge | Variance | Forecast → Actual |
| WF-13 | monthly_bridge | Trend | M1 → M12 Monatsbrücke |
| WF-14 | budget_bridge_compare_right | Variance | Budget Bridge + FC rechts |
| WF-15 | budget_bridge_compare_left | Variance | Budget Bridge + FC links |
| WF-16 | yoy_bridge_compare_right | Variance | YoY Bridge + BUD/FC rechts |
| WF-17 | yoy_bridge_compare_left | Variance | YoY Bridge + BUD/FC links |
| WF-18 | fc_bridge_compare_right | Variance | FC Bridge + BUD rechts |
| WF-19 | fc_bridge_compare_left | Variance | FC Bridge + BUD links |

**Layout-Varianten (WF-14 bis WF-19):** Diese Templates zeigen zusätzliche Szenario-Werte als schmale Vergleichsbalken neben den Haupt-Bridge-Bars. Position "rechts" oder "links" bestimmt wo die Compare-Bars erscheinen.

### 3.4 Stacked Bar Templates (10)

| Kurz-ID | Name | Perspektive | Beschreibung |
|---------|------|-------------|--------------|
| SB-01 | cost_structure_absolute | Composition | Kosten absolut |
| SB-02 | cost_structure_percent | Composition | Kosten 100%-gestapelt |
| SB-03 | revenue_mix_trend_absolute | Trend | Revenue über Zeit (absolut, 3-12 Perioden) |
| SB-04 | revenue_mix_trend_percent | Trend | Revenue über Zeit (100%) |
| SB-05 | segment_comparison_stacked | Comparison | Segmente nebeneinander |
| SB-06 | pnl_components_stacked | Structure | P&L als Stacked Bar |
| SB-07 | horizontal_cost_breakdown | Composition | Horizontal für lange Labels |
| SB-08 | budget_components_stacked | Comparison | Budget-Zusammensetzung |
| SB-09 | monthly_trend_stacked | Trend | 12 Monate gestapelt (absolut) |
| SB-10 | monthly_trend_stacked_percent | Trend | 12 Monate gestapelt (100%) |

### 3.5 Bar Chart Templates (10)

| Kurz-ID | Name | Perspektive | Beschreibung |
|---------|------|-------------|--------------|
| BC-01 | actual_vs_budget | Comparison | 2er Grouped Bar |
| BC-02 | actual_budget_forecast | Comparison | 3er Grouped Bar |
| BC-03 | variance_bar_colored | Variance | Farbcodiert nach Vorzeichen |
| BC-04 | ranking_horizontal | Ranking | Top N, sortiert |
| BC-05 | monthly_trend | Trend | 12 Monate Zeitreihe |
| BC-06 | category_comparison | Comparison | Kategorien vertikal |
| BC-07 | kpi_comparison_horizontal | Comparison | KPIs horizontal |
| BC-08 | yoy_comparison_grouped | Comparison | CY vs PY grouped |
| BC-09 | department_comparison | Comparison | Abteilungen vergleichen |
| BC-10 | quarterly_comparison | Trend | Q1-Q4 nebeneinander |

### 3.6 Template-Struktur (JSON)

Jedes Template folgt diesem Schema:

```json
{
  "template_id": "WF-01",
  "name": "pnl_waterfall_summary",
  "display_name": "P&L Executive Summary",
  "chart_type": "waterfall",

  "metadata": {
    "detail_level": "summary",
    "comparison_type": "single_period",
    "perspective": "structure",
    "target_audience": "executive"
  },

  "structure": {
    "orientation": "vertical",
    "min_items": 5,
    "max_items": 7,
    "item_types": ["start", "negative", "subtotal", "negative", "end"]
  },

  "best_for": ["monthly_business_review", "board_presentation"]
}
```

---

## 4. Prompt-System

Die KI-Prompts sind in `4. Prompts/` als Markdown-Dateien gespeichert und werden zur Laufzeit geladen.

### 4.1 Prompt-Pipeline

Das System verwendet eine 2-stufige KI-Pipeline + deterministische Config-Generierung:

- **PROMPT-1** (upload.html): KI-Datenanalyse — bleibt KI-gestützt
- **PROMPT-2** (charts.html): KI-Varianten-Generierung — bleibt KI-gestützt
- **DeterministicConfigGenerator** (charts.html): Ersetzt PROMPT-3 — reines JavaScript
- **JS-Rendering-Engine** (charts.html): Ersetzt Chart-Prompts — `renderWaterfallChart()`, `renderBarChart()`, `renderStackedBarChart()`

```
┌──────────────────────────────────────────────────────────────────────┐
│   CSV/Excel Upload                                                    │
│        │                                                              │
│        ▼                                                              │
│   ╔═══════════════════════════════╗                                  │
│   ║ PROMPT 1: Universal Analyzer  ║  ← upload.html (KI)              │
│   ╚═══════════════════════════════╝  ← Output: analysis, extractedData│
│        │                                                              │
│        │ User wählt Chart-Typ + Farbschema                           │
│        ▼                                                              │
│   ╔═══════════════════════════════╗                                  │
│   ║ PROMPT 2: Variant Generator   ║  ← charts.html (KI)              │
│   ╚═══════════════════════════════╝  ← Output: variants[]            │
│        │                                                              │
│        ▼                                                              │
│   ┌──────────────────────────────────────────────────────────┐      │
│   │  FÜR JEDE VARIANTE (deterministisch, kein API-Call):      │      │
│   │                                                            │      │
│   │   ┌───────────────────────────────────┐                   │      │
│   │   │ DeterministicConfigGenerator (JS) │                   │      │
│   │   └───────────────────────────────────┘                   │      │
│   │        │  → chartConfig + Features                        │      │
│   │        ▼                                                   │      │
│   │   ┌───────────────────────────────────┐                   │      │
│   │   │ normalizeConfigForRenderer()      │                   │      │
│   │   └───────────────────────────────────┘                   │      │
│   │        │  → Fingerprint-Check → push oder skip            │      │
│   │        ▼                                                   │      │
│   │   ┌───────────────────────────────────┐                   │      │
│   │   │ JS-Rendering-Engine (SVG)         │                   │      │
│   │   └───────────────────────────────────┘                   │      │
│   └──────────────────────────────────────────────────────────┘      │
│        │                                                              │
│        ▼                                                              │
│   Export (ZIP/PPTX)                                                  │
└──────────────────────────────────────────────────────────────────────┘
```

**Einsparung:** ~94.000 Tokens pro Durchlauf (96%) — von 14 API-Calls auf 1.

### 4.2 Prompt-Dateien

| # | Datei | Status | Aufruf | Output |
|---|-------|--------|--------|--------|
| 1 | `PROMPT-1-UNIVERSAL-ANALYZER.md` | **KI (aktiv)** | upload.html | analysisResult |
| 2 | `PROMPT-2-VARIANT-GENERATOR.md` | **KI (aktiv)** | charts.html | variants[] |
| 3 | `archiv/PROMPT-3-CONFIG-GENERATOR (archiviert).md` | **Ersetzt durch `DeterministicConfigGenerator`** | - | chartConfig |
| 4 | `archiv/WATERFALL-CHART-PROMPT (archiviert).md` | **Ersetzt durch JS-Renderer** | - | SVG |
| 5 | `archiv/BAR-CHART-PROMPT (archiviert).md` | **Ersetzt durch JS-Renderer** | - | SVG |
| 6 | `archiv/STACKED-BAR-CHART-PROMPT (archiviert).md` | **Ersetzt durch JS-Renderer** | - | SVG |

**Feature-Dateien (für Waterfall):**
- `Features/Waterfall/_FEATURE-CATALOG.md` – Aktivierungsregeln, Konflikte (Input für `DeterministicConfigGenerator._activateFeatures()`)
- `Features/Waterfall/_TEMPLATE-MATRIX.md` – Feature-Kompatibilität pro Template
- `Features/Waterfall/[FEATURE].md` – 7 Feature-Module (Rendering-Logik, CSS, Edge-Cases)

**Zusätzlich:**
- `COLOR-SCHEMA-PROMPT.md` – für dynamische Farbgenerierung in colors.html

**Archiviert (in `4. Prompts/archiv/`):**
- PROMPT-3-CONFIG-GENERATOR (archiviert).md
- BAR-CHART-PROMPT (archiviert).md
- STACKED-BAR-CHART-PROMPT (archiviert).md
- WATERFALL-CHART-PROMPT (archiviert).md
- DATA-ANALYZER-PROMPT (archiviert).md
- PERSPECTIVE-DERIVATION-PROMPT (archiviert).md
- LAYOUT-RANKING-PROMPT (archiviert).md
- FIELD-MAPPING-PROMPT (archiviert).md

### 4.3 PROMPT 1: Universal Analyzer

Analysiert die hochgeladene Datei und extrahiert alle relevanten Metadaten.

**Output-Struktur:**
```json
{
  "analysis": {
    "reportType": "income-statement",
    "dataFormat": "matrix-complex",
    "currency": "EUR",
    "unit": "TEUR",
    "timeRange": { "periods": [...], "year": "2025" },
    "scenarios": ["IST", "FC", "BUD"],
    "hierarchy": { "detected": true, "levels": [...] }
  },
  "extractedData": {
    "normalized": [...],
    "positions": { "start": [...], "costs": [...], ... }
  },
  "chartRecommendation": {
    "primary": "waterfall",
    "alternatives": ["bar", "stacked-bar"],
    "reasoning": "GuV-Struktur mit Überleitung..."
  }
}
```

### 4.4 PROMPT 2: Variant Generator

Kombiniert die frühere PERSPECTIVE-DERIVATION und LAYOUT-RANKING Logik.

**Input:**
- analysisResult (von Prompt 1)
- selectedChartType ("waterfall" | "bar" | "stacked-bar")
- templateLibrary (alle verfügbaren Templates)

**Output-Struktur:**
```json
{
  "variants": [
    {
      "id": 1,
      "templateId": "WF-01",
      "title": "GuV Gesamtjahr 2025",
      "subtitle": "Überleitung Umsatz zu Ergebnis",
      "focus": "annual-total",
      "dataFilter": { "scenario": "IST", "period": "all" },
      "uniqueValue": "Gesamtbild der Ertragslage"
    }
  ],
  "variantCount": 6,
  "notGeneratedReasons": ["Keine VJ-Daten", "Nur ein Segment"]
}
```

### 4.5 DeterministicConfigGenerator (ersetzt PROMPT-3)

Erzeugt die vollständige, render-fertige Chart-Konfiguration **deterministisch in JavaScript** — kein API-Call nötig.

**Input (JavaScript-Objekt):**
- variant (von Prompt 2)
- extractedData (von Prompt 1)
- templateDefinition (aus Bibliothek)
- colorScheme (User-Auswahl)

**Methoden:**
- `generate(variant, extractedData, template, colorScheme)` — Haupteinstieg
- `_generateWaterfallConfig()` / `_generateBarConfig()` / `_generateStackedBarConfig()`
- `_activateFeatures()` — prüft Regeln aus `_FEATURE-CATALOG.md` deterministisch

**Output-Struktur (identisch zum früheren PROMPT-3):**
```json
{
  "chartConfig": {
    "type": "waterfall",
    "title": "...",
    "subtitle": "...",
    "data": [
      { "label": "Umsatzerlöse", "value": 2195000, "type": "start", "color": "#4472C4" }
    ],
    "features": {
      "bracket": { "enabled": true, "mode": "budget", "label": "+9.8% vs. Budget", "_reason": "Budget und Actual vorhanden" },
      "scaleBreak": { "enabled": false, "_reason": "Ratio 2.1 < 3" }
    },
    "axes": { "y": { "label": "TEUR", "min": 0 } },
    "styling": { "barWidth": 0.6, "connectorLine": true }
  }
}
```

**Hinweis:** Feature-Aktivierung nur für Waterfall-Charts. Bar Chart und Stacked Bar: noch nicht implementiert.

### 4.6 JS-Rendering-Engine (ersetzt Chart-Prompts)

Die JS-Rendering-Engine generiert SVG **deterministisch in JavaScript** — kein API-Call nötig.

**Renderer-Funktionen:**
- `renderWaterfallChart(config)` — Waterfall/Bridge Charts
- `renderBarChart(config)` — Bar Charts (grouped, horizontal, vertical)
- `renderStackedBarChart(config)` — Stacked Bar Charts

**Features werden in modularen Feature-Dateien dokumentiert:**

| Feature | ID | Modul | Kategorie |
|---------|-----|-------|-----------|
| Bracket (Prozentänderung) | `bracket` | `Features/Waterfall/BRACKET.md` | annotation |
| Scale-Break (Skalenbruch) | `scaleBreak` | `Features/Waterfall/SCALE-BREAK.md` | layout |
| Category-Brackets | `categoryBrackets` | `Features/Waterfall/CATEGORY-BRACKET.md` | annotation |
| Arrows (Verbindungen) | `arrows` | `Features/Waterfall/ARROWS.md` | annotation |
| Benchmark-Lines | `benchmarkLines` | `Features/Waterfall/BENCHMARK-LINES.md` | layout |
| Negative Bridges | `negativeBridges` | `Features/Waterfall/NEGATIVE-BRIDGES.md` | layout |
| Grouping (Gruppierung) | `grouping` | `Features/Waterfall/GROUPING.md` | layout |

Features werden von `DeterministicConfigGenerator._activateFeatures()` deterministisch aktiviert und von der JS-Rendering-Engine gerendert.
Aktivierungsregeln und Konflikte: `_FEATURE-CATALOG.md`

### 4.7 PromptLoader-System

Der PromptLoader in `charts.html` lädt die Markdown-Dateien vollständig und cached sie mit Hash-Validierung:

```javascript
cache: {
    promptName: {
        content: "vollständiger Prompt-Inhalt",
        hash: "a3f5b2c1",      // 32-bit Hash
        timestamp: 1706234567890,
        size: 51234,
        tokens: 12808          // Geschätzte Tokens
    }
}
```

**Single Source of Truth:**
```
4. Prompts/*.md  ←── Source of Truth (einzige Stelle!)
       │
       │ PromptLoader.load()
       ▼
   HTML-Seiten (laden zur Laufzeit)
```

**Aktuell geladene Prompts:**
- `variant_generator` — einziger Prompt der in charts.html geladen wird
- PROMPT-1 wird separat in upload.html geladen
- config_generator und Chart-Prompts werden NICHT mehr geladen (deterministisch ersetzt)

**Vorteile:**
- Änderungen nur an einer Stelle
- Prompts immer aktuell
- Keine Sync-Probleme
- Einfaches Testing der Prompts

### 4.8 Anthropic Prompt Caching

Das System nutzt Anthropic's `cache_control` Feature für bis zu **90% Kosteneinsparung**.
Primär relevant für PROMPT-1 (upload.html) und PROMPT-2 (charts.html) — die einzigen verbleibenden API-Calls.

1. **Erster API-Call** (Cache-Write):
   - System-Prompt mit `cache_control: { type: 'ephemeral' }` senden
   - Anthropic cached serverseitig (TTL: 5 Minuten)
   - +25% Aufschlag (einmalig)

2. **Folgende API-Calls** (Cache-Hit):
   - Gleicher Prompt aus Cache → 90% günstiger
   - TTL wird bei Nutzung verlängert

**Voraussetzungen:**
- Mindestens 1024 Tokens (Anthropic Minimum)
- Nur bei Anthropic-Provider
- System-Prompt muss byte-identisch sein

---

## 5. Übergreifende Regeln

Diese Regeln gelten für ALLE Prompts in der Pipeline.

### 5.1 Spracherhaltung (KRITISCH)

**GRUNDREGEL:**
Alle Begriffe, Labels, Namen und Bezeichnungen aus den Quelldaten müssen EXAKT so beibehalten werden, wie sie in der hochgeladenen Datei stehen.

**VERBOTEN:**
- ✗ Übersetzen (DE→EN oder EN→DE)
- ✗ Umformulieren oder "Verbessern"
- ✗ Kürzen oder Abkürzen (außer bei Platzmangel)
- ✗ Synonyme verwenden
- ✗ Fachbegriffe "verdeutschen" oder anglizisieren

**Beispiele:**

| Quelldaten (DE) | Output (korrekt) | Output (FALSCH) |
|-----------------|------------------|-----------------|
| "Umsatzerlöse" | "Umsatzerlöse" | ~~"Revenue"~~ |
| "Materialaufwand" | "Materialaufwand" | ~~"Material costs"~~ |
| "EBITDA" | "EBITDA" | "EBITDA" ✓ |

| Quelldaten (EN) | Output (korrekt) | Output (FALSCH) |
|-----------------|------------------|-----------------|
| "Revenue" | "Revenue" | ~~"Umsatz"~~ |
| "Cost of Sales" | "Cost of Sales" | ~~"Herstellungskosten"~~ |
| "Net Income" | "Net Income" | ~~"Nettoergebnis"~~ |

### 5.2 Intelligente Aggregation (ERLAUBT)

Die KI darf Positionen zu sinnvollen Blöcken/Summen zusammenfassen:

- "Personalaufwand" + "Materialaufwand" + "Abschreibungen" → **"Betriebsaufwand"** (bei deutschen Daten)
- Einzelne Kostenarten → **"Operating Expenses"** (bei englischen Daten)

**Regeln für Aggregate:**
- Aggregate müssen in der GLEICHEN SPRACHE wie die Quelldaten benannt werden
- Ermöglicht zusätzliche Chart-Varianten (z.B. Summary vs. Detail-Ansicht)

### 5.3 Ausnahmen

**Chart-Titles dürfen beschreibend generiert werden:**
- "GuV Gesamtjahr 2025" (auch wenn Datei englisch ist)
- "P&L Annual Overview" (auch wenn Datei deutsch ist)

**ABER:** Die Daten-Labels im Chart bleiben IMMER original!

### 5.4 Geltungsbereich

Diese Regeln gelten für die gesamte Pipeline:
```
Prompt 1 → Prompt 2 → DeterministicConfigGenerator → JS-Renderer → Chart Output
```

---

## 6. Varianten-Generierung

### 6.1 MUSS-REGELN

1. **KEINE DUPLIKATE**
   - Jede Variante muss sich DEUTLICH unterscheiden
   - Unterschied in: Datenauswahl, Aggregation, Perspektive

2. **ECHTER MEHRWERT**
   - Jede Variante muss neue Erkenntnis ermöglichen
   - Frage: "Was lernt User hier, was andere Charts nicht zeigen?"

3. **SINNVOLLE ANZAHL**
   - Minimum: So viele wie sinnvoll (mind. 1)
   - Maximum: 10
   - Lieber 5 gute als 10 mittelmäßige

4. **PASSEND ZUM CHART-TYP**
   - Waterfall: Nur wenn Überleitung/Bridge Sinn macht
   - Bar: Nur wenn Vergleich Sinn macht
   - Stacked: Nur wenn Zusammensetzung Sinn macht

5. **DATEN MÜSSEN VORHANDEN SEIN**
   - Keine Variante für nicht-existente Daten
   - Keine "Phantasie-Perspektiven"

### 6.2 Varianten-Dimensionen

| Dimension | Beschreibung |
|-----------|--------------|
| **A. DATENAUSWAHL** | Alle Daten vs. gefiltert, Aggregiert vs. Detail |
| **B. ZEITLICHE PERSPEKTIVE** | Siehe vollständige Liste unten |
| **C. SZENARIO-PERSPEKTIVE** | Siehe vollständige Liste unten |
| **D. HIERARCHIE-EBENE** | Konzern, Cluster/Segment, Detail (Land, Produkt) |
| **E. DETAIL-TIEFE** | Executive Summary (5-7), Standard (10-15), Detail (alle) |

**B. ZEITLICHE PERSPEKTIVE im Detail:**

| Kategorie | Optionen |
|-----------|----------|
| **Einzelne Perioden** | Einzelperiode (Monat/Quartal), Kumuliert (YTD), Gesamtjahr |
| **Zeitreihen-Trends** | Monatstrend (12 Monate), Quartalstrend (Q1-Q4), Halbjahresvergleich (H1 vs. H2) |
| **Periodenvergleiche** | Monat vs. Monat, Quartal vs. Quartal, Jahr vs. Jahr |
| **Vorjahresvergleiche** | Monat vs. VJ-Monat, YTD vs. VJ-YTD, Quartal vs. VJ-Quartal |
| **Spezial-Aggregationen** | Rolling 12 Monate, Saisonalitäts-Vergleich |

**Wichtig:** Nur Perspektiven generieren, für die ausreichend Perioden in den Daten vorhanden sind!

**C. SZENARIO-PERSPEKTIVE im Detail:**

| Kategorie | Kombinationen |
|-----------|---------------|
| **Einzel-Szenarien** | Nur IST, Nur BUD, Nur FC, Nur VJ |
| **Zwei-Szenario-Vergleiche** | IST vs. BUD, IST vs. FC, IST vs. VJ, BUD vs. FC, BUD vs. VJ, FC vs. VJ |
| **Drei-Szenario-Vergleiche** | IST vs. FC vs. BUD, IST vs. VJ vs. BUD |
| **Forecast-Iterationen** | FC1 vs. FC2 vs. FC3 (Rolling Forecast) |

**Wichtig:** Nur Kombinationen generieren, für die ALLE referenzierten Szenarien in den Daten vorhanden sind!

### 6.3 Duplikat-Erkennung (Daten-basiert)

```javascript
fingerprint = `${chartType}:${perspectiveId}:${titleHash}:${dataStructure}`

// Beispiele:
"BAR:p1:clusterübersicht:3:3"  // Cluster-Übersicht → OK
"BAR:p3:dachbreakdown:3:3"     // DACH-Breakdown   → KEIN Duplikat!
"BAR:p1:clusterübersicht:3:3"  // Gleiche Daten    → DUPLIKAT (skip)
```

---

## 7. Farbschema-System

Farbschemas sind in `6. Bibliotheken/color-schemes.json` definiert und modular erweiterbar.

### 7.1 Vordefinierte Schemas

| Schema | Beschreibung | Farben |
|--------|--------------|--------|
| **businessNeutral** | Klassische Unternehmensfarben | Blau, Grün, Rot, Orange, Hellblau, Violett |
| **financeFocus** | Grün/Rot für Gewinn/Verlust | Grün-Töne, Rot-Töne |
| **corporateMagenta** | Moderne Magenta-Akzente | Magenta, Blau, Grau |
| **monochrome** | Graustufen für Print | Schwarz bis Hellgrau |
| **trafficLight** | Ampelfarben | Rot, Orange, Grün |
| **custom** | Benutzerdefiniert | 6 frei wählbare Hex-Codes |

### 7.2 Schema-Struktur

```json
{
  "schemeId": {
    "name": "Anzeigename",
    "description": "Beschreibung",
    "colors": ["#2E5A88", "#4A7C59", "#B85450", "#F5A623", "#6B8BAE", "#8B5CF6"],
    "chart_mapping": {
      "waterfall": {
        "start": 0,
        "end": 0,
        "positive": 1,
        "negative": 2,
        "compare": 3,
        "connector": 4
      },
      "bar": { ... },
      "stacked_bar": { ... }
    }
  }
}
```

### 7.3 Erweiterung

Neue Farbschemas können ohne Code-Änderungen hinzugefügt werden:
1. JSON-Eintrag in `color-schemes.json` hinzufügen
2. Schema erscheint automatisch in `colors.html`

---

## 8. Chart-Generierung

### 8.1 Generierungs-Pipeline

```
1. PROMPT-1 (Universal Analyzer)  → Daten analysieren
2. User wählt Chart-Typ          → results.html
3. User wählt Farbschema         → colors.html
4. PROMPT-2 (Variant Generator)  → 3-10 Varianten definieren
5. FÜR JEDE VARIANTE (deterministisch, kein API-Call):
   a. DeterministicConfigGenerator → chartConfig erstellen
   b. normalizeConfigForRenderer() → Format anpassen
   c. Fingerprint-Check            → Duplikate überspringen
   d. JS-Rendering-Engine          → SVG generieren
6. Export                         → ZIP/PPTX
```

### 8.2 Beispiel: Generierte Varianten

Für einen P&L-Report mit 2 Perioden und 18 Zeilen (Waterfall gewählt):

| # | Template | Fokus | Mehrwert |
|---|----------|-------|----------|
| 1 | WF-01 | Gesamtjahr IST | Executive Overview |
| 2 | WF-03 | YoY Bridge | Veränderung zum Vorjahr |
| 3 | WF-04 | Budget Bridge | Plan-Ist-Abweichung |
| 4 | WF-07 | Margin Bridge | Margin-Entwicklung |
| 5 | WF-02 | Detail-Ansicht | Alle Positionen |
| 6 | WF-11 | Quartals-Trend | Q1 → Q4 Entwicklung |

### 8.3 API-Calls pro Durchlauf (Beispiel)

| Phase | Prompt | Anzahl Calls |
|-------|--------|--------------|
| Upload | PROMPT-1 Universal Analyzer | 1 |
| Chart-Gen | PROMPT-2 Variant Generator | 1 |
| Chart-Gen | DeterministicConfigGenerator | ~6 (deterministisch, 0 API-Calls) |
| Chart-Gen | JS-Rendering-Engine (SVG) | ~6 (deterministisch, 0 API-Calls) |
| **Gesamt** | | **2** (nur PROMPT-1 + PROMPT-2) |

### 8.4 JSON-Reparatur

API-Antworten werden manchmal abgeschnitten. Der Parser hat eine 5-Schritt-Reparatur:
1. Offene Strings schließen
2. Klammern zählen
3. Unvollständige Elemente entfernen
4. Fehlende Klammern hinzufügen
5. Aggressives Kürzen als Fallback

---

## 9. Export-Funktionen

Das System unterstützt 6 Export-Formate:

| Format | Funktion | Beschreibung |
|--------|----------|--------------|
| **SVG** | `downloadSVG(index)` | Vektor-Format, skalierbar |
| **PNG** | `downloadPNG(index)` | 2x Auflösung |
| **PNG-HD** | `downloadPNGHD(index)` | 4x Auflösung |
| **HTML** | `downloadHTML(index)` | Standalone mit eingebettetem SVG |
| **PPTX** | `downloadPPTX(index)` | PowerPoint-Folie |
| **ZIP** | `downloadAllAsZIP()` | Alle Charts als Batch |

### Batch-Export

- `downloadAllAsZIP()` - Alle Charts in einem ZIP
- `downloadAllAsPPTX()` - Alle Charts in einer PPTX

---

## 10. API-Integration

### 10.1 Unterstützte Provider

| Provider | Modell | Besonderheiten |
|----------|--------|----------------|
| **Anthropic** (Standard) | Claude | Prompt Caching (90% Einsparung) |
| **OpenAI** | GPT-4 | Alternative |

Die Provider-Auswahl erfolgt in `upload.html`.

### 10.2 Modi

| Modus | Beschreibung |
|-------|--------------|
| **deterministic** | PROMPT-2 (KI) + DeterministicConfigGenerator + JS-Renderer |
| **demo** | Vordefinierte Beispieldaten ohne API |

**Wichtig:** Kein Fallback. Fehler werden angezeigt, kein stilles Fallback auf andere Modi.

### 10.3 APIClient

Der zentrale APIClient handhabt alle API-Kommunikation:

```javascript
APIClient.call(systemPrompt, userPrompt, {
    provider: 'anthropic',
    maxTokens: 4096,
    timeout: 60000
})
```

**Features:**
- Unified Interface für beide Provider
- Automatisches Prompt Caching (Anthropic)
- 60 Sekunden Timeout
- JSON-Parsing mit Reparatur

---

## 11. Modulare Erweiterbarkeit

### 11.1 Ohne Code-Änderungen erweiterbar

| Erweiterung | Datei | Aktion |
|-------------|-------|--------|
| Neue Farbpalette | `color-schemes.json` | JSON-Eintrag hinzufügen |
| Neues Template | `templates.json` | Template-Objekt hinzufügen |
| Neues Trainingsbeispiel | `chart-examples.json` | Example hinzufügen |

### 11.2 Chart-Typ hinzufügen (z.B. Line Chart)

1. **JS-Renderer implementieren:** `render[Typ]Chart()` Funktion in `charts.html`
2. **DeterministicConfigGenerator erweitern:** `_generate[Typ]Config()` Methode
3. **Templates definieren:** Neue Einträge in `templates.json` mit `chart_type: "line"`
4. **Variant Generator erweitern:** Template-IDs für neuen Typ ergänzen
5. **UI anpassen:** Neuen Typ in `results.html` Auswahl hinzufügen
6. **Dokumentation:** CLAUDE.md + Konzept aktualisieren
7. **Feature-Verzeichnis:** `4. Prompts/Features/[TYP]/` mit `_FEATURE-CATALOG.md`, `_TEMPLATE-MATRIX.md` und Feature-Modulen erstellen

### 11.3 Layout/Template hinzufügen

1. **Template in `templates.json`:**
```json
{
  "template_id": "WF-13",
  "name": "new_waterfall_layout",
  "chart_type": "waterfall",
  "metadata": { ... }
}
```
2. **Fertig!** – Variant Generator erkennt neue Templates automatisch

### 11.4 Feature hinzufügen

1. **Feature-Datei erstellen:** `4. Prompts/Features/[ChartType]/[FEATURE].md` im 10-Sektionen-Format (Metadata, Beschreibung, Kompatibilität, Aktivierungsregeln, Config-Schema, Rendering-Logik, CSS, Konflikte, Edge-Cases, Beispiele)
2. **Aktivierungsregel:** In `_FEATURE-CATALOG.md` mit natürlicher Sprache + Pseudo-Code
3. **Template-Matrix:** In `_TEMPLATE-MATRIX.md` eintragen welche Templates das Feature unterstützen
4. **templates.json:** `availableFeatures[]` und ggf. `featureHints{}` pro Template ergänzen
5. **DeterministicConfigGenerator:** Aktivierungslogik in `_activateFeatures()` ergänzen
6. **Testen:** Feature isoliert mit Beispieldaten validieren

### 11.5 Design-Prinzipien

- **Renderer sind unabhängig:** Jeder JS-Renderer funktioniert eigenständig
- **Templates sind deklarativ:** JSON-Struktur mit Feature-Metadaten, keine Logik
- **Features sind modular:** Ein Feature = Eine Datei, dokumentiert in Feature-Modulen
- **Deterministische Aktivierung:** `_activateFeatures()` entscheidet regelbasiert welche Features aktiv sind
- **Begründungspflicht:** Jedes Feature hat `_reason` für Transparenz
- **Keine Hardcoding:** Chart-Typen, Templates und Features extern gepflegt
- **Prompts extern:** `.md`-Dateien zur Laufzeit laden, NIE in HTML einbetten

---

## 12. Testplan & Validierung

### 12.1 Teststrategie

Die Prompt-Engine ist das Herzstück des Systems. Alle Prompts werden vor der HTML-Integration validiert.

**Vorgehen:**
1. Prompts isoliert testen (ohne Frontend)
2. Ergebnisse in JSON speichern
3. Visuelle Validierung
4. Iterative Prompt-Verbesserung

### 12.2 Testphasen

| Phase | Prompt | Anzahl Tests | Erfolgs-Metrik |
|-------|--------|--------------|----------------|
| 1 | Universal Analyzer | 50 Dateien | 100% Spracherhaltung, Struktur |
| 2 | Variant Generator | 150 (50×3 Typen) | 0% Duplikate, valide IDs |
| 3 | DeterministicConfigGenerator | ~750 Configs | 100% valide JSON, Labels |
| 4 | JS-Rendering-Engine | E2E Tests | Visuelle Prüfung |

### 12.3 Automatische Validierungs-Checks

**Phase 1 (Universal Analyzer):**
- JSON-Schema-Validierung
- Spracherhaltung (Fuzzy-Match 95%)
- Szenarien-Vollständigkeit
- Perioden-Extraktion
- Report-Typ-Plausibilität
- Datenwert-Stichprobe

**Phase 2 (Variant Generator):**
- Template-ID-Validierung (existiert in Bibliothek?)
- Duplikat-Erkennung (keine quasi-identischen Varianten)
- dataFilter-Validierung (nur existierende Daten referenziert)
- Varianten-Anzahl (1-10)

**Phase 3 (DeterministicConfigGenerator):**
- JSON-Schema (Pflichtfelder vorhanden)
- Spracherhaltung (Labels nicht übersetzt)
- Datenwert-Validierung (Werte aus Quelle)
- Farb-Validierung (aus colorScheme)
- Typ-Konsistenz (Waterfall: start/increase/decrease/end)
- Mathematische Konsistenz (Waterfall: Start + Deltas = End)

### 12.4 Testdateien (50 Stück)

Die Testdateien befinden sich in `5. Datenbeispiele/` und decken alle gängigen Finanzreport-Formate ab.

**Kategorien:**

| Kategorie | Anzahl | Beispiele |
|-----------|--------|-----------|
| GuV / P&L | 8 | Monatssicht, Faktentabelle, YoY |
| Bilanz | 6 | Jahresvergleich, Aktiva/Passiva |
| Cashflow | 5 | Direct/Indirect, FCF Bridge |
| Segmente | 7 | by Region, by BU, by Product |
| Sales | 6 | by Channel, YTD vs Target |
| Kosten | 6 | OpEx, CapEx, Cost Center |
| Personal | 3 | FTE, Salary Bands |
| KPIs/Bridges | 5 | EBITDA Bridge, Working Capital |
| Sonderformate | 4 | Long Format, Sparse Data |

**Vollständige Liste:**

| # | Datei | Kategorie |
|---|-------|-----------|
| 01 | GuV_Monatssicht_IST_FC_BUD.xlsx | GuV |
| 02 | GuV_Faktentabelle_SEL_CUM.csv | GuV |
| 03 | PL_Quartalssicht_YoY.csv | GuV |
| 04 | IFRS_PL_FC_Iterationen.xlsx | GuV |
| 05 | GuV_SEL_CUM_Abweichungen.xlsx | GuV |
| 06 | PL_Rolling_Forecast.csv | GuV |
| 07 | GuV_Konzern_vs_Einzelgesellschaft.xlsx | GuV |
| 08 | PL_3Year_Comparison.csv | GuV |
| 09 | Bilanz_Jahresvergleich.xlsx | Bilanz |
| 10 | Balance_Sheet_Quarterly.csv | Bilanz |
| 11 | Bilanz_Aktiva_Passiva_Detail.xlsx | Bilanz |
| 12 | Balance_Sheet_IST_vs_PY.csv | Bilanz |
| 13 | Bilanz_Kurzfristig_Langfristig.xlsx | Bilanz |
| 14 | Balance_Sheet_Faktentabelle.csv | Bilanz |
| 15 | Cashflow_Statement_Annual.xlsx | Cashflow |
| 16 | Cashflow_Indirect_Method.csv | Cashflow |
| 17 | Cashflow_Direct_Method.xlsx | Cashflow |
| 18 | Cashflow_Quarterly_Trend.csv | Cashflow |
| 19 | Free_Cashflow_Bridge.xlsx | Cashflow |
| 20 | Segment_Revenue_by_Region.xlsx | Segmente |
| 21 | Segment_EBIT_by_BU.csv | Segmente |
| 22 | Segment_Margin_by_Product.xlsx | Segmente |
| 23 | Segment_Revenue_by_Country.csv | Segmente |
| 24 | Segment_Cost_Allocation.xlsx | Segmente |
| 25 | Segment_Profitability_Matrix.csv | Segmente |
| 26 | Segment_YoY_Growth_Rates.xlsx | Segmente |
| 27 | Sales_Monthly_by_Channel.csv | Sales |
| 28 | Sales_YTD_vs_Target.xlsx | Sales |
| 29 | Revenue_by_Customer_Top20.csv | Sales |
| 30 | Sales_Pipeline_Stages.xlsx | Sales |
| 31 | Revenue_New_vs_Recurring.csv | Sales |
| 32 | Sales_by_Product_Category.xlsx | Sales |
| 33 | OpEx_Breakdown_Monthly.xlsx | Kosten |
| 34 | Cost_Center_Actual_vs_Budget.csv | Kosten |
| 35 | CapEx_Projektübersicht.xlsx | Kosten |
| 36 | Cost_by_Category_Trend.csv | Kosten |
| 37 | Fixed_vs_Variable_Costs.xlsx | Kosten |
| 38 | Overhead_Allocation.csv | Kosten |
| 39 | Headcount_FTE_Monthly.csv | Personal |
| 40 | Personnel_Cost_by_Dept.xlsx | Personal |
| 41 | Salary_Bands_Analysis.csv | Personal |
| 42 | EBITDA_Bridge_PY_to_CY.xlsx | KPIs |
| 43 | Working_Capital_Trend.csv | KPIs |
| 44 | KPI_Dashboard_Monthly.xlsx | KPIs |
| 45 | Budget_Variance_Analysis.csv | KPIs |
| 46 | Revenue_Bridge_Waterfall.xlsx | KPIs |
| 47 | Financials_Long_Format.csv | Sonderformate |
| 48 | Financials_Wide_Pivoted.xlsx | Sonderformate |
| 49 | Sparse_Data_with_Gaps.csv | Sonderformate |
| 50 | Multi_Currency_Report.xlsx | Sonderformate |

### 12.5 End-to-End Validierung

**Repräsentative Auswahl für E2E-Tests (10 Dateien):**

1. 01_GuV_Monatssicht_IST_FC_BUD.xlsx (Standard P&L)
2. 09_Bilanz_Jahresvergleich.xlsx (Bilanz)
3. 15_Cashflow_Statement_Annual.xlsx (Cashflow)
4. 20_Segment_Revenue_by_Region.xlsx (Segmente)
5. 29_Revenue_by_Customer_Top20.csv (Ranking)
6. 33_OpEx_Breakdown_Monthly.xlsx (Kosten)
7. 42_EBITDA_Bridge_PY_to_CY.xlsx (Bridge)
8. 44_KPI_Dashboard_Monthly.xlsx (KPIs)
9. 47_Financials_Long_Format.csv (Long-Format)
10. 50_Multi_Currency_Report.xlsx (Multi-Währung)

**Für jede Datei:**
- Alle 3 Chart-Typen testen
- Alle Varianten bis zur SVG-Ausgabe führen
- Manuelle visuelle Prüfung

---

## 13. Anhang: Trainingsbeispiele

Die Datei `chart-examples.json` enthält 10 Beispiel-Konfigurationen für KI-Training:

| Typ | Anzahl | Sprachen |
|-----|--------|----------|
| Waterfall | 4 | DE, EN |
| Bar | 3 | DE, EN |
| Stacked Bar | 3 | DE, EN |

Diese Beispiele dienen als Formatvorlage für die KI-Generierung.
