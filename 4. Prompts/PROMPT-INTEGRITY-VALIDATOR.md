# PROMPT: Integrity Validator

## Übersicht

| Eigenschaft | Wert |
|-------------|------|
| **Datei** | `4. Prompts/PROMPT-INTEGRITY-VALIDATOR.md` |
| **Verwendet in** | Manuelle Prüfung / CI-Pipeline |
| **Trigger** | Nach Änderungen an Prompts oder Templates |
| **Output** | Integritäts-Report (JSON) |

## Anwendung

Dieser Prompt validiert die Konsistenz zwischen PROMPT-1, PROMPT-2, PROMPT-3 und der Template-Bibliothek. Er wird verwendet um sicherzustellen, dass alle Komponenten korrekt zusammenarbeiten.

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

Prüfe ob die Output-Struktur von prompt1 zur Input-Erwartung von prompt2 passt:

**Erwartete Felder in prompt1 Output:**
- analysis.scenarios
- analysis.hierarchy
- analysis.timeRange
- extractedData.normalized
- extractedData.periods

**Prüfe ob prompt2 diese Felder referenziert.**

**Ergebnis:**
- fields_used: Liste der genutzten Felder
- fields_missing: Felder die prompt1 liefert aber prompt2 nicht nutzt

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
            "fields_used": ["analysis.scenarios", ...],
            "fields_missing": []
        }
    },

    "summary": {
        "total_checks": 6,
        "passed": 5,
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

const validatorPrompt = await fs.readFile('4. Prompts/PROMPT-INTEGRITY-VALIDATOR.md', 'utf8');

const response = await api.call({
    system: validatorPrompt,
    user: JSON.stringify({ prompt1, prompt2, prompt3, templates })
});

const report = JSON.parse(response);
if (report.status === 'FAIL') {
    console.error('Integrity check failed!', report.recommendations);
    process.exit(1);
}
```

---

## Validierungs-Checks (Erwartete Werte)

| Check | Aktueller Stand (2025-01-27) |
|-------|------------------------------|
| Waterfall Templates | 19 (WF-01 bis WF-19, inkl. Layout-Varianten) |
| Stacked Bar Templates | 10 (SB-01 bis SB-10) |
| Bar Chart Templates | 10 (BC-01 bis BC-10) |
| **Total** | **40** |
| Szenario-Formeln | 7 (inkl. fc_iteration_delta) |
| Zeitreihen-Templates | 6 (BC-05, BC-10, SB-03, SB-09, SB-10, WF-13) |
| Layout-Varianten Templates | 6 (WF-14 bis WF-19 mit compare_bars) |

---

## Changelog

| Datum | Änderung |
|-------|----------|
| 2025-01-27 | Layout-Varianten: WF-14 bis WF-19 mit compare_bars Feature |
| 2025-01-27 | Initial: 34 Templates, 6 Checks |
