# Projekt: KI-gestützte Finanzvisualisierung

Automatisierte Chart-Generierung für Finanzreports mit intelligentem Mix aus Waterfall, Stacked Bar und Bar Charts.

## Projektstruktur

```
Reportautomatisierung_V10.0/
├── 1. Konzept/                    # Konzeptdokumentation
│   └── Konzept_KI_Finanzvisualisierung.md
├── 3. HTML-Seiten/                # Frontend (Workflow)
│   ├── upload.html                # 1. Daten-Upload + Analyse
│   ├── results.html               # 2. Ergebnisanzeige + Chart-Auswahl
│   ├── colors.html                # 3. Farbschema (optional)
│   └── charts.html                # 4. Chart-Generierung + Export
├── 4. Prompts/                    # Prompt-Definitionen (Source of Truth)
│   ├── COLOR-SCHEMA-PROMPT.md
│   ├── RANKING-MIX-PROMPT.md
│   ├── FIELD-MAPPING-PROMPT.md
│   └── Prompts for Charts/
│       ├── BAR-CHART-PROMPT.md
│       ├── STACKED-BAR-CHART-PROMPT.md
│       └── WATERFALL-CHART-PROMPT.md
├── 5. Datenbeispiele/             # Testdaten (CSV, Excel)
│   ├── GuV_Faktentabelle.csv
│   ├── GuV_Report.xlsx
│   └── ...
├── 6. Bibliotheken/               # Modulare Konfigurationen (JSON)
│   ├── templates.json             # 30 Chart-Templates
│   ├── color-schemes.json         # Farbpaletten (modular erweiterbar)
│   └── chart-examples.json        # Beispiel-Configs für KI-Training
├── 7. Skills/                     # Rollen-Definitionen
│   ├── architect.md
│   ├── tester.md
│   ├── clean-coder.md
│   └── documenter.md
└── .claude/skills/                # Claude Code Skills
    └── chart-prompt-sync.md       # Prompt-Synchronisation
```

## Wichtige Regeln

### PromptLoader-System

Die Markdown-Dateien in `4. Prompts/` sind die **Source of Truth**. Der `PromptLoader` in `charts.html` lädt diese Dateien **vollständig** und cached sie mit Hash-Validierung.

#### Vollständiges Laden (keine Marker mehr!)

**Seit Version 10:** Prompts werden **vollständig** geladen, keine Marker-Extraktion mehr.

- Alle `<!-- PROMPT-START/END/INCLUDE -->` Marker wurden aus den Chart-Prompt-Dateien entfernt
- Der komplette Prompt-Inhalt wird an die API gesendet
- Bessere KI-Qualität durch mehr Kontext
- Kostenoptimierung erfolgt über **Anthropic Prompt Caching** (nicht Marker)

#### Hash-basierte Cache-Validierung

Der PromptLoader erkennt automatisch Dateiänderungen:

```javascript
// Cache-Struktur
cache: {
    promptName: {
        content: "vollständiger Prompt-Inhalt",
        hash: "a3f5b2c1",  // 32-bit Hash des Inhalts
        timestamp: 1706234567890,
        size: 51234,
        tokens: 12808
    }
}
```

**Cache-Validierung:**
- Bei jedem `load()` wird der Hash der Datei berechnet
- Wenn Hash identisch → aus Cache laden (kein Re-Fetch nötig)
- Wenn Hash unterschiedlich → neu laden und Cache aktualisieren
- `validateCache()` prüft alle gecachten Prompts gegen aktuelle Dateien
- `refreshInvalidCache()` lädt geänderte Prompts automatisch neu

#### Prompt-Dateien bearbeiten

Bei Änderungen an Prompts:
1. Die `.md`-Datei in `4. Prompts/` aktualisieren
2. Der PromptLoader erkennt die Änderung automatisch (Hash-Vergleich)
3. Prompt wird beim nächsten API-Call neu geladen

**Wichtig:** Die JavaScript-Konstanten in `charts.html` (z.B. `BAR_CHART_PROMPT`) existieren nicht mehr! Der PromptLoader lädt die `.md`-Dateien direkt.

**Prompt-Mapping:**
| Prompt-Name | Datei | Größe |
|-------------|-------|-------|
| `waterfall` | `Prompts for Charts/WATERFALL-CHART-PROMPT.md` | ~51 KB |
| `bar` | `Prompts for Charts/BAR-CHART-PROMPT.md` | ~38 KB |
| `stacked_bar` | `Prompts for Charts/STACKED-BAR-CHART-PROMPT.md` | ~39 KB |
| `ranking_mix` | `RANKING-MIX-PROMPT.md` | ~8 KB |
| `field_mapping` | `FIELD-MAPPING-PROMPT.md` | ~4 KB |
| `color_schema` | `COLOR-SCHEMA-PROMPT.md` | ~3 KB |

### Anthropic Prompt Caching

**Kostenoptimierung durch Anthropic's Prompt Caching API:**

Das System nutzt Anthropic's `cache_control` Feature um bis zu **90% Kosten** bei wiederholten API-Calls zu sparen.

#### Wie es funktioniert

1. **Erster API-Call** (Cache-Write):
   - System-Prompt wird mit `cache_control: { type: 'ephemeral' }` gesendet
   - Anthropic cached den Prompt serverseitig (TTL: 5 Minuten)
   - Kosten: +25% Aufschlag (einmalig)

2. **Folgende API-Calls** (Cache-Hit):
   - Gleicher System-Prompt wird aus Anthropic-Cache gelesen
   - **90% günstiger** als normaler Input
   - TTL wird bei Nutzung automatisch verlängert

#### Console-Output

```
// Erster Call:
APIClient: Prompt Caching aktiviert (~12808 Tokens, TTL: 5 Min)
Cache geschrieben: 12808 Tokens (TTL: 5 Min, +25% einmalig)

// Folgende Calls (innerhalb 5 Min):
APIClient: Prompt Caching aktiviert (~12808 Tokens, TTL: 5 Min)
✓ CACHE HIT: 12808 Tokens aus Anthropic-Cache gelesen (90% günstiger)
```

#### Voraussetzungen

- Mindestens 1024 Tokens (Anthropic Minimum für Claude Sonnet)
- Nur bei Anthropic-Provider (nicht OpenAI)
- System-Prompt muss identisch sein (Byte für Byte)

### Chart-Typen

Nur 3 Chart-Typen sind implementiert:
- **Waterfall** (Bridge Charts) - Für P&L-Bridges, Varianzanalysen
- **Stacked Bar** - Für Zusammensetzungen, Kostenstrukturen
- **Bar Chart** - Für Vergleiche, Rankings, Trends

**KEINE Line-Charts!** Falls jemand Line-Charts erwähnt oder implementieren möchte: Diese wurden bewusst entfernt.

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

- 30 Templates in `6. Bibliotheken/templates.json`
- 12 Waterfall + 8 Stacked Bar + 10 Bar Chart
- KI wählt optimalen Mix basierend auf Daten-Profil

### Chart-Mix vs. Einzeltyp

- **Chart-Mix** ist der **Standard** auf results.html - generiert eine Auswahl verschiedener Chart-Typen
- User kann explizit einen Einzeltyp wählen (Waterfall, Bar, Stacked Bar)
- Wichtige Unterscheidung im Code:
  - `primaryChart`: KI-Empfehlung aus der Analyse (welcher Typ passt am besten)
  - `selectedChart`: User-Auswahl (was soll generiert werden)

**Ähnlichkeitsprüfung im Chart-Mix:**
- Bevor ein Chart generiert wird, prüft das System auf Layout-Ähnlichkeit zu bereits generierten Charts
- Charts mit >80% Ähnlichkeit (gleiche Struktur, ähnliche Datenpunkte) werden übersprungen
- Reduziert Redundanz und API-Kosten
- Im Ergebnisprotokoll sichtbar: "Chart X übersprungen (ähnliches Layout wie Chart Y)"

### Zwei Modi

Das System kennt nur **zwei Modi**:
- **`ai`** (KI-generiert): Echte API-Calls an Anthropic/OpenAI
- **`demo`**: Vordefinierte Demo-Daten ohne API-Calls

**Kein Rule-Based Fallback!** Wenn die KI fehlschlägt, gibt es keine lokale Fallback-Logik.

## Skills

### `/chart-prompt-sync`
Prompts zwischen .md und HTML synchronisieren. Verwende diesen Skill wenn:
- Du einen Prompt ändern möchtest
- Du prüfen willst ob Prompts synchron sind
- Du die Struktur eines Prompts verstehen möchtest

### `/architect`
Planungs-Modus für neue Features. Erstellt detaillierte Implementierungspläne.

### `/tester`
Test-Erstellung. Generiert Test-Szenarien und Testdaten.

### `/clean-coder`
Refactoring. Verbessert Code-Qualität ohne Funktionsänderungen.

### `/documenter`
Dokumentation aktualisieren. Hält Konzept und README synchron.

## API-Unterstützung

Das System unterstützt zwei API-Provider:
- **Anthropic** (Claude) - Standard
- **OpenAI** (GPT-4) - Alternative

User wählt Provider in `upload.html`.

## Entwicklungshinweise

### Lokale Entwicklung
**WICHTIG:** Die HTML-Seiten müssen über einen lokalen HTTP-Server geöffnet werden (wegen CORS bei JSON-Dateien):
```bash
cd /Users/fabiankrogmann/Claude/Reportautomatisierung_V10.0
python3 -m http.server 8000
```
Dann im Browser: `http://localhost:8000/3.%20HTML-Seiten/upload.html`

### Debugging
- Browser DevTools Console für JavaScript-Fehler
- `sessionStorage` im Application-Tab prüfen für Datenfluss
- API-Calls im Network-Tab beobachten
- **Bei Problemen:** SessionStorage löschen (DevTools → Application → Storage → Session Storage → Einträge für localhost löschen)

### Erweiterungen (Modular)

Das System ist modular aufgebaut. Folgende Erweiterungen sind **ohne Code-Änderungen** möglich:

| Erweiterung | Datei | Beschreibung |
|-------------|-------|--------------|
| Neue Farbpalette | `color-schemes.json` | JSON-Eintrag hinzufügen → automatisch in colors.html sichtbar |
| Neue Beispiel-Config | `chart-examples.json` | Trainingsbeispiele für KI-Generierung |
| Neues Template | `templates.json` | Neue Chart-Variante für den Mix-Algorithmus |
| Neue Perspektive | `RANKING-MIX-PROMPT.md` | Dokumentation + Template-Zuordnung |

**NICHT erweiterbar ohne Code-Änderungen:**
- Chart-Typen (nur Waterfall, Bar, Stacked Bar - bewusst limitiert)
- API-Provider (nur Anthropic + OpenAI)

### Modulare Dateien

#### `color-schemes.json`
Enthält alle Farbpaletten. Format:
```json
{
  "schemes": {
    "schemeId": {
      "name": "Anzeigename",
      "description": "Beschreibung",
      "colors": ["#hex1", "#hex2", ...],
      "chart_mapping": { ... }
    }
  }
}
```

#### `chart-examples.json`
Enthält Beispiel-Konfigurationen für jeden Chart-Typ. Die KI nutzt diese als Formatvorlage.
```json
{
  "examples": {
    "waterfall": [
      { "id": "...", "language": "de", "config": { ... } }
    ],
    "bar": [ ... ],
    "stacked_bar": [ ... ]
  }
}
```

## Bekannte Probleme & Lösungen

### JSON Parse Errors bei KI-Generierung
**Problem:** API-Antworten werden manchmal abgeschnitten, was zu ungültigem JSON führt.
**Lösung:** `parseJSON()` in charts.html hat eine 5-Schritt-Reparatur-Strategie:
1. Offene Strings schließen
2. Klammern zählen
3. Unvollständige Elemente entfernen
4. Fehlende Klammern hinzufügen
5. Aggressives Kürzen als Fallback

**maxTokens:** Auf 16384 gesetzt um Abschneiden zu minimieren.

### Chart-Mix wird nicht ausgewählt
**Problem:** Bei Auswahl von "Chart-Mix" wurde trotzdem nur ein Einzeltyp generiert.
**Lösung:** results.html setzt `selectedChart` jetzt immer auf `'chart-mix'` als Default, außer der User wählt explizit anders.

### PromptLoader Debug-Informationen
Im Browser-Console werden beim Laden der Prompts folgende Infos angezeigt:
- Dateiname, Größe (Zeichen), Token-Schätzung
- Hash für Cache-Validierung
- Cache-Status (fresh, cache, reload)

**Beispiel-Output:**
```
PromptLoader: 'waterfall' geladen (51234 Zeichen, ~12808 Tokens, Hash: a3f5b2c1)
PromptLoader: 'bar' aus Cache (Hash: b7e2d4a9, ~9523 Tokens)
PromptLoader: Alle 6 Prompts geladen (143.2 KB, ~35800 Tokens gesamt)
```

### Anthropic Cache Debug-Informationen
Bei API-Calls werden Cache-Statistiken angezeigt:

```
// Cache-Write (erster Call):
APIClient: Prompt Caching aktiviert (~12808 Tokens, TTL: 5 Min)
Cache geschrieben: 12808 Tokens (TTL: 5 Min, +25% einmalig)
APIClient: Input-Tokens gesamt: 13500, Output: 2048

// Cache-Hit (Folge-Calls):
APIClient: Prompt Caching aktiviert (~12808 Tokens, TTL: 5 Min)
✓ CACHE HIT: 12808 Tokens aus Anthropic-Cache gelesen (90% günstiger)
APIClient: Input-Tokens gesamt: 13500, Output: 1856
```
