# Skill: Neues Layout hinzufügen

## Anwendung
Verwende diesen Skill wenn der User ein neues Chart-Layout anfordert. Der Skill stellt sicher, dass alle 3 korrespondierenden Dateien konsistent aktualisiert werden.

---

## Die 3 korrespondierenden Dateien

| Datei | Zweck | Wann anpassen? |
|-------|-------|----------------|
| `6. Bibliotheken/templates.json` | Layout-Struktur & Metadaten | **IMMER** |
| `4. Prompts/Prompts for Charts/[CHART]-PROMPT.md` | Rendering-Logik & Bar-Typen | Nur wenn NEUE Bar-Typen nötig |
| `6. Bibliotheken/chart-examples.json` | Few-Shot-Beispiele für KI | Nur wenn neues Output-Format nötig |

---

## Checkliste vor dem Hinzufügen

### 1. Chart-Typ identifizieren
- [ ] Waterfall? → Prefix `WF-XX`
- [ ] Bar Chart? → Prefix `BC-XX`
- [ ] Stacked Bar? → Prefix `SB-XX`

### 2. Benötigte Bar-Typen prüfen
Welche Bar-Typen braucht das neue Layout?

**Waterfall - Unterstützte Typen:**
- `start` - Startwert (voller Balken von 0)
- `increase` - Positive Änderung (schwebend, grün)
- `decrease` - Negative Änderung (hängend, rot)
- `end` - Endwert (voller Balken von 0)
- `compare` - Vergleichswert am ENDE (kein Connector)
- `budget` - Budget-Wert (wie start)
- `actual` - Ist-Wert (wie end)
- `target` - Zielwert (wie compare)

**⚠️ NICHT unterstützt (erfordern Prompt-Erweiterung):**
- `subtotal` - Zwischenergebnis
- `delta` - Dynamische Varianz (+/-)
- `reference` - Vergleichsbalken am ANFANG

**Bar Chart - Unterstützte Strukturen:**
- Single Bar (eine Reihe)
- Grouped Bar (mehrere Reihen)
- Horizontal / Vertical
- IST, PLAN, BUD, FC Styling

**⚠️ NICHT unterstützt:**
- VJ/PY Styling (fehlt im Prompt)

**Stacked Bar - Unterstützte Strukturen:**
- Absolute Stack
- Percent Stack (100%)
- Vertical

**⚠️ NICHT unterstützt:**
- Horizontal Stacked Bar (unvollständig)

### 3. Entscheidung treffen

```
Verwendet das Layout NUR bestehende Bar-Typen?
├── JA → Nur templates.json anpassen ✓
└── NEIN → Alle 3 Dateien anpassen!
    ├── 1. Prompt erweitern (neuer Bar-Typ)
    ├── 2. chart-examples.json (Beispiel hinzufügen)
    └── 3. templates.json (neues Template)
```

---

## Schritt-für-Schritt Anleitung

### Schritt 1: templates.json erweitern

**Datei:** `6. Bibliotheken/templates.json`

**Nächste freie ID ermitteln:**
- Waterfall: Suche höchste WF-XX → WF-(XX+1)
- Bar: Suche höchste BC-XX → BC-(XX+1)
- Stacked: Suche höchste SB-XX → SB-(XX+1)

**Template-Struktur:**
```json
{
  "template_id": "WF-13",
  "name": "unique_template_name",
  "display_name": "Anzeigename für UI",
  "chart_type": "waterfall",
  "metadata": {
    "detail_level": "summary|standard|detail",
    "comparison_type": "single_period|period_comparison|budget_comparison",
    "perspective": "top_down|bridge|contribution",
    "target_audience": "executive|finance|operational",
    "analysis_perspective": "structure|variance|trend"
  },
  "structure": {
    "orientation": "vertical|horizontal",
    "start_point": "feldname_aus_daten",
    "end_point": "feldname_aus_daten",
    "item_count": [min, max],
    "items": [
      { "type": "start", "maps_to": "field_name", "label": "Optional Label" },
      { "type": "increase|decrease", "maps_to": "field_name" },
      { "type": "end", "maps_to": "field_name" }
    ]
  },
  "styling": {
    "show_connectors": true,
    "show_value_labels": true
  },
  "best_for": ["use_case_1", "use_case_2"]
}
```

**Validierung:**
- [ ] `template_id` ist eindeutig
- [ ] `name` ist eindeutig (snake_case)
- [ ] Alle `type`-Werte sind im Prompt definiert
- [ ] `maps_to`-Felder sind sinnvoll
- [ ] `item_count` Range ist realistisch

---

### Schritt 2: Prompt erweitern (NUR wenn neuer Bar-Typ nötig)

**Datei:** `4. Prompts/Prompts for Charts/[CHART]-CHART-PROMPT.md`

**Zu ergänzen:**

1. **Farb-Definition** (Abschnitt "Farben"):
```javascript
colors: {
    // ... bestehende ...
    neuer_typ: '#HEXCODE',  // Beschreibung
}
```

2. **Rendering-Logik** (Abschnitt "Bar-Typen"):
```javascript
// neuer_typ: Beschreibung des Verhaltens
// - Wie wird der Balken gezeichnet?
// - Von wo nach wo geht er?
// - Hat er Connector-Linien?
```

3. **Beispiel-Output** (Abschnitt "Beispiele"):
```json
{ "type": "neuer_typ", "label": "Beispiel", "value": 100, "displayValue": "100 T€" }
```

**Validierung:**
- [ ] Farbe ist definiert
- [ ] Rendering-Verhalten ist beschrieben
- [ ] Beispiel ist vorhanden
- [ ] Prompt ist syntaktisch korrekt (Markdown)

---

### Schritt 3: chart-examples.json erweitern (NUR wenn neues Format nötig)

**Datei:** `6. Bibliotheken/chart-examples.json`

**Neues Beispiel hinzufügen:**
```json
{
  "id": "unique_example_id",
  "language": "de|en",
  "description": "Kurze Beschreibung",
  "use_case": "Wann wird dieses Format verwendet",
  "config": {
    "title": "Chart Titel",
    "subtitle": "in Einheit",
    "bars": [
      { "type": "start", "label": "Start\nLabel", "value": 100, "displayValue": "100 T€" },
      { "type": "neuer_typ", "label": "Neu\nLabel", "value": 50, "displayValue": "+50 T€" },
      { "type": "end", "label": "End\nLabel", "value": 150, "displayValue": "150 T€" }
    ],
    "bracket": { "show": true, "fromIndex": 0, "toIndex": 2, "label": "+50%" }
  }
}
```

**Validierung:**
- [ ] `id` ist eindeutig
- [ ] Alle Bar-Typen sind im Prompt definiert
- [ ] `displayValue` hat korrektes Format
- [ ] Bracket-Indizes sind korrekt

---

## Validierungs-Zusammenfassung

Nach dem Hinzufügen prüfen:

```
┌─────────────────────────────────────────────────────────────┐
│ KONSISTENZ-CHECK                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. templates.json                                           │
│    ├── [ ] Neue Template-ID ist eindeutig                   │
│    ├── [ ] Alle Bar-Typen existieren im Prompt              │
│    └── [ ] Metadaten sind vollständig                       │
│                                                             │
│ 2. [CHART]-CHART-PROMPT.md (nur wenn neuer Typ)             │
│    ├── [ ] Neuer Bar-Typ ist farblich definiert             │
│    ├── [ ] Rendering-Logik ist beschrieben                  │
│    └── [ ] Beispiel-Output enthält neuen Typ                │
│                                                             │
│ 3. chart-examples.json (nur wenn neues Format)              │
│    ├── [ ] Beispiel-ID ist eindeutig                        │
│    ├── [ ] Config verwendet nur definierte Bar-Typen        │
│    └── [ ] DisplayValue-Format ist konsistent               │
│                                                             │
│ 4. Funktionstest                                            │
│    ├── [ ] Template erscheint in TemplateLoader             │
│    ├── [ ] KI generiert gültigen Output                     │
│    └── [ ] SVG wird korrekt gerendert                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Beispiel: Neues Layout "Multi-Reference Bridge"

**Anforderung:** Waterfall mit 2 Vergleichsbalken (PY, BUD) am Anfang, dann P&L Bridge

### Analyse:
- Chart-Typ: Waterfall
- Benötigte Bar-Typen: `reference` (NEU!), `start`, `increase`, `decrease`, `end`
- → Alle 3 Dateien müssen angepasst werden!

### 1. Prompt erweitern (WATERFALL-CHART-PROMPT.md):
```javascript
// reference: Vergleichsbalken am ANFANG
// - Voller Balken von 0 bis Wert
// - Wie 'start', aber ohne Connector zum nächsten Bar
// - Typisch für PY, BUD als Kontext vor der eigentlichen Bridge
colors: {
    reference: '#9CA3AF',  // Grau für Vergleichswerte
}
```

### 2. chart-examples.json erweitern:
```json
{
  "id": "multi_reference_bridge_de",
  "language": "de",
  "description": "Bridge mit Vergleichsbalken am Anfang",
  "use_case": "PY + BUD Kontext vor P&L Bridge",
  "config": {
    "title": "P&L Bridge mit Vorjahresvergleich",
    "subtitle": "in Mio. EUR",
    "bars": [
      { "type": "reference", "label": "PY\n2024", "value": 180, "displayValue": "180 Mio" },
      { "type": "reference", "label": "BUD\n2025", "value": 200, "displayValue": "200 Mio" },
      { "type": "start", "label": "Umsatz\n2025", "value": 210, "displayValue": "210 Mio" },
      { "type": "decrease", "label": "COGS", "value": -85, "displayValue": "-85 Mio" },
      { "type": "decrease", "label": "OpEx", "value": -45, "displayValue": "-45 Mio" },
      { "type": "end", "label": "EBIT\n2025", "value": 80, "displayValue": "80 Mio" }
    ]
  }
}
```

### 3. templates.json erweitern:
```json
{
  "template_id": "WF-13",
  "name": "pnl_multi_reference_bridge",
  "display_name": "P&L Bridge mit Vergleichsbalken",
  "chart_type": "waterfall",
  "metadata": {
    "detail_level": "standard",
    "comparison_type": "multi_reference",
    "perspective": "bridge",
    "target_audience": "executive",
    "analysis_perspective": "variance"
  },
  "structure": {
    "orientation": "vertical",
    "start_point": "current_revenue",
    "end_point": "current_result",
    "item_count": [6, 12],
    "reference_bars": ["prior_year_value", "budget_value"],
    "items": [
      { "type": "reference", "maps_to": "prior_year_value", "label": "VJ" },
      { "type": "reference", "maps_to": "budget_value", "label": "Budget" },
      { "type": "start", "maps_to": "current_revenue" },
      { "type": "decrease", "maps_to": "total_costs" },
      { "type": "end", "maps_to": "current_result" }
    ]
  },
  "styling": {
    "show_connectors": true,
    "show_value_labels": true,
    "reference_gap": 20
  },
  "best_for": ["variance_analysis", "budget_review", "management_reporting"]
}
```

---

## Häufige Fehler

| Fehler | Symptom | Lösung |
|--------|---------|--------|
| Bar-Typ nicht im Prompt | KI generiert falschen Output | Prompt erweitern |
| Template-ID doppelt | Überschreibt bestehendes Template | Eindeutige ID wählen |
| maps_to-Feld ungültig | KI findet keine Daten | Feldnamen aus Daten-Analyse verwenden |
| item_count zu restriktiv | Template wird nie ausgewählt | Range erweitern |
| Kein Beispiel für neuen Typ | KI rät Output-Format | chart-examples.json erweitern |

---

## Quick Reference

```
NEUES LAYOUT HINZUFÜGEN
=======================

Nur bestehende Bar-Typen?
│
├── JA ──────────────────────────────────────────────┐
│   Nur templates.json anpassen:                     │
│   1. Nächste freie ID ermitteln                    │
│   2. Template-Objekt erstellen                     │
│   3. In templates.json einfügen                    │
│   FERTIG ✓                                         │
│                                                    │
└── NEIN ────────────────────────────────────────────┘
    Alle 3 Dateien anpassen:

    1. WATERFALL/BAR/STACKED-BAR-CHART-PROMPT.md
       → Neuen Bar-Typ definieren (Farbe + Rendering)

    2. chart-examples.json
       → Beispiel mit neuem Bar-Typ hinzufügen

    3. templates.json
       → Neues Template mit neuem Bar-Typ

    FERTIG ✓
```
