# Projekt: KI-gestützte Finanzvisualisierung

Automatisierte Chart-Generierung für Finanzreports mit Waterfall, Stacked Bar und Bar Charts. Die KI empfiehlt den optimalen Chart-Typ, der User wählt explizit.

## Projektstruktur

```
Reportautomatisierung_V0.3/
├── 1. Konzept/                    # Konzeptdokumentation
│   └── Konzept_KI_Finanzvisualisierung.md
├── 3. HTML-Seiten/                # Frontend (Workflow)
│   ├── upload.html                # 1. Daten-Upload + Analyse (PROMPT-1)
│   ├── results.html               # 2. Ergebnisanzeige + Chart-Auswahl
│   ├── colors.html                # 3. Farbschema (optional)
│   ├── charts.html                # 4. Chart-Generierung + Export (nur HTML/CSS + Script-Tags)
│   ├── pipeline-test.html         # 5. Pipeline-Validierung (Test-Tool)
│   └── js/                        # Externalisierte JavaScript-Module
│       ├── template-loader.js     # Globale Variablen, ConfigLoader, TemplateLoader
│       ├── api-client.js          # APIClient + JSON-Reparatur
│       ├── prompt-loader.js       # PromptLoader (nur variant_generator)
│       ├── data-profiler.js       # DataProfiler
│       ├── deterministic-config.js # ChartMixer + DeterministicConfigGenerator
│       ├── normalize-config.js    # normalizeConfigForRenderer + Fingerprint
│       ├── ui-helpers.js          # UI-Funktionen, Reasoning, Tooltip
│       ├── renderer-waterfall.js  # renderWaterfallChart()
│       ├── renderer-bar.js        # renderBarChart()
│       ├── renderer-stacked.js    # renderStackedBarChart()
│       ├── export-engine.js       # SVG/PNG/HTML/ZIP Download
│       └── main.js                # initializeCharts + Orchestrierung
├── 4. Prompts/                    # Prompt-Definitionen (Source of Truth)
│   ├── PROMPT-1-UNIVERSAL-ANALYZER.md    # Datenanalyse + Extraktion
│   ├── PROMPT-2-VARIANT-GENERATOR.md     # Varianten-Generierung
│   ├── COLOR-SCHEMA-PROMPT.md            # Farbschema (colors.html)
│   ├── PROMPT-INTEGRITY-VALIDATOR.md     # Pipeline-Integritätsprüfung
│   ├── archiv/                           # Archivierte Prompts
│   │   ├── PROMPT-3-CONFIG-GENERATOR (archiviert).md
│   │   ├── BAR-CHART-PROMPT (archiviert).md
│   │   ├── STACKED-BAR-CHART-PROMPT (archiviert).md
│   │   ├── WATERFALL-CHART-PROMPT (archiviert).md
│   │   ├── DATA-ANALYZER-PROMPT (archiviert).md
│   │   ├── PERSPECTIVE-DERIVATION-PROMPT (archiviert).md
│   │   ├── LAYOUT-RANKING-PROMPT (archiviert).md
│   │   ├── FIELD-MAPPING-PROMPT (archiviert).md
│   │   └── RANKING-MIX-PROMPT.md.archived
│   ├── Features/                         # Modulare Feature-Definitionen
│   │   └── Waterfall/                    # Feature-Module für Waterfall-Charts
│   │       ├── _FEATURE-CATALOG.md       # Aktivierungsregeln + Konflikte
│   │       ├── _TEMPLATE-MATRIX.md       # Feature-Kompatibilität pro Template
│   │       ├── BRACKET.md               # Prozentuale Veränderung
│   │       ├── SCALE-BREAK.md           # Skalenbruch
│   │       ├── CATEGORY-BRACKET.md      # Anteil-Annotationen
│   │       ├── ARROWS.md               # Balken-Verbindungen
│   │       ├── BENCHMARK-LINES.md       # Horizontale Zielwert-Linien
│   │       ├── NEGATIVE-BRIDGES.md      # Negative Waterfall-Logik
│   │       └── GROUPING.md             # Balken-Gruppierung
│   └── Prompts for Charts/
│       └── Analyse/
│           └── WATERFALL-FEATURE-ANALYSE.md
├── 5. Datenbeispiele/             # Testdateien (CSV, Excel)
│   ├── Testdaten_1/               # 50 Testdateien (Basis)
│   ├── Testdaten_2/               # 51 Testdateien (Erweitert)
│   └── Testdaten_3/               # 77 Testdateien (SaaS/ARR/MRR Szenarien)
├── 6. Bibliotheken/               # Modulare Konfigurationen (JSON)
│   ├── templates.json             # 39 Chart-Templates (inkl. Feature-Metadaten)
│   ├── color-schemes.json         # Farbpaletten (modular erweiterbar)
│   └── chart-examples.json        # Beispiel-Configs für KI-Training
├── 6. Beispiele/                  # Legacy HTML Chart-Beispiele
├── scripts/                       # Offline-Batch-Utilities (generate-full-configs.js, enrich-features.js)
├── 7. Skills/                     # Rollen-Definitionen
│   ├── architect.md
│   ├── tester.md
│   ├── clean-coder.md
│   ├── documenter.md
│   └── new-layout.md              # Neues Layout erstellen
└── .claude/skills/                # Claude Code Skills
    ├── chart-prompt-sync.md       # Prompt-Verwaltung
    ├── new-layout.md              # Neues Layout erstellen
    └── prompt-integrity-check.md  # Prompt-Integritätsprüfung
```

## Wichtige Regeln

### Prompt-Pipeline

Das System verwendet eine 2-stufige KI-Pipeline + deterministische Config-Generierung:

- **PROMPT-1** (upload.html): KI-Datenanalyse — bleibt KI-gestützt
- **PROMPT-2** (charts.html): KI-Varianten-Generierung — bleibt KI-gestützt
- **DeterministicConfigGenerator** (js/deterministic-config.js): Ersetzt PROMPT-3 — reines JavaScript
- **JS-Rendering-Engine** (js/renderer-*.js): Ersetzt Chart-Prompts — `renderWaterfallChart()`, `renderBarChart()`, `renderStackedBarChart()`

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

**Einsparung:** ~94.000 Tokens pro Durchlauf (96%) — von 14 API-Calls auf 2.

### Prompt-Dateien

| # | Prompt | Datei | Status | Output |
|---|--------|-------|--------|--------|
| 1 | Universal Analyzer | `PROMPT-1-UNIVERSAL-ANALYZER.md` | **KI (aktiv)** | analysisResult |
| 2 | Variant Generator | `PROMPT-2-VARIANT-GENERATOR.md` | **KI (aktiv)** | variants[] |
| 3 | Config Generator | `archiv/PROMPT-3-CONFIG-GENERATOR (archiviert).md` | **Ersetzt durch `DeterministicConfigGenerator`** | chartConfig |
| 4 | Waterfall Chart | `archiv/WATERFALL-CHART-PROMPT (archiviert).md` | **Ersetzt durch JS-Renderer** | SVG |
| 5 | Bar Chart | `archiv/BAR-CHART-PROMPT (archiviert).md` | **Ersetzt durch JS-Renderer** | SVG |
| 6 | Stacked Bar Chart | `archiv/STACKED-BAR-CHART-PROMPT (archiviert).md` | **Ersetzt durch JS-Renderer** | SVG |

**Zusätzlich:**
- `COLOR-SCHEMA-PROMPT.md` – für dynamische Farbgenerierung in colors.html
- `PROMPT-INTEGRITY-VALIDATOR.md` – Pipeline-Integritätsprüfung (Template-IDs, Szenario-Formeln)

**Archiviert (in `4. Prompts/archiv/`):**
- PROMPT-3-CONFIG-GENERATOR (archiviert).md
- BAR-CHART-PROMPT (archiviert).md
- STACKED-BAR-CHART-PROMPT (archiviert).md
- WATERFALL-CHART-PROMPT (archiviert).md
- DATA-ANALYZER-PROMPT (archiviert).md
- PERSPECTIVE-DERIVATION-PROMPT (archiviert).md
- LAYOUT-RANKING-PROMPT (archiviert).md
- FIELD-MAPPING-PROMPT (archiviert).md
- RANKING-MIX-PROMPT.md.archived

### Spracherhaltung (KRITISCH)

**GRUNDREGEL:**
Alle Begriffe, Labels, Namen und Bezeichnungen aus den Quelldaten müssen EXAKT so beibehalten werden.

**VERBOTEN:**
- ✗ Übersetzen (DE→EN oder EN→DE)
- ✗ Umformulieren oder "Verbessern"
- ✗ Kürzen oder Abkürzen
- ✗ Synonyme verwenden

**ERLAUBT:**
- ✓ Intelligente Aggregation (Positionen zu Blöcken zusammenfassen)
- ✓ Neue Aggregate in Quellsprache benennen

Diese Regel gilt für die gesamte Pipeline (alle Prompts).

### PromptLoader-System

Die Markdown-Dateien in `4. Prompts/` sind die **Source of Truth**. Der `PromptLoader` in `charts.html` lädt diese Dateien **vollständig** und cached sie mit Hash-Validierung.

**Single Source of Truth:**
```
4. Prompts/*.md  ←── Source of Truth (einzige Stelle!)
       │
       │ PromptLoader.load()
       ▼
   HTML-Seiten (laden zur Laufzeit)
```

**WICHTIG:** Prompts werden NICHT in HTML eingebettet, sondern zur Laufzeit geladen!

#### Hash-basierte Cache-Validierung

```javascript
cache: {
    promptName: {
        content: "vollständiger Prompt-Inhalt",
        hash: "a3f5b2c1",      // 32-bit Hash
        timestamp: 1706234567890,
        size: 51234,
        tokens: 12808
    }
}
```

**Cache-Validierung:**
- Bei jedem `load()` wird der Hash der Datei berechnet
- Hash identisch → aus Cache laden
- Hash unterschiedlich → neu laden und Cache aktualisieren

**Aktuell geladene Prompts:**
- `variant_generator` — einziger Prompt der in charts.html geladen wird
- PROMPT-1 wird separat in upload.html geladen
- config_generator und Chart-Prompts werden NICHT mehr geladen (deterministisch ersetzt)

### Anthropic Prompt Caching

Das System nutzt Anthropic's `cache_control` Feature für bis zu **90% Kosteneinsparung**.
Primär relevant für PROMPT-1 (upload.html) und PROMPT-2 (charts.html) — die einzigen verbleibenden API-Calls.

1. **Erster API-Call** (Cache-Write):
   - System-Prompt mit `cache_control: { type: 'ephemeral' }` senden
   - +25% Aufschlag (einmalig)

2. **Folgende API-Calls** (Cache-Hit):
   - Gleicher Prompt aus Cache → 90% günstiger
   - TTL wird bei Nutzung verlängert (5 Minuten)

### Chart-Typen

Nur 3 Chart-Typen sind implementiert:
- **Waterfall** (Bridge Charts) - Für P&L-Bridges, Varianzanalysen
- **Stacked Bar** - Für Zusammensetzungen, Kostenstrukturen
- **Bar Chart** - Für Vergleiche, Rankings, Trends

**KEINE Line-Charts!** Diese wurden bewusst entfernt.

### Datenfluss

```
upload.html → results.html → colors.html → charts.html
    │              │              │              │
    │              │              │              └── Chart-Generierung + Export
    │              │              └── Farbschema wählen (optional)
    │              └── Analyse anzeigen, Chart-Typ wählen
    └── Datei hochladen, KI analysiert
```

Daten werden via `sessionStorage` zwischen den Seiten übergeben.

### Template-Bibliothek

- 39 Templates in `6. Bibliotheken/templates.json`
- 19 Waterfall (WF-01 bis WF-19, inkl. Layout-Varianten mit Compare-Bars)
- 10 Stacked Bar (SB-01 bis SB-10)
- 10 Bar Chart (BC-01 bis BC-10)

**Layout-Varianten (WF-14 bis WF-19):** Templates mit Compare-Bars Feature, das zusätzliche Szenario-Werte (z.B. FC, BUD) als schmale Vergleichsbalken neben den Haupt-Bridge-Bars anzeigt.

### Varianten-Generierung

Das System generiert 3-10 unterschiedliche Varianten pro Chart-Typ:

**MUSS-REGELN:**
1. Keine Duplikate (jede Variante muss sich deutlich unterscheiden)
2. Echter Mehrwert (jede Variante zeigt etwas Neues)
3. Sinnvolle Anzahl (Qualität vor Quantität)
4. Daten müssen existieren (keine Phantasie-Perspektiven)

**Duplikat-Erkennung (Daten-basiert):**
```javascript
fingerprint = `${chartType}:${perspectiveId}:${titleHash}:${dataStructure}`
```

### Modus

Das System kennt nur **einen Modus**:
- **`deterministic`** (Standard): PROMPT-2 (KI) + DeterministicConfigGenerator + JS-Renderer

**Kein Fallback!** Fehler werden angezeigt, kein stilles Fallback.

## Skills

### `/chart-prompt-sync`
Prompt-Verwaltung. Verwende diesen Skill wenn:
- Du einen Prompt ändern möchtest
- Du prüfen willst ob Prompts aktuell sind
- Du die Struktur eines Prompts verstehen möchtest

### `/architect`
Planungs-Modus für neue Features. Erstellt detaillierte Implementierungspläne.

### `/tester`
Test-Erstellung. Generiert Test-Szenarien und Testdaten.

### `/clean-coder`
Refactoring. Verbessert Code-Qualität ohne Funktionsänderungen.

### `/documenter`
Dokumentation aktualisieren. Hält Konzept und CLAUDE.md synchron.

### `/prompt-integrity`
Integritätsprüfung der Prompt-Pipeline. Verwende diesen Skill wenn:
- Ein neues Template hinzugefügt wurde
- Änderungen an PROMPT-1 oder PROMPT-2 vorgenommen wurden
- Neue Szenario- oder Zeitreihen-Perspektiven ergänzt wurden

Prüft: Template-IDs, Szenario-Formeln, Zeitreihen-Templates, Spracherhaltung, Dokumentations-Sync.

## Modulare Erweiterbarkeit

### Ohne Code-Änderungen erweiterbar

| Erweiterung | Datei | Beschreibung |
|-------------|-------|--------------|
| Neue Farbpalette | `color-schemes.json` | JSON-Eintrag hinzufügen |
| Neues Template | `templates.json` | Template-Objekt hinzufügen |
| Neues Trainingsbeispiel | `chart-examples.json` | Example hinzufügen |

### Chart-Typ hinzufügen

1. JS-Renderer implementieren: `render[Typ]Chart()` Funktion in `charts.html`
2. DeterministicConfigGenerator erweitern: `_generate[Typ]Config()` Methode
3. Templates definieren in `templates.json`
4. Variant Generator erweitern
5. UI anpassen in `results.html`
6. Dokumentation aktualisieren

### Feature hinzufügen

Features sind in modularen Feature-Dateien organisiert:

| Ort | Inhalt |
|-----|--------|
| `Features/[ChartType]/_FEATURE-CATALOG.md` | Aktivierungsregeln, Konflikte, Rendering-Reihenfolge |
| `Features/[ChartType]/_TEMPLATE-MATRIX.md` | Feature-Kompatibilität pro Template |
| `Features/[ChartType]/[FEATURE].md` | Rendering-Logik, CSS, Edge-Cases, Beispiele |
| `templates.json` → `availableFeatures[]` | Welche Features für welches Template verfügbar |
| `templates.json` → `featureHints{}` | Empfohlene Modi/Parameter |

**Neues Feature erstellen:**
1. Feature-Datei erstellen: `Features/[ChartType]/[FEATURE].md` (10-Sektionen-Format)
2. Aktivierungsregel in `_FEATURE-CATALOG.md` ergänzen
3. Template-Kompatibilität in `_TEMPLATE-MATRIX.md` eintragen
4. `templates.json` um `availableFeatures` + `featureHints` erweitern
5. Aktivierungslogik in `DeterministicConfigGenerator._activateFeatures()` ergänzen

**Feature-Architektur:**
- `DeterministicConfigGenerator._activateFeatures()` aktiviert Features deterministisch (basierend auf `_FEATURE-CATALOG.md` Regeln)
- `normalizeConfigForRenderer()` wandelt Feature-Format für JS-Renderer um
- JS-Rendering-Engine rendert aktive Features (bracket, scaleBreak, categoryBrackets, etc.)
- Aktuell implementiert: 7 Waterfall-Features
- Noch nicht implementiert: Bar Chart Features, Stacked Bar Features

### Feature-Architektur (Waterfall)

7 modulare Features in `4. Prompts/Features/Waterfall/`:

| Feature | ID | Kategorie | Status |
|---------|-----|-----------|--------|
| Bracket | `bracket` | annotation | implementiert |
| Scale-Break | `scaleBreak` | layout | implementiert |
| Category-Brackets | `categoryBrackets` | annotation | implementiert |
| Arrows | `arrows` | annotation | implementiert |
| Benchmark-Lines | `benchmarkLines` | layout | implementiert |
| Negative Bridges | `negativeBridges` | layout | implementiert |
| Grouping | `grouping` | layout | implementiert |

**Prozess:**
- `DeterministicConfigGenerator._activateFeatures()` prüft Regeln aus `_FEATURE-CATALOG.md`
- Output: `chartConfig.features: { bracket: { enabled: true, ... }, ... }`
- `normalizeConfigForRenderer()` wandelt in flaches Format für JS-Renderer
- Feature-Konflikte werden deterministisch aufgelöst (z.B. bracket vs. arrows, scaleBreak vs. negativeBridges)

**Noch nicht implementiert:** Bar Chart Features, Stacked Bar Features

## API-Unterstützung

Das System unterstützt zwei API-Provider:
- **Anthropic** (Claude) - Standard, mit Prompt Caching
- **OpenAI** (GPT-4) - Alternative

User wählt Provider in `upload.html`.

## Entwicklungshinweise

### Lokale Entwicklung
**WICHTIG:** Die HTML-Seiten müssen über einen lokalen HTTP-Server geöffnet werden:
```bash
cd /Users/fabiankrogmann/Claude/Reportautomatisierung_V0.3
python3 -m http.server 8000
```
Dann im Browser: `http://localhost:8000/3.%20HTML-Seiten/upload.html`

### Debugging
- Browser DevTools Console für JavaScript-Fehler
- `sessionStorage` im Application-Tab prüfen
- API-Calls im Network-Tab beobachten
- **Bei Problemen:** SessionStorage löschen

### Testdateien — Testdaten_3 (50 Stück)

Die Testdateien in `5. Datenbeispiele/Testdaten_3/` (Nr. 51-100) decken Multi-Szenario-Formate ab:

| Kategorie | Anzahl | Fokus |
|-----------|--------|-------|
| GuV / P&L | 12 | IST vs FC vs BUD, Iterationen, SaaS/ARR/MRR |
| Bilanz | 6 | PY vs CY, Opening/Closing, Konzern |
| Cashflow | 5 | Direct/Indirect, FCF Bridge, Iterations |
| Segmente | 5 | by Region, by BU, Multi-Dim |
| Kosten | 6 | OpEx, CapEx, Cost Center |
| KPIs | 5 | Dashboard, Financial Ratios, Operational |
| Personal | 3 | Headcount, Salary, Personnel Cost |
| Sales/Revenue | 4 | Pipeline, Order Intake |
| Working Capital / Treasury | 4 | DSO/DPO/DIO, Liquidity |

## Bekannte Probleme & Lösungen

### JSON Parse Errors bei KI-Generierung
**Problem:** API-Antworten (PROMPT-1, PROMPT-2) werden manchmal abgeschnitten.
**Lösung:** 5-Schritt-Reparatur-Strategie in `parseJSON()`. Nur noch relevant für die 2 verbleibenden KI-Calls.

### Chart-Auswahl für Export
User kann per Checkbox wählen, welche Charts exportiert werden sollen.

### PromptLoader Debug-Informationen
Nur noch `variant_generator` wird in charts.html geladen:
```
PromptLoader: 'variant_generator' geladen (23456 Zeichen, ~5864 Tokens, Hash: c4d2e1f3)
```

## Dokumentations-Synchronisation

**WICHTIG:** Bei JEDER Änderung müssen beide Dateien aktuell gehalten werden:
- `1. Konzept/Konzept_KI_Finanzvisualisierung.md`
- `CLAUDE.md`

Verwende `/documenter` Skill für systematische Aktualisierung.
