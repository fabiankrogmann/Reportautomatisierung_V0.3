# Skill: Prompt-Integritätsprüfung

## Beschreibung

Dieser Skill prüft die Konsistenz und Integrität zwischen den 3 Haupt-Prompts (PROMPT-1, PROMPT-2, PROMPT-3) und der Template-Bibliothek. Er sollte nach jeder Änderung an Prompts oder Templates ausgeführt werden.

## Auslöser

Verwende diesen Skill wenn:
- Ein neues Template zu `templates.json` hinzugefügt wurde
- Änderungen an PROMPT-1, PROMPT-2 oder PROMPT-3 vorgenommen wurden
- Neue Szenario- oder Zeitreihen-Perspektiven ergänzt wurden
- Feature-Module erstellt oder geändert wurden (`Features/Waterfall/*.md`)
- Feature-Katalog oder Template-Matrix geändert wurden
- `availableFeatures` oder `featureHints` in templates.json geändert wurden
- Der User explizit `/prompt-integrity` oder "Integritätsprüfung" anfordert

## Zu prüfende Dateien

| Datei | Pfad |
|-------|------|
| PROMPT-1 | `4. Prompts/PROMPT-1-UNIVERSAL-ANALYZER.md` |
| PROMPT-2 | `4. Prompts/PROMPT-2-VARIANT-GENERATOR.md` |
| PROMPT-3 | `4. Prompts/PROMPT-3-CONFIG-GENERATOR.md` |
| Templates | `6. Bibliotheken/templates.json` |
| Feature-Katalog | `4. Prompts/Features/Waterfall/_FEATURE-CATALOG.md` |
| Template-Matrix | `4. Prompts/Features/Waterfall/_TEMPLATE-MATRIX.md` |
| Feature-Module | `4. Prompts/Features/Waterfall/*.md` (8 Dateien) |
| Waterfall-Prompt | `4. Prompts/Prompts for Charts/WATERFALL-CHART-PROMPT.md` |
| Bar-Prompt | `4. Prompts/Prompts for Charts/BAR-CHART-PROMPT.md` |
| Stacked-Bar-Prompt | `4. Prompts/Prompts for Charts/STACKED-BAR-CHART-PROMPT.md` |
| Konzept | `1. Konzept/Konzept_KI_Finanzvisualisierung.md` |
| CLAUDE.md | `CLAUDE.md` |

## Prüfschritte

### 1. DATENFLUSS-KONSISTENZ

Prüfe ob Output von Prompt N als Input für Prompt N+1 funktioniert:

```
PROMPT-1 Output           →  PROMPT-2 erwartet
─────────────────────────────────────────────────
analysis.scenarios[]      →  Für dataFilter.scenario
analysis.hierarchy        →  Für Hierarchie-Varianten
analysis.timeRange        →  Für Zeitreihen-Perspektiven
extractedData.normalized  →  Für Positionsanzahl
extractedData.periods     →  Für Periodenfilter

PROMPT-2 Output           →  PROMPT-3 erwartet
─────────────────────────────────────────────────
variant.templateId        →  templateDefinition.template_id
variant.dataFilter        →  Für Datenfilterung
variant.perspective       →  Für perspective-spezifische Logik

PROMPT-3 Output           →  Chart-Prompt erwartet
─────────────────────────────────────────────────
chartConfig.type          →  Bestimmt welcher Chart-Prompt
chartConfig.features      →  Feature-Rendering (config.features.*)
chartConfig.data          →  Balken-/Segment-Daten
chartConfig.axes          →  Achsen-Konfiguration
chartConfig.styling       →  Farben, Schriften

Feature-Dateien           →  PROMPT-3 erwartet
─────────────────────────────────────────────────
_FEATURE-CATALOG.md       →  featureCatalog (Aktivierungsregeln)
_TEMPLATE-MATRIX.md       →  Feature-Kompatibilität pro Template
templates.json            →  availableFeatures[], featureHints{}
```

**Check:** Alle Output-Felder werden korrekt referenziert? Feature-Inputs vollständig?

### 2. TEMPLATE-ID-KONSISTENZ

Prüfe ob alle in PROMPT-2 erwähnten Template-IDs in templates.json existieren:

**Waterfall (WF-01 bis WF-13):**
- [ ] WF-01 bis WF-13 existieren in templates.json?
- [ ] Alle in PROMPT-2 Waterfall-Tabelle erwähnten IDs existieren?

**Stacked Bar (SB-01 bis SB-10):**
- [ ] SB-01 bis SB-10 existieren in templates.json?
- [ ] Alle in PROMPT-2 Stacked Bar-Tabelle erwähnten IDs existieren?

**Bar Chart (BC-01 bis BC-10):**
- [ ] BC-01 bis BC-10 existieren in templates.json?
- [ ] Alle in PROMPT-2 Bar Chart-Tabelle erwähnten IDs existieren?

**Check:** `total_templates` in templates.json stimmt mit Anzahl überein?

### 3. SZENARIO-PERSPEKTIVEN-ABDECKUNG

Prüfe ob alle Szenario-Kombinationen in PROMPT-2 auch in PROMPT-3 berechnet werden können:

| PROMPT-2 Kombination | PROMPT-3 Berechnung vorhanden? |
|----------------------|-------------------------------|
| IST vs. BUD | `variance_budget = actual - budget` |
| IST vs. FC | `variance_forecast = actual - forecast` |
| IST vs. VJ | `yoy_delta = current_year - prior_year` |
| BUD vs. FC | `budget_fc_delta = budget - forecast` |
| BUD vs. VJ | `budget_py_delta = budget - prior_year` |
| FC vs. VJ | `fc_py_delta = forecast - prior_year` |
| FC-Iterationen | `fc_iteration_delta = fc_current - fc_prior` |

**Check:** Jede in PROMPT-2 erwähnte Szenario-Kombination hat eine Berechnungsformel in PROMPT-3?

### 4. ZEITREIHEN-PERSPEKTIVEN-ABDECKUNG

Prüfe ob alle Zeitreihen-Perspektiven Templates und Berechnungen haben:

| Perspektive | Template vorhanden? | PROMPT-3 Berechnung? |
|-------------|--------------------|--------------------|
| Monthly Trend (12 Bars) | BC-05 (period_count: 12) | Keine Aggregation |
| Quarterly Trend (Q1-Q4) | BC-10 (period_count: 4) | Q1=Jan+Feb+Mar, etc. |
| H1 vs H2 | BC-10 / anpassbar | H1=Q1+Q2, H2=Q3+Q4 |
| Monthly Stacked (12) | SB-09 (period_count: 12) | Keine Aggregation |
| Monthly Stacked 100% | SB-10 (period_count: 12) | Keine Aggregation |
| Quarterly Stacked | SB-03 (period_count: 3-12) | Q1-Q4 aggregiert |
| Monthly Bridge | WF-13 (period_count: 12) | mom_delta |
| H1 to H2 Bridge | WF-11 | h1_h2_delta |
| YTD vs PY YTD | BC-08 | ytd_py_delta |

**Check:** Jede Zeitreihen-Perspektive hat mindestens ein passendes Template?

### 5. SPRACHERHALTUNG-KONSISTENZ

Prüfe ob die Spracherhaltungsregel in allen 3 Prompts identisch formuliert ist:

**Erwartete Elemente in jedem Prompt:**
- [ ] `═══════════════` Banner vorhanden?
- [ ] "KRITISCHE REGEL: SPRACHERHALTUNG" Header?
- [ ] "VERBOTEN:" Liste mit ✗ Symbolen?
- [ ] DE→EN und EN→DE Übersetzungsverbot erwähnt?
- [ ] Beispiele für korrekte/falsche Labels?

### 6. DOKUMENTATIONS-SYNC

Prüfe ob Konzept und CLAUDE.md mit templates.json synchron sind:

| Wert | templates.json | Konzept | CLAUDE.md |
|------|---------------|---------|-----------|
| total_templates | ? | ? | ? |
| Waterfall Anzahl | ? | ? | ? |
| Stacked Bar Anzahl | ? | ? | ? |
| Bar Chart Anzahl | ? | ? | ? |

**Check:** Alle Zahlen stimmen überein?

### 7. FEATURE-TEMPLATE-KONSISTENZ

Prüfe ob `availableFeatures[]` in templates.json mit Feature-Katalog und Template-Matrix übereinstimmt:

**7a: availableFeatures stimmen mit Template-Matrix überein?**
- Für jedes WF-Template: Vergleiche `availableFeatures[]` mit `_TEMPLATE-MATRIX.md`
- [ ] Keine Feature-IDs falsch geschrieben?
- [ ] Keine Features in verbotenen Template-Kategorien?

**7b: Template-Kategorie-Konflikte:**
| Feature | Verbotene Kategorien |
|---------|---------------------|
| scaleBreak | Trend, Compare-Bars |
| categoryBrackets | Variance, Trend |
| grouping | Variance, Trend, Compare-Bars |

**7c: featureHints nur für existierende availableFeatures?**

### 8. FEATURE-KATALOG-VOLLSTÄNDIGKEIT

Prüfe ob alle Features bidirektional konsistent sind:

- [ ] Jede Feature-ID in `availableFeatures[]` existiert in `_FEATURE-CATALOG.md`?
- [ ] Jedes Feature im Katalog kommt in mindestens einem Template vor?
- [ ] Jedes Feature hat: Aktivierungsregel + Parameter-Berechnung + Konflikte-Eintrag?

### 9. FEATURE-MODUL-DATEIEN

Prüfe ob für jedes Feature im Katalog eine `.md`-Datei existiert:

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

- [ ] Alle 8 Dateien existieren?
- [ ] Jede enthält 10 Pflicht-Sektionen? (Metadata → Beispiele)
- [ ] Template-Kompatibilität stimmt mit Template-Matrix überein?

### 10. FEATURE-KONFLIKTE-KONSISTENZ

Prüfe ob Konflikte in 3 Quellen übereinstimmen:
- `_FEATURE-CATALOG.md` (Konflikte-Tabelle)
- `PROMPT-3-CONFIG-GENERATOR.md` (Konflikt-Auflösung)
- Feature-Modul-Dateien (Sektion 8)

**9 erwartete Konflikte:** bracket↔arrows, scaleBreak↔Compare-Bars, scaleBreak↔Trend, scaleBreak↔negativeBridges, categoryBrackets↔Variance, categoryBrackets↔Trend, grouping↔Variance, grouping↔Trend, grouping↔Compare-Bars

### 11. FEATURE-INCLUDE-MARKER

Prüfe ob Chart-Prompts korrekte Feature-Integration haben:

- [ ] Waterfall-Prompt enthält `FEATURE-INCLUDE` Marker für alle 8 Features?
- [ ] Rendering-Logik für `config.features.[featureId]` vorhanden?
- [ ] Rendering-Reihenfolge: scaleBreak → negativeBridges → Basis → Connectors → Values → benchmarkLines → categoryBrackets → grouping → bracket/arrows → footnotes?

## Output-Format

Nach der Prüfung, erstelle einen Bericht:

```markdown
## Integritätsprüfung: [DATUM]

### ✅ BESTANDEN
- [Liste aller bestandenen Checks]

### ⚠️ WARNUNGEN (funktioniert, aber nicht optimal)
- [Liste von Warnungen mit Empfehlungen]

### ❌ FEHLER (muss behoben werden)
- [Liste kritischer Fehler mit Lösungsvorschlägen]

### Zusammenfassung
- Geprüfte Dateien: X
- Bestandene Checks: X/Y
- Status: PASS / WARN / FAIL
```

## Beispiel-Aufruf

```
User: /prompt-integrity
User: Prüfe die Prompt-Integrität
User: Ich habe ein neues Template hinzugefügt, bitte prüfen
```

## Automatische Empfehlungen

Bei gefundenen Problemen, schlage konkrete Fixes vor:

**Fehlendes Template:**
> Template WF-14 wird in PROMPT-2 erwähnt, existiert aber nicht in templates.json.
> → Entweder Template hinzufügen ODER Referenz aus PROMPT-2 entfernen.

**Fehlende Berechnung:**
> Szenario-Kombination "BUD vs. FC" in PROMPT-2, aber keine Formel in PROMPT-3.
> → Füge `budget_fc_delta = budget - forecast` zu PROMPT-3 hinzu.

**Dokumentation veraltet:**
> templates.json hat 34 Templates, Konzept zeigt noch 30.
> → Aktualisiere Abschnitt 3.1 im Konzept.

**Feature-Template-Konflikt:**
> WF-11 (Trend-Kategorie) enthält `grouping` in availableFeatures, aber Grouping ist für Trend-Templates nicht erlaubt.
> → Entferne `grouping` aus availableFeatures von WF-11 in templates.json.

**Fehlende Feature-Modul-Datei:**
> Feature `benchmarkLines` im Katalog, aber `Features/Waterfall/BENCHMARK-LINES.md` existiert nicht.
> → Erstelle Feature-Modul im 10-Sektionen-Format.

**Inkonsistenter Feature-Konflikt:**
> Konflikt `scaleBreak ↔ negativeBridges` in _FEATURE-CATALOG.md definiert, aber nicht in PROMPT-3 als Auflösungsregel.
> → Ergänze Konflikt-Auflösung in PROMPT-3 Sektion "Feature-Konflikte".

**Fehlender Feature-Include-Marker:**
> Feature `grouping` aktiv in Katalog, aber kein `FEATURE-INCLUDE: grouping` Marker im WATERFALL-CHART-PROMPT.md.
> → Ergänze Marker und Rendering-Logik im Chart-Prompt.
