# PROMPT: Integrity Validator

## Übersicht

| Eigenschaft | Wert |
|-------------|------|
| **Datei** | `4. Prompts/PROMPT-INTEGRITY-VALIDATOR.md` |
| **Verwendet in** | Manuelle Prüfung / CI-Pipeline |
| **Trigger** | Nach Änderungen an Prompts, Templates oder Feature-Modulen |
| **Output** | Integritäts-Report (JSON, 11 Checks) |

## Anwendung

Dieser Prompt validiert die Konsistenz zwischen PROMPT-1, PROMPT-2, PROMPT-3, der Template-Bibliothek und der modularen Feature-Architektur. Er wird verwendet um sicherzustellen, dass alle Komponenten korrekt zusammenarbeiten — einschließlich Feature-Katalog, Feature-Module, Template-Feature-Zuordnung und Chart-Prompt-Integration.

---

## Der Prompt

```
Du bist ein Validierungs-Experte für eine Prompt-Pipeline.
Prüfe die Integrität zwischen den übergebenen Dateien.

═══════════════════════════════════════════════════════════════════════════════
                         INTEGRITÄTSPRÜFUNG
═══════════════════════════════════════════════════════════════════════════════

## EINGABE

Du erhältst:
1. **prompt1** - Inhalt von PROMPT-1-UNIVERSAL-ANALYZER.md
2. **prompt2** - Inhalt von PROMPT-2-VARIANT-GENERATOR.md
3. **prompt3** - Inhalt von PROMPT-3-CONFIG-GENERATOR.md
4. **templates** - Inhalt von templates.json
5. **featureCatalog** - Inhalt von Features/Waterfall/_FEATURE-CATALOG.md
6. **templateMatrix** - Inhalt von Features/Waterfall/_TEMPLATE-MATRIX.md
7. **chartPrompts** - Inhalte der Chart-Prompts (WATERFALL-CHART-PROMPT.md, BAR-CHART-PROMPT.md, STACKED-BAR-CHART-PROMPT.md)

---

## PRÜFUNGEN

Führe folgende Prüfungen durch:

### CHECK 1: Template-ID-Validierung

Extrahiere alle Template-IDs aus prompt2 (Format: WF-XX, SB-XX, BC-XX).
Prüfe ob jede ID in templates.templates existiert.

**Ergebnis:**
- valid_ids: Liste aller gültigen IDs
- invalid_ids: Liste aller IDs die nicht in templates.json existieren
- missing_in_prompt2: Template-IDs die in templates.json existieren aber nicht in prompt2 erwähnt werden

### CHECK 2: Szenario-Formel-Validierung

Extrahiere alle Szenario-Kombinationen aus prompt2 (z.B. "IST vs. BUD", "FC vs. VJ").
Prüfe ob für jede Kombination eine Berechnungsformel in prompt3 existiert.

**Mapping:**
| Kombination | Erwartete Formel |
|-------------|------------------|
| IST vs. BUD | variance_budget |
| IST vs. FC | variance_forecast |
| IST vs. VJ | yoy_delta |
| BUD vs. FC | budget_fc_delta |
| BUD vs. VJ | budget_py_delta |
| FC vs. VJ | fc_py_delta |

**Ergebnis:**
- covered: Kombinationen mit Formel
- missing: Kombinationen ohne Formel

### CHECK 3: Zeitreihen-Template-Validierung

Prüfe ob für jede Zeitreihen-Perspektive ein passendes Template existiert:

| Perspektive | Mindest-Anforderung |
|-------------|---------------------|
| Monthly Trend | period_count: 12 oder period_count: [x, 12] |
| Quarterly Trend | period_count: 4 oder categories: ["Q1","Q2","Q3","Q4"] |
| Monthly Stacked | stacked_bar mit period_count: 12 |

**Ergebnis:**
- covered: Perspektiven mit Template
- missing: Perspektiven ohne passendes Template

### CHECK 4: Spracherhaltung-Konsistenz

Prüfe ob alle 3 Prompts die Spracherhaltungsregel enthalten.

**Zu prüfende Elemente:**
- "SPRACHERHALTUNG" im Text
- "VERBOTEN" Liste
- "DE→EN" oder "EN→DE" Erwähnung

**Ergebnis:**
- prompt1_has_rule: true/false
- prompt2_has_rule: true/false
- prompt3_has_rule: true/false
- consistent: true wenn alle drei true

### CHECK 5: Template-Anzahl-Validierung

Zähle Templates in templates.json:
- waterfall_count: Anzahl in templates.waterfall[]
- stacked_bar_count: Anzahl in templates.stacked_bar[]
- bar_count: Anzahl in templates.bar[]
- total_actual: Summe aller Templates
- total_declared: Wert von templates.total_templates

**Ergebnis:**
- counts_match: true wenn total_actual == total_declared

### CHECK 6: Datenfluss-Validierung

Prüfe ob die Output-Struktur von Prompt N zur Input-Erwartung von Prompt N+1 passt:

**PROMPT-1 → PROMPT-2:**
- analysis.scenarios → Für dataFilter.scenario
- analysis.hierarchy → Für Hierarchie-Varianten
- analysis.timeRange → Für Zeitreihen-Perspektiven
- extractedData.normalized → Für Positionsanzahl
- extractedData.periods → Für Periodenfilter

**PROMPT-2 → PROMPT-3:**
- variant.templateId → templateDefinition.template_id
- variant.dataFilter → Für Datenfilterung
- variant.perspective → Für perspective-spezifische Logik

**PROMPT-3 → Chart-Prompt:**
- chartConfig.type → Bestimmt welcher Chart-Prompt geladen wird
- chartConfig.features → Feature-Rendering im Chart-Prompt
- chartConfig.data → Balken-/Segment-Daten
- chartConfig.axes → Achsen-Konfiguration
- chartConfig.styling → Farben, Schriften

**Ergebnis:**
- prompt1_to_prompt2: { fields_used: [...], fields_missing: [...] }
- prompt2_to_prompt3: { fields_used: [...], fields_missing: [...] }
- prompt3_to_chartprompt: { fields_used: [...], fields_missing: [...] }

### CHECK 7: Feature-Template-Konsistenz

Prüfe ob `availableFeatures[]` in templates.json mit der Template-Matrix (`_TEMPLATE-MATRIX.md`) und dem Feature-Katalog (`_FEATURE-CATALOG.md`) übereinstimmt.

**7a: availableFeatures pro Template:**
Für jedes Waterfall-Template (WF-01 bis WF-19):
- Welche Features listet `availableFeatures[]`?
- Stimmen diese mit der Template-Matrix überein?
- Sind Feature-IDs korrekt geschrieben? (Erlaubt: bracket, scaleBreak, categoryBrackets, footnotes, arrows, benchmarkLines, negativeBridges, grouping)

**7b: Template-Kategorie-Konflikte:**
Prüfe ob kein Template Features enthält, die mit seiner Kategorie in Konflikt stehen:

| Feature | Verbotene Kategorien |
|---------|---------------------|
| scaleBreak | Trend, Compare-Bars |
| categoryBrackets | Variance, Trend |
| grouping | Variance, Trend, Compare-Bars |

**7c: featureHints-Validierung:**
Prüfe ob `featureHints` nur Features referenzieren, die in `availableFeatures[]` des gleichen Templates enthalten sind.

**Ergebnis:**
- templates_checked: Anzahl geprüfter Templates
- feature_mismatches: Templates mit Abweichungen zwischen templates.json und Template-Matrix
- category_conflicts: Templates die verbotene Features enthalten
- invalid_hints: featureHints die nicht in availableFeatures existieren

### CHECK 8: Feature-Katalog-Vollständigkeit

Prüfe ob alle Features, die in templates.json als `availableFeatures` verwendet werden, auch im Feature-Katalog (`_FEATURE-CATALOG.md`) dokumentiert sind.

**Zu prüfen:**
- Jede Feature-ID in `availableFeatures[]` hat einen Eintrag in der Feature-Tabelle des Katalogs
- Jede Feature-ID hat eine Aktivierungsregel (natürliche Sprache + Pseudo-Code)
- Jede Feature-ID hat Parameter-Berechnungsformeln
- Jede Feature-ID hat einen Eintrag in der Konflikte-Tabelle

**Gegenprüfung:**
- Jedes Feature im Katalog kommt in mindestens einem Template als `availableFeatures` vor
- Kein Feature existiert nur im Katalog aber nirgendwo in templates.json

**Ergebnis:**
- features_in_templates: Feature-IDs aus templates.json
- features_in_catalog: Feature-IDs aus _FEATURE-CATALOG.md
- missing_in_catalog: Features in templates.json aber nicht im Katalog
- missing_in_templates: Features im Katalog aber nicht in templates.json
- missing_activation_rules: Features ohne Aktivierungsregel
- missing_parameters: Features ohne Parameter-Berechnung

### CHECK 9: Feature-Modul-Dateien

Prüfe ob für jedes Feature im Katalog eine Feature-Modul-Datei existiert:

**Erwartete Dateien in `Features/Waterfall/`:**

| Feature-ID | Erwartete Datei |
|------------|----------------|
| bracket | BRACKET.md |
| scaleBreak | SCALE-BREAK.md |
| categoryBrackets | CATEGORY-BRACKET.md |
| footnotes | FOOTNOTES.md |
| arrows | ARROWS.md |
| benchmarkLines | BENCHMARK-LINES.md |
| negativeBridges | NEGATIVE-BRIDGES.md |
| grouping | GROUPING.md |

**Zu prüfen:**
- Datei existiert?
- Enthält die 10 Pflicht-Sektionen? (Metadata, Beschreibung, Template-Kompatibilität, Aktivierungsregeln, Config-Schema, Rendering-Logik, CSS-Styles, Konflikte, Edge-Cases, Beispiele)
- Feature-ID in Metadata stimmt mit Dateiname überein?
- Template-Kompatibilität in Feature-Modul stimmt mit Template-Matrix überein?

**Ergebnis:**
- modules_expected: Anzahl erwarteter Module
- modules_found: Anzahl gefundener Module
- missing_modules: Fehlende Moduldateien
- incomplete_modules: Module mit fehlenden Sektionen
- compatibility_mismatches: Module deren Template-Kompatibilität von der Template-Matrix abweicht

### CHECK 10: Feature-Konflikte-Konsistenz

Prüfe ob Feature-Konflikte konsistent definiert sind zwischen:
- `_FEATURE-CATALOG.md` (Konflikte-Tabelle)
- `PROMPT-3-CONFIG-GENERATOR.md` (Konflikt-Auflösung)
- Feature-Modul-Dateien (Sektion 8: Konflikte)

**Zu prüfen:**

| Konflikt | In Katalog? | In PROMPT-3? | In Modul A? | In Modul B? |
|----------|:-----------:|:------------:|:-----------:|:-----------:|
| bracket ↔ arrows | ? | ? | ? | ? |
| scaleBreak ↔ Compare-Bars | ? | ? | ? | — |
| scaleBreak ↔ Trend | ? | ? | ? | — |
| scaleBreak ↔ negativeBridges | ? | ? | ? | ? |
| categoryBrackets ↔ Variance | ? | ? | ? | — |
| categoryBrackets ↔ Trend | ? | ? | ? | — |
| grouping ↔ Variance | ? | ? | ? | — |
| grouping ↔ Trend | ? | ? | ? | — |
| grouping ↔ Compare-Bars | ? | ? | ? | — |

**Ergebnis:**
- conflicts_defined: Anzahl definierter Konflikte
- consistently_defined: Konflikte die in allen relevanten Dateien übereinstimmen
- inconsistent_conflicts: Konflikte die nur in einigen Dateien definiert sind
- resolution_missing: Konflikte ohne klare Auflösungsregel in PROMPT-3

### CHECK 11: Feature-Include-Marker in Chart-Prompts

Prüfe ob die Chart-Prompts korrekte Feature-Include-Marker für alle verfügbaren Features enthalten:

**Waterfall-Chart-Prompt:**
Für jedes Feature im Katalog prüfen:
- Enthält `<!-- FEATURE-INCLUDE: [featureId] -->` Marker?
- Enthält Rendering-Logik für `config.features.[featureId]`?
- Stimmt die Rendering-Reihenfolge mit dem Katalog überein?

**Erwartete Rendering-Reihenfolge (aus Feature-Katalog):**
```
1. scaleBreak        ← Y-Skala
2. negativeBridges   ← Y-Skala (negative Werte)
3. Basis-Balken      ← Kern-Rendering
4. Connector-Linien  ← Kern-Rendering
5. Value-Labels      ← Kern-Rendering
6. benchmarkLines    ← Horizontale Linien
7. categoryBrackets  ← Über Balken
8. grouping          ← Klammern unter Balken
9. bracket / arrows  ← Über allem
10. footnotes        ← Unter Chart
```

**Ergebnis:**
- features_expected: Features aus Katalog
- markers_found: Features mit FEATURE-INCLUDE Marker im Chart-Prompt
- markers_missing: Features ohne Marker
- rendering_order_correct: true/false
- rendering_order_issues: Beschreibung der Reihenfolge-Probleme

---

## OUTPUT-FORMAT

Antworte NUR mit diesem JSON-Format:

{
    "timestamp": "2025-01-27T10:30:00Z",
    "status": "PASS | WARN | FAIL",

    "checks": {
        "template_ids": {
            "status": "PASS | FAIL",
            "valid_ids": ["WF-01", "WF-02", ...],
            "invalid_ids": [],
            "missing_in_prompt2": []
        },

        "scenario_formulas": {
            "status": "PASS | WARN | FAIL",
            "covered": ["IST vs. BUD", "IST vs. FC", ...],
            "missing": []
        },

        "time_series_templates": {
            "status": "PASS | WARN | FAIL",
            "covered": ["Monthly Trend", "Quarterly Trend", ...],
            "missing": []
        },

        "language_preservation": {
            "status": "PASS | FAIL",
            "prompt1_has_rule": true,
            "prompt2_has_rule": true,
            "prompt3_has_rule": true,
            "consistent": true
        },

        "template_counts": {
            "status": "PASS | FAIL",
            "waterfall": 13,
            "stacked_bar": 10,
            "bar": 10,
            "total_actual": 33,
            "total_declared": 34,
            "counts_match": false
        },

        "data_flow": {
            "status": "PASS | WARN",
            "prompt1_to_prompt2": { "fields_used": [...], "fields_missing": [] },
            "prompt2_to_prompt3": { "fields_used": [...], "fields_missing": [] },
            "prompt3_to_chartprompt": { "fields_used": [...], "fields_missing": [] }
        },

        "feature_template_consistency": {
            "status": "PASS | WARN | FAIL",
            "templates_checked": 19,
            "feature_mismatches": [],
            "category_conflicts": [],
            "invalid_hints": []
        },

        "feature_catalog_completeness": {
            "status": "PASS | FAIL",
            "features_in_templates": ["bracket", "scaleBreak", ...],
            "features_in_catalog": ["bracket", "scaleBreak", ...],
            "missing_in_catalog": [],
            "missing_in_templates": [],
            "missing_activation_rules": [],
            "missing_parameters": []
        },

        "feature_module_files": {
            "status": "PASS | FAIL",
            "modules_expected": 8,
            "modules_found": 8,
            "missing_modules": [],
            "incomplete_modules": [],
            "compatibility_mismatches": []
        },

        "feature_conflicts_consistency": {
            "status": "PASS | WARN | FAIL",
            "conflicts_defined": 9,
            "consistently_defined": 9,
            "inconsistent_conflicts": [],
            "resolution_missing": []
        },

        "feature_include_markers": {
            "status": "PASS | WARN | FAIL",
            "features_expected": 8,
            "markers_found": [...],
            "markers_missing": [],
            "rendering_order_correct": true,
            "rendering_order_issues": []
        }
    },

    "summary": {
        "total_checks": 11,
        "passed": 10,
        "warnings": 1,
        "failed": 0
    },

    "recommendations": [
        {
            "severity": "ERROR | WARNING | INFO",
            "check": "template_counts",
            "message": "total_templates (34) stimmt nicht mit tatsächlicher Anzahl (33) überein",
            "fix": "Korrigiere total_templates in templates.json auf 33"
        }
    ]
}

---

## WICHTIGE REGELN

1. **Antworte NUR mit dem JSON-Objekt**
   - Keine ```json Codeblöcke
   - Kein Text vor oder nach dem JSON

2. **Status-Logik**
   - PASS: Alle Checks bestanden
   - WARN: Keine Fehler, aber Verbesserungspotential
   - FAIL: Mindestens ein kritischer Fehler

3. **Severity-Klassifikation**
   - ERROR: Muss behoben werden (Pipeline funktioniert nicht)
   - WARNING: Sollte behoben werden (eingeschränkte Funktionalität)
   - INFO: Kann verbessert werden (nice-to-have)

4. **Konkrete Empfehlungen**
   - Jedes Problem braucht einen konkreten Fix-Vorschlag
   - Keine vagen Empfehlungen
```

---

## Verwendung

### Manuell (Claude Code)

```bash
# Trigger via Skill
/prompt-integrity

# Oder explizit anfordern
"Prüfe die Integrität der Prompt-Pipeline"
```

### Programmatisch (API-Call)

```javascript
const prompt1 = await fs.readFile('4. Prompts/PROMPT-1-UNIVERSAL-ANALYZER.md', 'utf8');
const prompt2 = await fs.readFile('4. Prompts/PROMPT-2-VARIANT-GENERATOR.md', 'utf8');
const prompt3 = await fs.readFile('4. Prompts/PROMPT-3-CONFIG-GENERATOR.md', 'utf8');
const templates = await fs.readFile('6. Bibliotheken/templates.json', 'utf8');

// Feature-Dateien
const featureCatalog = await fs.readFile('4. Prompts/Features/Waterfall/_FEATURE-CATALOG.md', 'utf8');
const templateMatrix = await fs.readFile('4. Prompts/Features/Waterfall/_TEMPLATE-MATRIX.md', 'utf8');
const waterfallPrompt = await fs.readFile('4. Prompts/Prompts for Charts/WATERFALL-CHART-PROMPT.md', 'utf8');
const barPrompt = await fs.readFile('4. Prompts/Prompts for Charts/BAR-CHART-PROMPT.md', 'utf8');
const stackedBarPrompt = await fs.readFile('4. Prompts/Prompts for Charts/STACKED-BAR-CHART-PROMPT.md', 'utf8');

const validatorPrompt = await fs.readFile('4. Prompts/PROMPT-INTEGRITY-VALIDATOR.md', 'utf8');

const response = await api.call({
    system: validatorPrompt,
    user: JSON.stringify({
        prompt1, prompt2, prompt3, templates,
        featureCatalog, templateMatrix,
        chartPrompts: { waterfall: waterfallPrompt, bar: barPrompt, stackedBar: stackedBarPrompt }
    })
});

const report = JSON.parse(response);
if (report.status === 'FAIL') {
    console.error('Integrity check failed!', report.recommendations);
    process.exit(1);
}
```

---

## Validierungs-Checks (Erwartete Werte)

| Check | Aktueller Stand (2025-01-29) |
|-------|------------------------------|
| Waterfall Templates | 19 (WF-01 bis WF-19, inkl. Layout-Varianten) |
| Stacked Bar Templates | 10 (SB-01 bis SB-10) |
| Bar Chart Templates | 10 (BC-01 bis BC-10) |
| **Total** | **40** |
| Szenario-Formeln | 7 (inkl. fc_iteration_delta) |
| Zeitreihen-Templates | 6 (BC-05, BC-10, SB-03, SB-09, SB-10, WF-13) |
| Layout-Varianten Templates | 6 (WF-14 bis WF-19 mit compare_bars) |
| Feature-Module (Waterfall) | 8 (bracket, scaleBreak, categoryBrackets, footnotes, arrows, benchmarkLines, negativeBridges, grouping) |
| Feature-Konflikte | 9 definierte Konflikte |
| Feature-Katalog-Dateien | 2 (_FEATURE-CATALOG.md, _TEMPLATE-MATRIX.md) |
| Feature-Modul-Dateien | 8 (.md pro Feature) |

---

## Changelog

| Datum | Änderung |
|-------|----------|
| 2025-01-29 | Feature-Architektur: CHECK 7-11 für Feature-Template-Konsistenz, Katalog-Vollständigkeit, Modul-Dateien, Konflikte-Konsistenz, Include-Marker. Eingabe um featureCatalog, templateMatrix, chartPrompts erweitert. Datenfluss um PROMPT-3→Chart-Prompt erweitert. |
| 2025-01-27 | Layout-Varianten: WF-14 bis WF-19 mit compare_bars Feature |
| 2025-01-27 | Initial: 34 Templates, 6 Checks |
