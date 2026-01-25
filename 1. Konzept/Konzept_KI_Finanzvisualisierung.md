# KONZEPT: KI-gestützte Finanzvisualisierung

**Automatisierte Chart-Generierung für Finanzreports**
Waterfall | Stacked Bar | Bar Chart

Version 2.1 | Januar 2026 (Phase 1 Refactoring)

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
| **Template-Bibliothek** | 30 vordefinierte Layout-Templates (JSON) |
| **Prompt-System** | 5 KI-Prompts für Chart-Generierung (~158 KB) |
| **ChartMixer** | Lädt alle Templates des gewählten Typs |
| **ConfigGenerator** | Erzeugt Chart-Konfigurationen via KI |
| **Export-Engine** | SVG, PNG, PPTX, HTML, ZIP |

### Kernprinzip: KI-Empfehlung + User-Auswahl

Das System zeigt dem User eine KI-Empfehlung für den optimalen Chart-Typ, aber der User MUSS explizit einen Typ wählen. Alle Templates des gewählten Typs werden generiert (bis zu 12). Der User wählt per Checkbox welche Charts exportiert werden.

**Workflow:**
1. KI analysiert Daten und empfiehlt Chart-Typ
2. User wählt Chart-Typ (Waterfall, Bar, Stacked Bar)
3. System generiert ALLE Templates des Typs
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
│  │ ConfigLoader │  │TemplateLoader│  │ DataProfiler │              │
│  │              │  │              │  │              │              │
│  │ Lädt JSON-   │  │ Lädt 30      │  │ Analysiert   │              │
│  │ Configs      │  │ Templates    │  │ Daten-Profil │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│         │                 │                 │                       │
│         └─────────────────┼─────────────────┘                       │
│                           ▼                                         │
│                    ┌──────────────┐                                 │
│                    │  ChartMixer  │                                 │
│                    │              │                                 │
│                    │ Lädt alle    │                                 │
│                    │ Templates    │                                 │
│                    └──────────────┘                                 │
│                           │                                         │
│                           ▼                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  APIClient   │◀─│ConfigGenerator│─▶│ SVG-Renderer │              │
│  │              │  │              │  │              │              │
│  │ Anthropic/   │  │ Erzeugt      │  │ Waterfall/   │              │
│  │ OpenAI       │  │ Chart-Config │  │ Bar/Stacked  │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│                                              │                       │
│                                              ▼                       │
│                                       ┌──────────────┐              │
│                                       │ Export-Engine│              │
│                                       │ SVG/PNG/PPTX │              │
│                                       └──────────────┘              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Komponenten-Übersicht

| Komponente | Aufgabe | Typ |
|------------|---------|-----|
| **ConfigLoader** | Lädt JSON-Konfigurationen (Templates, Examples, Colors) | Statisch |
| **TemplateLoader** | Verwaltet 30 Chart-Templates | Statisch |
| **DataProfiler** | Analysiert Daten (Typ, Komplexität, Zeitreihen) | Logik |
| **ChartMixer** | Lädt alle Templates des gewählten Typs | Statisch |
| **APIClient** | Zentrale API-Integration (Anthropic/OpenAI) | Integration |
| **ConfigGenerator** | Generiert Chart-Konfigurationen via KI | KI |
| **SVG-Renderer** | Rendert Charts als SVG | Rendering |
| **Export-Engine** | Exportiert in verschiedene Formate | Export |

### 2.3 Seiten-Funktionen

#### upload.html
- Datei-Upload (CSV, Excel)
- API-Key-Validierung
- Datenvorschau (max. 15 Zeilen)
- Erste KI-Analyse der Datenstruktur
- Sprach-Erkennung (DE/EN)

#### results.html
- Zeigt Analyseergebnisse an
- Chart-Typ-Auswahl (Mix oder Einzeltyp)
- Anzahl Charts wählbar (1-10)
- Datenqualitäts-Score (0-10)
- Editierbare Metadaten (Unit, Zeitraum)

#### colors.html
- 6 vordefinierte Farbschemas
- Custom-Farben möglich (6 Hex-Werte)
- Live-Vorschau der Palette
- Persistenz via localStorage

#### charts.html
- Chart-Generierung via KI
- SVG-Rendering für alle Chart-Typen
- Interaktive Tooltips
- Multi-Format-Export

---

## 3. Template-Bibliothek

Die Bibliothek umfasst 30 Templates in `6. Bibliotheken/templates.json`, verteilt auf drei Chart-Typen.

### 3.1 Verteilung nach Chart-Typ

| Chart-Typ | Anzahl | Fokus |
|-----------|--------|-------|
| Waterfall | 12 | Bridges, Strukturen, Varianzen |
| Stacked Bar | 8 | Zusammensetzungen, Trends |
| Bar Chart | 10 | Vergleiche, Rankings |
| **Gesamt** | **30** | |

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

### 3.3 Waterfall Templates (12)

| ID | Name | Perspektive | Beschreibung |
|----|------|-------------|--------------|
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

### 3.4 Stacked Bar Templates (8)

| ID | Name | Perspektive | Beschreibung |
|----|------|-------------|--------------|
| SB-01 | cost_structure_absolute | Composition | Kosten absolut |
| SB-02 | cost_structure_percent | Composition | Kosten 100%-gestapelt |
| SB-03 | revenue_mix_trend_absolute | Trend | Revenue über Zeit (absolut) |
| SB-04 | revenue_mix_trend_percent | Trend | Revenue über Zeit (100%) |
| SB-05 | segment_comparison_stacked | Comparison | Segmente nebeneinander |
| SB-06 | pnl_components_stacked | Structure | P&L als Stacked Bar |
| SB-07 | horizontal_cost_breakdown | Composition | Horizontal für lange Labels |
| SB-08 | budget_components_stacked | Comparison | Budget-Zusammensetzung |

### 3.5 Bar Chart Templates (10)

| ID | Name | Perspektive | Beschreibung |
|----|------|-------------|--------------|
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
  "template_id": "pnl_waterfall_summary",
  "name": "P&L Executive Summary",
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

### 4.1 Prompt-Dateien

| Datei | Größe | Zweck |
|-------|-------|-------|
| `WATERFALL-CHART-PROMPT.md` | ~51 KB | Generiert Waterfall-Konfigurationen |
| `BAR-CHART-PROMPT.md` | ~38 KB | Generiert Bar-Chart-Konfigurationen |
| `STACKED-BAR-CHART-PROMPT.md` | ~40 KB | Generiert Stacked-Bar-Konfigurationen |
| `RANKING-MIX-PROMPT.md` | ~8 KB | Wählt optimale Template-Kombination |
| `FIELD-MAPPING-PROMPT.md` | ~11 KB | Mapped Datenfelder auf Templates |
| `COLOR-SCHEMA-PROMPT.md` | ~19 KB | Generiert Farbpaletten |

**Gesamt:** ~167 KB Prompt-Volumen

### 4.2 PromptLoader-System

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

**Cache-Validierung:**
- Bei jedem `load()` wird der Hash der Datei berechnet
- Hash identisch → aus Cache laden
- Hash unterschiedlich → neu laden und Cache aktualisieren

### 4.3 Anthropic Prompt Caching

Das System nutzt Anthropic's `cache_control` Feature für bis zu **90% Kosteneinsparung**:

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

## 5. Farbschema-System

Farbschemas sind in `6. Bibliotheken/color-schemes.json` definiert und modular erweiterbar.

### 5.1 Vordefinierte Schemas

| Schema | Beschreibung | Farben |
|--------|--------------|--------|
| **businessNeutral** | Klassische Unternehmensfarben | Blau, Grün, Rot, Orange, Hellblau, Violett |
| **financeFocus** | Grün/Rot für Gewinn/Verlust | Grün-Töne, Rot-Töne |
| **corporateMagenta** | Moderne Magenta-Akzente | Magenta, Blau, Grau |
| **monochrome** | Graustufen für Print | Schwarz bis Hellgrau |
| **trafficLight** | Ampelfarben | Rot, Orange, Grün |
| **custom** | Benutzerdefiniert | 6 frei wählbare Hex-Codes |

### 5.2 Schema-Struktur

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

### 5.3 Erweiterung

Neue Farbschemas können ohne Code-Änderungen hinzugefügt werden:
1. JSON-Eintrag in `color-schemes.json` hinzufügen
2. Schema erscheint automatisch in `colors.html`

---

## 6. Chart-Generierung

### 6.1 ChartMixer

Der ChartMixer wählt aus 30 Templates die optimale Kombination basierend auf:

**Auswahlkriterien:**

1. **Perspektiven-Abdeckung:** Mindestens 4 verschiedene Perspektiven
2. **Zielgruppen-Mix:**
   - 2-3 Executive-Level Charts (Summary)
   - 3-4 Analyse-Charts (Detail)
   - 2-3 Spezial-Perspektiven (Variance, Trend, Ranking)
3. **Charttyp-Balance:**
   - Nicht mehr als 5 Charts eines Typs
   - Mindestens 2 verschiedene Charttypen

**Constraint: Keine Redundanz**

Der ChartMixer führt eine Ähnlichkeitsprüfung durch:
- Charts mit >80% Layout-Ähnlichkeit werden übersprungen
- Berücksichtigt: gleiche Struktur, ähnliche Datenpunkte
- Reduziert Redundanz und API-Kosten

### 6.2 ConfigGenerator

Der ConfigGenerator erzeugt die finale Chart-Konfiguration:

1. **Template auswählen** (via ChartMixer)
2. **Feld-Mapping** erstellen (FIELD-MAPPING-PROMPT)
3. **Struktur anpassen** an verfügbare Daten
4. **KI-Generierung** mit chart-spezifischem Prompt
5. **Validierung** der JSON-Ausgabe

**JSON-Reparatur:**

API-Antworten werden manchmal abgeschnitten. Der Parser hat eine 5-Schritt-Reparatur:
1. Offene Strings schließen
2. Klammern zählen
3. Unvollständige Elemente entfernen
4. Fehlende Klammern hinzufügen
5. Aggressives Kürzen als Fallback

### 6.3 Beispiel: Generierter Chart-Mix

Für einen P&L-Report mit 2 Perioden und 18 Zeilen:

| # | Template | Perspektive | Zweck |
|---|----------|-------------|-------|
| 1 | pnl_waterfall_summary | Structure | Executive Overview |
| 2 | pnl_waterfall_yoy_bridge | Variance | YoY-Veränderung |
| 3 | variance_bar_colored | Variance | Abweichungen farblich |
| 4 | cost_structure_percent | Composition | Kostenstruktur |
| 5 | actual_vs_budget | Comparison | Plan-Ist-Vergleich |
| 6 | margin_bridge | Structure | Margin-Entwicklung |
| 7 | revenue_mix_trend_percent | Trend | Revenue-Mix |
| 8 | ranking_horizontal | Ranking | Top Kostentreiber |
| 9 | pnl_waterfall_detail | Structure | Detailansicht |
| 10 | quarterly_comparison | Comparison | Quartalsvergleich |

**Mix-Zusammenfassung:** 4 Waterfall + 4 Bar + 2 Stacked Bar

---

## 7. Export-Funktionen

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

## 8. API-Integration

### 8.1 Unterstützte Provider

| Provider | Modell | Besonderheiten |
|----------|--------|----------------|
| **Anthropic** (Standard) | Claude | Prompt Caching (90% Einsparung) |
| **OpenAI** | GPT-4 | Alternative |

Die Provider-Auswahl erfolgt in `upload.html`.

### 8.2 Modi

| Modus | Beschreibung |
|-------|--------------|
| **ai** | Echte API-Calls an gewählten Provider |
| **demo** | Vordefinierte Beispieldaten ohne API |

**Wichtig:** Kein Rule-Based Fallback. Wenn die KI fehlschlägt, gibt es keine lokale Fallback-Logik.

### 8.3 APIClient

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

## 9. Modulare Erweiterbarkeit

### Ohne Code-Änderungen erweiterbar

| Erweiterung | Datei | Aktion |
|-------------|-------|--------|
| Neue Farbpalette | `color-schemes.json` | JSON-Eintrag hinzufügen |
| Neues Template | `templates.json` | Template-Objekt hinzufügen |
| Neues Trainingsbeispiel | `chart-examples.json` | Example hinzufügen |

### Nicht erweiterbar ohne Code

- Chart-Typen (nur Waterfall, Bar, Stacked Bar)
- API-Provider (nur Anthropic, OpenAI)

---

## 10. Anhang: Trainingsbeispiele

Die Datei `chart-examples.json` enthält 10 Beispiel-Konfigurationen für KI-Training:

| Typ | Anzahl | Sprachen |
|-----|--------|----------|
| Waterfall | 4 | DE, EN |
| Bar | 3 | DE, EN |
| Stacked Bar | 3 | DE, EN |

Diese Beispiele dienen als Formatvorlage für die KI-Generierung.
