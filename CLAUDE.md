# Projekt: KI-gestützte Finanzvisualisierung

Automatisierte Chart-Generierung für Finanzreports mit Waterfall, Stacked Bar und Bar Charts. Die KI empfiehlt den optimalen Chart-Typ, der User wählt explizit.

## Projektstruktur

```
Reportautomatisierung_V0.3/
├── 1. Konzept/                    # Konzeptdokumentation
│   ├── Konzept_KI_Finanzvisualisierung.md
│   └── ARCHITEKTUR-FINALE-V2.md   # Architektur-Entscheidungen
├── 3. HTML-Seiten/                # Frontend (Workflow)
│   ├── upload.html                # 1. Daten-Upload + Analyse (PROMPT-1)
│   ├── results.html               # 2. Ergebnisanzeige + Chart-Auswahl
│   ├── colors.html                # 3. Farbschema (optional)
│   └── charts.html                # 4. Chart-Generierung + Export (PROMPT-2, 3, 4-6)
├── 4. Prompts/                    # Prompt-Definitionen (Source of Truth)
│   ├── PROMPT-1-UNIVERSAL-ANALYZER.md    # Datenanalyse + Extraktion
│   ├── PROMPT-2-VARIANT-GENERATOR.md     # Varianten-Generierung
│   ├── PROMPT-3-CONFIG-GENERATOR.md      # Config-Erstellung
│   ├── COLOR-SCHEMA-PROMPT.md            # Farbschema (colors.html)
│   ├── archiv/                           # Archivierte Prompts
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
│   │       ├── FOOTNOTES.md             # Fußnoten
│   │       ├── ARROWS.md               # Balken-Verbindungen
│   │       ├── BENCHMARK-LINES.md       # Horizontale Zielwert-Linien
│   │       ├── NEGATIVE-BRIDGES.md      # Negative Waterfall-Logik
│   │       └── GROUPING.md             # Balken-Gruppierung
│   └── Prompts for Charts/
│       ├── BAR-CHART-PROMPT.md           # → SVG direkt
│       ├── STACKED-BAR-CHART-PROMPT.md   # → SVG direkt
│       └── WATERFALL-CHART-PROMPT.md     # → SVG direkt
├── 5. Datenbeispiele/             # 50 Testdateien (CSV, Excel)
│   ├── 01_GuV_Monatssicht_IST_FC_BUD.xlsx
│   ├── 02_GuV_Faktentabelle_SEL_CUM.csv
│   └── ... (weitere 48 Dateien)
├── 6. Bibliotheken/               # Modulare Konfigurationen (JSON)
│   ├── templates.json             # 40 Chart-Templates (inkl. Feature-Metadaten)
│   ├── color-schemes.json         # Farbpaletten (modular erweiterbar)
│   └── chart-examples.json        # Beispiel-Configs für KI-Training
├── 7. Skills/                     # Rollen-Definitionen
│   ├── architect.md
│   ├── tester.md
│   ├── clean-coder.md
│   └── documenter.md
└── .claude/skills/                # Claude Code Skills
    └── chart-prompt-sync.md       # Prompt-Verwaltung
```

## Wichtige Regeln

### Prompt-Pipeline (6 Prompts)

Das System verwendet eine konsolidierte 6-stufige Prompt-Pipeline:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│   CSV/Excel Upload                                                               │
│        │                                                                         │
│        ▼                                                                         │
│   ╔═══════════════════════════════╗                                             │
│   ║ PROMPT 1: Universal Analyzer  ║  ← upload.html                              │
│   ╚═══════════════════════════════╝  ← Output: analysis, extractedData, hierarchy│
│        │                                                                         │
│        │ User wählt Chart-Typ in results.html                                   │
│        │ User wählt Farbschema in colors.html                                   │
│        ▼                                                                         │
│   ╔═══════════════════════════════╗                                             │
│   ║ PROMPT 2: Variant Generator   ║  ← charts.html                              │
│   ╚═══════════════════════════════╝  ← Output: variants[] (3-10 Varianten)      │
│        │                                                                         │
│        ▼                                                                         │
│   ┌────────────────────────────────────────────────────────────────┐            │
│   │           FÜR JEDE VARIANTE                                     │            │
│   │                                                                 │            │
│   │   ╔═══════════════════════════════╗                            │            │
│   │   ║ PROMPT 3: Config Generator    ║  ← charts.html             │            │
│   │   ╚═══════════════════════════════╝  ← Output: chartConfig     │            │
│   │        │                                                        │            │
│   │        ▼                                                        │            │
│   │   ╔═══════════════════════════════╗                            │            │
│   │   ║ PROMPT 4-6: Chart Prompt      ║  ← WATERFALL/BAR/STACKED   │            │
│   │   ╚═══════════════════════════════╝  ← Output: fertiges SVG    │            │
│   │        │                                                        │            │
│   │        ▼                                                        │            │
│   │   Fingerprint-Check → chartConfigs.push() oder skip            │            │
│   └────────────────────────────────────────────────────────────────┘            │
│        │                                                                         │
│        ▼                                                                         │
│   Export (ZIP/PPTX)                                                             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Hinweis:** Die Chart-Prompts (4-6) generieren direkt fertiges SVG – kein separater SVG-Renderer nötig.

### Prompt-Dateien

| # | Prompt | Datei | Ersetzt | Output |
|---|--------|-------|---------|--------|
| 1 | Universal Analyzer | `PROMPT-1-UNIVERSAL-ANALYZER.md` | DATA-ANALYZER | analysisResult |
| 2 | Variant Generator | `PROMPT-2-VARIANT-GENERATOR.md` | PERSPECTIVE-DERIVATION + LAYOUT-RANKING | variants[] |
| 3 | Config Generator | `PROMPT-3-CONFIG-GENERATOR.md` | FIELD-MAPPING | chartConfig |
| 4 | Waterfall Chart | `Prompts for Charts/WATERFALL-CHART-PROMPT.md` | - | **SVG** |
| 5 | Bar Chart | `Prompts for Charts/BAR-CHART-PROMPT.md` | - | **SVG** |
| 6 | Stacked Bar Chart | `Prompts for Charts/STACKED-BAR-CHART-PROMPT.md` | - | **SVG** |

**Zusätzlich:**
- `COLOR-SCHEMA-PROMPT.md` – für dynamische Farbgenerierung in colors.html

**Archiviert (in `4. Prompts/archiv/`):**
- DATA-ANALYZER-PROMPT (archiviert).md
- PERSPECTIVE-DERIVATION-PROMPT (archiviert).md
- LAYOUT-RANKING-PROMPT (archiviert).md
- FIELD-MAPPING-PROMPT (archiviert).md

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

### Anthropic Prompt Caching

Das System nutzt Anthropic's `cache_control` Feature für bis zu **90% Kosteneinsparung**:

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

- 40 Templates in `6. Bibliotheken/templates.json`
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

### Zwei Modi

Das System kennt nur **zwei Modi**:
- **`ai`** (KI-generiert): Echte API-Calls an Anthropic/OpenAI
- **`demo`**: Vordefinierte Demo-Daten ohne API-Calls

**Kein Rule-Based Fallback!** Wenn die KI fehlschlägt, gibt es keine lokale Fallback-Logik.

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
- Änderungen an PROMPT-1, PROMPT-2 oder PROMPT-3 vorgenommen wurden
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

1. Prompt erstellen: `4. Prompts/Prompts for Charts/[TYP]-CHART-PROMPT.md`
2. Templates definieren in `templates.json`
3. Variant Generator erweitern
4. UI anpassen in `results.html`
5. Dokumentation aktualisieren

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
5. FEATURE-INCLUDE Marker in Chart-Prompt ergänzen

**Feature-Architektur:**
- PROMPT-3 analysiert Features autonom (Aktivierungsregeln + Parameter-Berechnung)
- Chart-Prompt rendert nur aktive Features (via `config.features`)
- Feature-Module werden per Compile-Time Loading eingefügt (nur aktive Features)
- Aktuell implementiert: 8 Waterfall-Features
- Noch nicht implementiert: Bar Chart Features, Stacked Bar Features (Platzhalter in PROMPT-3)

### Feature-Architektur (Waterfall)

8 modulare Features in `4. Prompts/Features/Waterfall/`:

| Feature | ID | Kategorie | Status |
|---------|-----|-----------|--------|
| Bracket | `bracket` | annotation | implementiert |
| Scale-Break | `scaleBreak` | layout | implementiert |
| Category-Brackets | `categoryBrackets` | annotation | implementiert |
| Footnotes | `footnotes` | annotation | implementiert |
| Arrows | `arrows` | annotation | implementiert |
| Benchmark-Lines | `benchmarkLines` | layout | implementiert |
| Negative Bridges | `negativeBridges` | layout | implementiert |
| Grouping | `grouping` | layout | implementiert |

**Prozess:**
- PROMPT-3 erhält `featureCatalog` und entscheidet autonom welche Features aktiviert werden
- Output: `chartConfig.features: { bracket: { enabled: true, ... }, ... }`
- Chart-Prompt rendert Features basierend auf `config.features`
- Feature-Konflikte werden automatisch aufgelöst (z.B. bracket vs. arrows)

**Noch nicht implementiert:** Bar Chart Features, Stacked Bar Features (Platzhalter in PROMPT-3)

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

### Testdateien (50 Stück)

Die Testdateien in `5. Datenbeispiele/` decken alle gängigen Finanzreport-Formate ab:

| Kategorie | Anzahl |
|-----------|--------|
| GuV / P&L | 8 |
| Bilanz | 6 |
| Cashflow | 5 |
| Segmente | 7 |
| Sales | 6 |
| Kosten | 6 |
| Personal | 3 |
| KPIs/Bridges | 5 |
| Sonderformate | 4 |

## Bekannte Probleme & Lösungen

### JSON Parse Errors bei KI-Generierung
**Problem:** API-Antworten werden manchmal abgeschnitten.
**Lösung:** 5-Schritt-Reparatur-Strategie in `parseJSON()`.

### Chart-Auswahl für Export
User kann per Checkbox wählen, welche Charts exportiert werden sollen.

### PromptLoader Debug-Informationen
```
PromptLoader: 'waterfall' geladen (51234 Zeichen, ~12808 Tokens, Hash: a3f5b2c1)
PromptLoader: 'bar' aus Cache (Hash: b7e2d4a9, ~9523 Tokens)
```

## Dokumentations-Synchronisation

**WICHTIG:** Bei JEDER Änderung müssen beide Dateien aktuell gehalten werden:
- `1. Konzept/Konzept_KI_Finanzvisualisierung.md`
- `CLAUDE.md`

Verwende `/documenter` Skill für systematische Aktualisierung.
