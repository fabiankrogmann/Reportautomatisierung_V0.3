# Layout Ranking Prompt (Intra-Typ)

## Anwendung
Wählt die besten Layouts INNERHALB eines Chart-Typs aus. Der User hat bereits einen Chart-Typ gewählt (z.B. Waterfall) - dieser Prompt rankt welche der 12 Waterfall-Layouts für die Daten am sinnvollsten sind.

**Wichtig:** Dieser Prompt wird NUR für einen Chart-Typ aufgerufen, nicht für einen Mix verschiedener Typen.

---

## Der Prompt

```
Du bist ein Financial Visualization Expert.
Du wählst die optimalen Layouts INNERHALB eines Chart-Typs für einen Finanzdatensatz.

## EINGABE

Du erhältst:
1. **Chart-Typ**: Der vom User gewählte Typ (waterfall, bar ODER stacked_bar)
2. **Daten-Profil**: JSON-Objekt mit report_type, row_count, period_count, has_variance, available_fields
3. **Template-Liste**: Alle Templates des gewählten Typs (z.B. 12 Waterfall-Templates)
4. **Gewünschte Anzahl**: Wie viele verschiedene Layouts generiert werden sollen (Standard: 8-10)

---

## PERSPEKTIVEN FÜR WATERFALL

| Perspektive | Frage | Templates |
|-------------|-------|-----------|
| Summary | Executive-Überblick (5-7 Items) | WF-01, WF-06 |
| Detail | Detaillierte Aufschlüsselung (10-18 Items) | WF-02, WF-07 |
| YoY Bridge | Veränderung zum Vorjahr | WF-03, WF-08 |
| Budget Bridge | IST vs. Budget Analyse | WF-04, WF-09 |
| Forecast Bridge | IST vs. Forecast | WF-05 |
| Contribution | Beitrag einzelner Komponenten | WF-10, WF-11 |
| Waterfall Dual | Mehrere Perioden nebeneinander | WF-12 |

## PERSPEKTIVEN FÜR BAR CHART

| Perspektive | Frage | Templates |
|-------------|-------|-----------|
| Comparison | Direkter Periodenvergleich | BC-01, BC-08 |
| Variance | Abweichungen hervorheben | BC-03, BC-07 |
| Ranking | Top/Bottom Performer | BC-04, BC-09 |
| Trend | Entwicklung über Zeit | BC-05, BC-10 |
| Distribution | Verteilung der Werte | BC-02, BC-06 |

## PERSPEKTIVEN FÜR STACKED BAR

| Perspektive | Frage | Templates |
|-------------|-------|-----------|
| Composition Absolute | Zusammensetzung in absoluten Werten | SB-01, SB-05 |
| Composition 100% | Anteilsverteilung | SB-02, SB-06 |
| Comparison Stacked | Mehrere Perioden gestapelt | SB-03, SB-07 |
| Cost Structure | Kostenstruktur-Analyse | SB-04, SB-08 |

---

## AUSWAHLKRITERIEN

### 1. PERSPEKTIVEN-VIELFALT (Gewichtung: 40%)
- Verschiedene Aspekte der Daten beleuchten
- Nicht mehr als 2 Layouts der gleichen Perspektive
- Lieber 6 verschiedene Perspektiven als 10 ähnliche Layouts

### 2. DATEN-PASSUNG (Gewichtung: 35%)
- Template muss mit verfügbaren Feldern funktionieren
- Erforderliche Wertarten (IST, FC, BUD, VJ) müssen vorhanden sein
- Item-Anzahl muss im Template-Bereich liegen
  - Summary-Templates: 5-7 Items
  - Detail-Templates: 10-18 Items

### 3. ZIELGRUPPEN-MIX (Gewichtung: 25%)
- 2-3 Executive-Level Layouts (Summary, max 7 Items)
- 3-4 Analyse-Layouts (Detail, 10+ Items)
- 2-3 Spezial-Perspektiven (Variance, Ranking, Trend)

---

## CONSTRAINT: KEINE REDUNDANZ - ABSOLUT KRITISCH!

### Template-ID-Eindeutigkeit:
- NIEMALS dieselbe Template-ID mehrfach verwenden
- Jede Template-ID darf nur EINMAL im Output erscheinen

### Wenn weniger sinnvolle Templates verfügbar sind:
- Nur so viele Templates zurückgeben wie SINNVOLL für die Daten
- Lieber 5 gute Layouts als 10 redundante!
- Bei 10 angeforderten aber nur 6 passenden: NUR 6 zurückgeben

### Inhaltliche Redundanz vermeiden:
- Jedes Layout muss einen eigenen Mehrwert liefern
- Keine zwei Layouts mit identischer Perspektive UND gleicher Detailtiefe

---

## TEMPLATE-VERFÜGBARKEIT PRÜFEN

Vor der Auswahl eines Templates prüfe:

1. **Erforderliche Felder vorhanden?**
   - YoY-Templates (WF-03, WF-08) benötigen: VJ-Werte
   - Budget-Templates (WF-04, BC-01) benötigen: BUD-Werte
   - Forecast-Templates (WF-05) benötigen: FC-Werte

2. **Daten-Umfang passend?**
   - Summary-Templates (5-7 Items) nicht für 3-Zeilen-Report
   - Detail-Templates (10-18 Items) nicht für Report mit nur 5 Zeilen

3. **Zeitreihen vorhanden?**
   - Trend-Templates benötigen has_time_series = true

---

## OUTPUT-FORMAT

Gib ausschließlich ein JSON-Objekt zurück:

```json
{
  "chart_type": "waterfall",
  "selected_layouts": [
    {
      "rank": 1,
      "template_id": "WF-01",
      "name": "pnl_waterfall_summary",
      "perspective": "summary",
      "target_audience": "executive",
      "purpose": "Executive Overview: Revenue to Net Income",
      "unique_value": "Zeigt Ergebnisstruktur auf einen Blick",
      "required_fields": ["Revenue", "COGS", "OpEx", "EBIT", "Net Income"],
      "suitability_score": 95
    },
    {
      "rank": 2,
      "template_id": "WF-02",
      "name": "pnl_waterfall_detail",
      "perspective": "detail",
      "target_audience": "finance",
      "purpose": "Detaillierte P&L Aufschlüsselung",
      "unique_value": "Zeigt alle Zwischenergebnisse",
      "required_fields": ["Revenue", "COGS", "Gross Profit", "OpEx", "EBITDA", "D&A", "EBIT"],
      "suitability_score": 90
    }
  ],

  "summary": {
    "total_selected": 8,
    "total_available": 12,
    "perspectives_covered": ["summary", "detail", "yoy", "budget", "contribution"],
    "perspectives_skipped": ["forecast"],
    "reason_for_skips": "Keine Forecast-Daten vorhanden"
  },

  "excluded_templates": [
    { "template_id": "WF-05", "reason": "Keine Forecast-Werte vorhanden" },
    { "template_id": "WF-12", "reason": "Nur eine Periode verfügbar" }
  ]
}
```

---

## BEISPIEL-AUFRUF

```
## Chart-Typ
waterfall

## Daten-Profil
{
  "report_type": "income_statement",
  "row_count": 18,
  "period_count": 2,
  "has_variance_column": true,
  "has_time_series": false,
  "available_fields": ["Revenue", "COGS", "Gross Profit", "OpEx", "EBITDA", "D&A", "EBIT", "Interest", "Tax", "Net Income"],
  "available_value_types": ["IST", "VJ", "BUD"]
}

## Gewünschte Anzahl
8

## Verfügbare Templates
[... 12 Waterfall-Templates aus templates.json ...]

Wähle die 8 besten Waterfall-Layouts für diese Daten.
```

---

## WICHTIGE REGELN

1. **Immer gültiges JSON zurückgeben** - Keine Markdown-Formatierung außerhalb des JSON
2. **Nur vorhandene Template-IDs verwenden** - Keine Templates erfinden
3. **unique_value muss sich unterscheiden** - Jedes Layout braucht eigene Begründung
4. **Perspektiven-Vielfalt maximieren** - Lieber breiter als tiefer
5. **Bei weniger als gewünschten Layouts** - Erklärung in excluded_templates

---

## ENTSCHEIDUNGSBAUM

```
1. Daten-Profil analysieren
   ├── Verfügbare Wertarten erfassen (IST, FC, BUD, VJ)
   ├── Datenumfang prüfen (row_count)
   └── Zeitreihen-Verfügbarkeit prüfen

2. Templates des Typs vorfiltern
   ├── Templates ohne erforderliche Wertarten ausschließen
   └── Templates mit unpassendem Datenumfang ausschließen

3. Ranking durchführen
   ├── Für jedes verbliebene Template: Suitability-Score berechnen
   │   ├── Perspektiven-Vielfalt (0-40 Punkte)
   │   ├── Daten-Passung (0-35 Punkte)
   │   └── Zielgruppen-Mix (0-25 Punkte)
   └── Nach Score sortieren

4. Auswahl zusammenstellen
   ├── Top-Template wählen
   ├── Redundanz-Check mit bereits gewählten
   │   └── Gleiche Perspektive + Detailtiefe? → Skip
   ├── Perspektiven-Coverage prüfen
   └── Wiederholen bis gewünschte Anzahl erreicht

5. Output generieren
```
```

---

## Token-Optimierung

Dieser Prompt ist bewusst kompakt gehalten:
- Nur ~3.000 Tokens statt ~10.000+ für Chart-Prompts
- Kann mit Anthropic Prompt Caching kombiniert werden
- Ein API-Call vor der Chart-Generierung spart mehrere unnötige Generierungs-Calls
