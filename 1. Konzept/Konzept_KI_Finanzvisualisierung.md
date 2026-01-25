# KONZEPT: KI-gestützte Finanzvisualisierung

**Automatisierte Chart-Generierung für Finanzreports**  
Waterfall | Stacked Bar | Bar Chart

Version 1.1

---

## 1. Executive Summary

Dieses Konzept beschreibt ein System zur automatisierten Visualisierung von Finanzdaten. Das System kombiniert eine statische Template-Bibliothek mit dynamischer KI-Anpassung, um für jeden Finanzreport die optimalen Chart-Darstellungen zu generieren.

### Kernkomponenten

- **Template-Bibliothek:** 30 vordefinierte Layout-Templates für drei Charttypen (Waterfall, Stacked Bar, Bar Chart)
- **Runtime-Engine:** KI-gestützte Anpassung der Templates an konkrete Datensätze
- **Output:** 1-10 optimierte Chart-Konfigurationen als intelligenter Mix verschiedener Charttypen (Anzahl vom User wählbar)

### Kernprinzip: Intelligenter Chart-Mix

Das System generiert nicht einfach die 10 ähnlichsten Charts, sondern einen durchdachten Mix verschiedener Perspektiven. Für einen P&L-Report könnte der Output beispielsweise sein: 4 Waterfalls (Struktur, YoY-Bridge, Margin, Detail), 3 Bar Charts (Varianz, Ranking, Trend) und 3 Stacked Bars (Kostenstruktur, Revenue-Mix). Jeder Chart liefert einen eigenen Mehrwert.

### Vorteile des Ansatzes

- Deterministischer Kern durch Template-Bibliothek (debugbar, testbar)
- Flexibilität durch KI-Runtime-Anpassung
- Reduzierte KI-Kosten durch Vorfilterung
- Wartbare Architektur mit klarer Aufgabentrennung
- Automatischer Mix verschiedener Charttypen für umfassende Analyse

---

## 2. Systemarchitektur

Das System folgt einem zweistufigen Ansatz: Eine offline erstellte Template-Bibliothek definiert die möglichen Visualisierungsstrukturen. Zur Laufzeit wählt und passt die KI die Templates basierend auf den konkreten Daten an – dabei wird ein sinnvoller Mix aus verschiedenen Charttypen erzeugt.

### 2.1 Architektur-Übersicht

```
┌────────────────┐
│  Daten-Input   │
└───────┬────────┘
        │
        ▼
┌────────────────────────┐     ┌────────────────────────┐
│ 1. Data Profiler       │────▶│ Profil: type, rows,    │
└───────┬────────────────┘     │ periods, has_variance  │
        │                      └────────────────────────┘
        ▼
┌────────────────────────┐     ┌────────────────────────┐
│ 2. Ranking & Mix (KI)  │◀────│ Template-Bibliothek    │
│    Perspektiven-Matrix │     │ (30 Templates)         │
└───────┬────────────────┘     └────────────────────────┘
        │
        ▼
┌────────────────────────┐
│ 3. Mapping (KI)        │  ← Felder zuordnen
└───────┬────────────────┘
        │
        ▼
┌────────────────────────┐
│ 4. Anpassung (KI)      │  ← Struktur + Edge Cases
└───────┬────────────────┘
        │
        ▼
┌────────────────────────┐
│ 5. Styling             │  ← Format, Farben
└───────┬────────────────┘
        │
        ▼
┌─────────────────────────────┐
│ Chart-Output (Mixed)        │
│ z.B. 4 Waterfall + 3 Bar +  │
│      3 Stacked Bar          │
└─────────────────────────────┘
```

### 2.2 Aufgabenteilung

| Komponente | Aufgabe | Typ |
|------------|---------|-----|
| Template-Bibliothek | Definiert abstrakte Chart-Strukturen | Statisch |
| Template-Bibliothek | Legt Varianten pro Charttyp fest | Statisch |
| Template-Bibliothek | Speichert Best Practices | Statisch |
| Runtime-Engine | Ranking & Mix-Generierung | KI |
| Runtime-Engine | Perspektiven-Abdeckung prüfen | KI |
| Runtime-Engine | Feld-Mapping auf Daten | KI |
| Runtime-Engine | Strukturanpassung | KI |
| Runtime-Engine | Edge Case Handling | KI |
| Runtime-Engine | Styling & Formatierung | KI/Regeln |

---

## 3. Template-Bibliothek

Die Bibliothek umfasst 30 Templates, verteilt auf drei Charttypen. Jedes Template definiert eine abstrakte Struktur, die zur Laufzeit mit konkreten Daten befüllt wird.

### 3.1 Verteilung nach Charttyp

| Charttyp | Anzahl | Begründung |
|----------|--------|------------|
| Waterfall | 12 | Höchste Varianz (Bridges, Richtungen, Detailstufen) |
| Stacked Bar | 8 | Absolute vs. prozentuale Darstellung |
| Bar Chart | 10 | Gruppierung + Varianz-Darstellung |
| **Gesamt** | **30** | |

### 3.2 Waterfall Templates (12)

| ID | Name | Beschreibung |
|----|------|--------------|
| WF-01 | pnl_waterfall_summary | Executive Summary, 6 Items |
| WF-02 | pnl_waterfall_detail | Alle Zeilen, ca. 15 Items |
| WF-03 | pnl_waterfall_yoy_bridge | Prior Year → Current Year |
| WF-04 | pnl_waterfall_budget_bridge | Budget → Actual |
| WF-05 | pnl_waterfall_horizontal | Horizontale Darstellung |
| WF-06 | cashflow_waterfall | Operating → Investing → Financing |
| WF-07 | margin_bridge | Gross Margin → Net Margin |
| WF-08 | cost_variance_waterfall | Kostenabweichungen |
| WF-09 | revenue_bridge | Revenue-Veränderung aufgeschlüsselt |
| WF-10 | segment_pnl_waterfall | Nach Geschäftssegmenten |
| WF-11 | quarterly_bridge | Q1 → Q2 → Q3 → Q4 |
| WF-12 | forecast_variance_bridge | Forecast → Actual |

### 3.3 Stacked Bar Templates (8)

| ID | Name | Beschreibung |
|----|------|--------------|
| SB-01 | cost_structure_absolute | Kosten nach Kategorie (absolut) |
| SB-02 | cost_structure_percent | Kosten nach Kategorie (100%) |
| SB-03 | revenue_mix_trend_absolute | Revenue über Zeit (absolut) |
| SB-04 | revenue_mix_trend_percent | Revenue über Zeit (100%) |
| SB-05 | segment_comparison_stacked | Segmente nebeneinander |
| SB-06 | pnl_components_stacked | P&L als Stacked Bar |
| SB-07 | horizontal_cost_breakdown | Horizontal für lange Labels |
| SB-08 | budget_components_stacked | Budget-Zusammensetzung |

### 3.4 Bar Chart Templates (10)

| ID | Name | Beschreibung |
|----|------|--------------|
| BC-01 | actual_vs_budget | 2er Grouped Bar |
| BC-02 | actual_budget_forecast | 3er Grouped Bar |
| BC-03 | variance_bar_colored | Einzelne Serie, pos/neg Farben |
| BC-04 | ranking_horizontal | Top N, sortiert |
| BC-05 | monthly_trend | 12 Monate Zeitreihe |
| BC-06 | category_comparison | Kategorien vertikal |
| BC-07 | kpi_comparison_horizontal | KPIs horizontal |
| BC-08 | yoy_comparison_grouped | CY vs PY grouped |
| BC-09 | department_comparison | Abteilungen vergleichen |
| BC-10 | quarterly_comparison | Q1-Q4 nebeneinander |

### 3.5 Template-Struktur (JSON-Schema)

Jedes Template folgt diesem einheitlichen Schema:

```json
{
  "template_id": "pnl_waterfall_summary",
  "name": "P&L Executive Summary",
  "chart_type": "waterfall",
  
  "metadata": {
    "detail_level": "summary | standard | detail",
    "comparison_type": "single_period | period_comparison | variance",
    "perspective": "top_down | bottom_up | bridge",
    "target_audience": "executive | finance | operational",
    "analysis_perspective": "structure | comparison | composition | trend | ranking"
  },
  
  "structure": {
    "orientation": "vertical | horizontal",
    "start_point": "revenue | zero | prior_value",
    "end_point": "net_income | total | current_value",
    "items": [
      { "type": "start", "maps_to": "total_revenue" },
      { "type": "negative", "maps_to": "total_cogs" },
      { "type": "subtotal", "label": "Gross Profit" },
      { "type": "negative", "maps_to": "total_opex" },
      { "type": "end", "label": "Net Income" }
    ]
  },
  
  "styling": {
    "color_positive": "#2E7D32",
    "color_negative": "#C62828",
    "color_subtotal": "#1565C0",
    "show_connectors": true,
    "show_value_labels": true
  },
  
  "best_for": [
    "monthly_business_review",
    "board_presentation"
  ]
}
```

---

## 4. Runtime-Anpassung

Die Runtime-Engine übernimmt fünf Kernaufgaben, um die statischen Templates an konkrete Daten anzupassen. Der wichtigste Schritt ist das Ranking mit intelligenter Mix-Generierung.

### 4.1 Perspektiven-Matrix

Die KI verwendet eine Perspektiven-Matrix, um sicherzustellen, dass der generierte Chart-Mix verschiedene Blickwinkel auf die Daten abdeckt. Jede Perspektive beantwortet eine andere Frage:

| Perspektive | Frage | Primärer Charttyp | Beispiel-Template |
|-------------|-------|-------------------|-------------------|
| Struktur | Wie setzt sich das Ergebnis zusammen? | Waterfall | pnl_waterfall_summary |
| Varianz | Wo weichen wir vom Plan ab? | Waterfall / Bar | variance_bar_colored |
| Vergleich | Wie stehen Perioden zueinander? | Grouped Bar | actual_vs_budget |
| Zusammensetzung | Wie verteilen sich die Anteile? | Stacked Bar | cost_structure_percent |
| Trend | Wie entwickelt sich der Wert über Zeit? | Bar Chart | monthly_trend |
| Ranking | Was sind die größten Treiber? | Bar (horizontal) | ranking_horizontal |

Das Ziel ist, mindestens 4 verschiedene Perspektiven im Output abzudecken, um eine umfassende Analyse zu ermöglichen.

### 4.2 Ranking & Mix-Generierung

**Input:** 30 Templates + Daten-Profil + Perspektiven-Matrix  
**Output:** 1-10 Templates als intelligenter Mix verschiedener Charttypen (Anzahl vom User gewählt)

#### Auswahlkriterien

Die KI berücksichtigt drei Hauptkriterien bei der Auswahl:

**1. Perspektiven-Abdeckung:** Verschiedene Aspekte der Daten müssen beleuchtet werden (Struktur, Vergleich, Trend, Zusammensetzung, Ranking, Varianz).

**2. Zielgruppen-Mix:** 2-3 Executive-Level Charts (Summary), 3-4 Analyse-Charts (Detail), 2-3 Spezial-Perspektiven.

**3. Charttyp-Balance:** Nicht mehr als 5 Charts eines Typs. Mindestens 2 verschiedene Charttypen im Output.

#### Constraint: Keine Redundanz

Jeder Chart muss einen eigenen Mehrwert liefern. Die KI vermeidet:

- Mehrere fast identische Waterfalls mit minimalem Unterschied
- Redundante Vergleichscharts (z.B. Actual vs. Budget UND Budget vs. Actual)
- Charts, die die gleiche Information nur anders formatiert zeigen

### 4.3 Beispiel: Generierter Chart-Mix

Für einen P&L-Report mit 2 Perioden, Varianz-Spalte und 18 Zeilen generiert das System folgenden Mix:

| # | Template | Charttyp | Perspektive | Zweck |
|---|----------|----------|-------------|-------|
| 1 | pnl_waterfall_summary | Waterfall | Struktur | Executive Overview: Revenue → Net Income |
| 2 | pnl_waterfall_yoy_bridge | Waterfall | Varianz | YoY Veränderung als Bridge |
| 3 | variance_bar_colored | Bar | Varianz | Abweichungen farblich hervorgehoben |
| 4 | cost_structure_percent | Stacked Bar | Zusammensetzung | Kostenstruktur in Prozent |
| 5 | actual_vs_budget | Bar | Vergleich | Plan-Ist-Vergleich je Kategorie |
| 6 | margin_bridge | Waterfall | Struktur | Margin-Entwicklung detailliert |
| 7 | revenue_mix_trend_percent | Stacked Bar | Trend | Revenue-Mix über Zeit |
| 8 | ranking_horizontal | Bar | Ranking | Top 10 Kostentreiber |
| 9 | pnl_waterfall_detail | Waterfall | Struktur | Detailansicht für Finance |
| 10 | quarterly_comparison | Bar | Vergleich | Q1-Q4 Quartalsvergleich |

#### Mix-Zusammenfassung

- Waterfall: 4 Charts (Struktur + Varianz)
- Bar Chart: 4 Charts (Varianz + Vergleich + Ranking)
- Stacked Bar: 2 Charts (Zusammensetzung + Trend)

#### Perspektiven-Check

| Perspektive | Abgedeckt | Durch Charts |
|-------------|-----------|--------------|
| Struktur | ✓ | #1, #6, #9 |
| Varianz | ✓ | #2, #3 |
| Vergleich | ✓ | #5, #10 |
| Zusammensetzung | ✓ | #4 |
| Trend | ✓ | #7 |
| Ranking | ✓ | #8 |

### 4.4 Feld-Mapping

**Input:** Gewähltes Template + konkrete Datenfelder  
**Output:** Zuordnung Template-Felder → Daten-Spalten

Das Template definiert abstrakte Felder (z.B. "total_revenue"), die auf konkrete Spalten im Datensatz gemappt werden:

| Template-Feld | Daten-Spalte | Wert |
|---------------|--------------|------|
| total_revenue | Revenue_Total | 1.250.000 € |
| total_cogs | Cost_of_Sales | -780.000 € |
| gross_profit (berechnet) | Subtotal | 470.000 € |

### 4.5 Strukturanpassung

**Input:** Template-Struktur + verfügbare Datenfelder  
**Output:** Angepasste Struktur

Wenn Daten nicht 1:1 zum Template passen, wird die Struktur angepasst:

| Situation | Anpassung |
|-----------|-----------|
| Template erwartet 6 Items, Daten haben 4 | Items reduzieren |
| Template erwartet "EBIT", Daten haben "Operating Income" | Label-Mapping |
| Daten haben zusätzliche Zwischensumme | Subtotal einfügen |
| Negative Werte wo positive erwartet | Farblogik invertieren |

### 4.6 Edge Case Handling

Fälle, die kein Template direkt abdeckt:

| Edge Case | Lösung |
|-----------|--------|
| Nur 3 Zeilen im Report | Fallback auf einfachen Bar Chart |
| Alle Werte negativ | Waterfall-Logik invertieren |
| 50+ Zeilen | Automatisches Gruppieren / Top-N |
| Gemischte Hierarchien | Intelligentes Flattening |
| Fehlende Perioden-Daten | Single-Period Template wählen |
| Unbekannte Kategorie-Namen | Best-Effort Mapping + Hinweis |

### 4.7 Styling & Formatierung

Feintuning basierend auf Daten-Charakteristik:

| Aspekt | Entscheidung |
|--------|--------------|
| Zahlenformat | €, $, k, Mio basierend auf Größenordnung |
| Achsenskalierung | Min/Max basierend auf Werten |
| Label-Länge | Abkürzen wenn zu lang |
| Farbintensität | Bei Varianzen: je nach Abweichungsgröße |
| Sortierung | Bei Rankings: aufsteigend/absteigend |

---

## 5. KI-Prompts

Für jeden Runtime-Schritt wird ein spezifischer Prompt verwendet.

### 5.1 Prompt: Bibliotheks-Generierung (Offline)

Dieser Prompt wird einmalig verwendet, um die Template-Bibliothek zu erstellen:

```
## Rolle
Du bist ein Senior Financial Analyst und Data Visualization Expert.
Du erstellst eine Template-Bibliothek für automatisierte Finanz-Reporting-Tools.

## Aufgabe
Generiere für die Kombination [Report-Typ] + [Chartklasse] alle sinnvollen
Layout-Varianten.

## Input
Report-Typ: Income Statement (P&L)
Chartklasse: Waterfall

## Anforderungen an Varianten
Erzeuge Varianten entlang dieser Dimensionen:
1. Detailgrad: Summary (5-7 Items) vs. Detail (15+ Items)
2. Zeitvergleich: Single Period vs. Period Comparison vs. YoY Bridge
3. Perspektive: Top-down vs. Bottom-up vs. Bridge
4. Subtotal-Strategie: Minimal vs. Alle Margins vs. Custom Groupings
5. Zielgruppe: Board/Executive vs. Finance Team vs. Operational

## Output-Format (JSON Array)
[
  {
    "template_id": "pnl_waterfall_001",
    "name": "Executive P&L Bridge",
    "chart_type": "waterfall",
    "metadata": { ... },
    "structure": { ... },
    "styling": { ... },
    "best_for": [ ... ]
  }
]

## Generiere mindestens 8 sinnvoll unterschiedliche Varianten.
```

### 5.2 Prompt: Ranking & Mix-Generierung (Runtime)

Dieser Prompt ist der wichtigste Runtime-Prompt. Er stellt sicher, dass ein sinnvoller Mix aus verschiedenen Charttypen generiert wird:

```
## Rolle
Du bist ein Financial Visualization Expert.
Du wählst die optimale Kombination von Charts zur Darstellung eines
Finanzdatensatzes.

## Daten-Profil
{
  "report_type": "income_statement",
  "row_count": 18,
  "period_count": 2,
  "has_variance_column": true,
  "has_time_series": true,
  "available_fields": ["Revenue", "COGS", "Gross Profit", ...]
}

## Template-Bibliothek
[... 30 Templates: 12 Waterfall, 8 Stacked Bar, 10 Bar Chart ...]

## Aufgabe
Wähle bis zu 10 Templates, die ZUSAMMEN die beste Gesamtdarstellung ergeben.

WICHTIG - Erzeuge einen sinnvollen MIX:
- Verschiedene Charttypen für verschiedene Perspektiven
- Keine redundanten Darstellungen (z.B. nicht 3x fast identische Waterfalls)
- Jeder Chart muss einen EIGENEN Mehrwert liefern

## Auswahlkriterien

1. PERSPEKTIVEN-ABDECKUNG: Verschiedene Aspekte der Daten beleuchten
   - Struktur (Waterfall: Wie setzt sich das Ergebnis zusammen?)
   - Vergleich (Bar: Actual vs. Budget?)
   - Zusammensetzung (Stacked: Wie verteilen sich Kosten?)
   - Trend (Bar: Entwicklung über Zeit?)
   - Ranking (Bar horizontal: Was sind die größten Treiber?)
   - Varianz (Waterfall/Bar: Wo weichen wir ab?)

2. ZIELGRUPPEN-MIX:
   - 2-3 Executive-Level Charts (Summary)
   - 3-4 Analyse-Charts (Detail)
   - 2-3 Spezial-Perspektiven (Variance, Trend, Ranking)

3. CHARTTYP-BALANCE:
   - Nicht mehr als 5 Charts eines Typs
   - Mindestens 2 verschiedene Charttypen

## Output-Format
{
  "selected_charts": [
    {
      "rank": 1,
      "template_id": "pnl_waterfall_summary",
      "chart_type": "waterfall",
      "perspective": "structure",
      "purpose": "Executive Overview: Revenue to Net Income",
      "unique_value": "Zeigt Ergebnisstruktur auf einen Blick"
    },
    {
      "rank": 2,
      "template_id": "actual_vs_budget",
      "chart_type": "bar",
      "perspective": "comparison",
      "purpose": "Plan-Ist-Vergleich pro Kategorie",
      "unique_value": "Zeigt Abweichungen vom Budget"
    }
    // ... bis zu 10
  ],
  
  "mix_summary": {
    "waterfall": 4,
    "stacked_bar": 3,
    "bar": 3
  },
  
  "perspective_coverage": {
    "structure": true,
    "comparison": true,
    "composition": true,
    "trend": true,
    "ranking": true,
    "variance": true
  }
}
```

### 5.3 Prompt: Feld-Mapping (Runtime)

```
## Kontext
Du erhältst ein gewähltes Template und die verfügbaren Datenfelder.
Erstelle ein Mapping zwischen Template-Feldern und Daten-Spalten.

## Template-Struktur
{
  "items": [
    { "type": "start", "maps_to": "total_revenue" },
    { "type": "negative", "maps_to": "total_cogs" },
    { "type": "subtotal", "label": "Gross Profit" }
  ]
}

## Verfügbare Datenfelder
["Umsatz", "Materialkosten", "Personalkosten", "Sonstige Kosten",
 "Jahresüberschuss"]

## Aufgabe
1. Mappe jedes Template-Feld auf die beste passende Daten-Spalte
2. Markiere fehlende Felder
3. Identifiziere Felder, die berechnet werden müssen

## Output-Format
{
  "mappings": [
    { "template_field": "total_revenue", "data_field": "Umsatz" },
    { "template_field": "total_cogs", "data_field": "Materialkosten" },
    { "template_field": "gross_profit", "calculated": true,
      "formula": "Umsatz - Materialkosten" }
  ],
  "unmapped_template_fields": [],
  "unused_data_fields": ["Personalkosten", "Sonstige Kosten"]
}
```

### 5.4 Prompt: Strukturanpassung (Runtime)

```
## Kontext
Das Feld-Mapping hat Diskrepanzen zwischen Template und Daten ergeben.
Passe die Template-Struktur an.

## Problem
Template erwartet 7 Items, Daten haben nur 5 passende Felder.
Fehlende Felder: total_opex, tax_expense

## Optionen
1. Items entfernen, die nicht gemappt werden können
2. Felder aggregieren (z.B. alle Kosten als 'Total Costs')
3. Placeholder mit Wert 0 einfügen

## Aufgabe
Wähle die beste Option und liefere die angepasste Struktur.

## Output-Format
{
  "chosen_option": 1,
  "reason": "...",
  "adjusted_structure": {
    "items": [ ... ]
  }
}
```

### 5.5 Prompt: Edge Case Handling (Runtime)

```
## Kontext
Während der Verarbeitung wurde ein Edge Case erkannt.

## Problem
Template erwartet 2 Perioden für YoY-Vergleich.
Daten enthalten nur 1 Periode.

## Optionen
1. Fallback auf Single-Period Template (pnl_waterfall_summary)
2. Template anpassen (Vergleichsspalten entfernen)
3. Warnung ausgeben, Chart trotzdem rendern

## Aufgabe
Entscheide und liefere die Lösung.

## Output-Format
{
  "solution": "fallback",
  "new_template_id": "pnl_waterfall_summary",
  "user_message": "YoY-Vergleich nicht möglich. Zeige Single-Period."
}
```

---

## 6. Implementierungsplan

### 6.1 Phase 1: Bibliotheks-Aufbau

| Schritt | Aufwand | Output |
|---------|---------|--------|
| Report-Typen definieren | 1-2 Stunden | Liste der abzudeckenden Reports |
| Generierungs-Prompts entwickeln | 2-3 Stunden | Prompt-Templates |
| KI-Generierung durchlaufen | 1-2 Stunden | 30 Templates (Roh) |
| Review & Bereinigung | 3-4 Stunden | Finale Bibliothek (JSON) |

**Gesamtaufwand Phase 1:** ca. 1 Arbeitstag

### 6.2 Phase 2: Runtime-Engine

| Schritt | Aufwand | Output |
|---------|---------|--------|
| Data Profiler implementieren | 2-3 Tage | Profil-Extraktion |
| Ranking & Mix-Modul entwickeln | 2-3 Tage | Template-Selektion mit Mix-Logik |
| Mapping-Modul entwickeln | 2-3 Tage | Feld-Zuordnung |
| Anpassungs-Modul entwickeln | 2-3 Tage | Struktur-Modifikation |
| Integration & Testing | 2-3 Tage | Funktionsfähiges System |

**Gesamtaufwand Phase 2:** ca. 2 Arbeitswochen

### 6.3 Erfolgskriterien

- 95% der Standard-Finanzreports werden korrekt visualisiert
- Durchschnittliche Verarbeitungszeit < 5 Sekunden pro Report
- Manuelle Nacharbeit bei < 10% der generierten Charts erforderlich
- Template-Bibliothek ist erweiterbar ohne Code-Änderungen
- Generierter Mix deckt mindestens 4 verschiedene Perspektiven ab
- Keine redundanten Charts im Output (jeder Chart hat eigenen Mehrwert)

---

## 7. Anhang: Vollständige Template-Liste

### Waterfall (12 Templates)

- **WF-01:** pnl_waterfall_summary – Executive Summary, 6 Items, vertikal
- **WF-02:** pnl_waterfall_detail – Alle Zeilen, ca. 15 Items, vertikal
- **WF-03:** pnl_waterfall_yoy_bridge – PY Net Income → CY Net Income
- **WF-04:** pnl_waterfall_budget_bridge – Budget → Actual
- **WF-05:** pnl_waterfall_horizontal – Horizontal für breite Präsentationen
- **WF-06:** cashflow_waterfall – Operating → Investing → Financing
- **WF-07:** margin_bridge – Gross Margin → Net Margin Entwicklung
- **WF-08:** cost_variance_waterfall – Kostenabweichungen detailliert
- **WF-09:** revenue_bridge – Revenue-Veränderung aufgeschlüsselt
- **WF-10:** segment_pnl_waterfall – Nach Geschäftssegmenten
- **WF-11:** quarterly_bridge – Q1 → Q2 → Q3 → Q4
- **WF-12:** forecast_variance_bridge – Forecast → Actual

### Stacked Bar (8 Templates)

- **SB-01:** cost_structure_absolute – Kosten nach Kategorie (absolut)
- **SB-02:** cost_structure_percent – Kosten nach Kategorie (100%)
- **SB-03:** revenue_mix_trend_absolute – Revenue über Zeit (absolut)
- **SB-04:** revenue_mix_trend_percent – Revenue über Zeit (100%)
- **SB-05:** segment_comparison_stacked – Segmente nebeneinander
- **SB-06:** pnl_components_stacked – P&L als Stacked Bar
- **SB-07:** horizontal_cost_breakdown – Horizontal für lange Labels
- **SB-08:** budget_components_stacked – Budget-Zusammensetzung

### Bar Chart (10 Templates)

- **BC-01:** actual_vs_budget – 2er Grouped Bar
- **BC-02:** actual_budget_forecast – 3er Grouped Bar
- **BC-03:** variance_bar_colored – Einzelne Serie, pos/neg Farben
- **BC-04:** ranking_horizontal – Top N, sortiert
- **BC-05:** monthly_trend – 12 Monate Zeitreihe
- **BC-06:** category_comparison – Kategorien vertikal
- **BC-07:** kpi_comparison_horizontal – KPIs horizontal
- **BC-08:** yoy_comparison_grouped – CY vs PY grouped
- **BC-09:** department_comparison – Abteilungen vergleichen
- **BC-10:** quarterly_comparison – Q1-Q4 nebeneinander
