# Skill: Chart-Prompt-Synchronisation

## Beschreibung
Dieser Skill stellt sicher, dass alle Chart-Prompts (BAR, WATERFALL, STACKED-BAR) einen einheitlichen Aufbau haben und dass Änderungen zwischen den Markdown-Dateien und den eingebetteten Prompts in `charts.html` synchron bleiben.

**WICHTIG:** Line-Charts werden NICHT mehr unterstützt. Das System verwendet nur 3 Chart-Typen:
- Waterfall (Bridge Charts)
- Stacked Bar
- Bar Chart

## Relevante Dateien

### Prompt-Markdown-Dateien (Source of Truth)
- `4. Prompts/Prompts for Charts/BAR-CHART-PROMPT.md`
- `4. Prompts/Prompts for Charts/WATERFALL-CHART-PROMPT.md`
- `4. Prompts/Prompts for Charts/STACKED-BAR-CHART-PROMPT.md`
- `4. Prompts/COLOR-SCHEMA-PROMPT.md`
- `4. Prompts/RANKING-MIX-PROMPT.md`
- `4. Prompts/FIELD-MAPPING-PROMPT.md`

### Eingebettete Prompts (Produktiv)
- `3. HTML-Seiten/charts.html` enthält die Prompts als JavaScript-Konstanten:
  - `WATERFALL_CHART_PROMPT`
  - `BAR_CHART_PROMPT`
  - `STACKED_BAR_CHART_PROMPT`
  - `COLOR_SCHEMA_PROMPT`
  - `RANKING_MIX_PROMPT`
  - `FIELD_MAPPING_PROMPT`

Siehe auch: `CLAUDE.md` für Projektregeln

---

## Einheitliche Prompt-Struktur

Jeder Chart-Prompt MUSS folgende Abschnitte in dieser Reihenfolge enthalten:

### 1. HEADER
```markdown
# Think-Cell Style [CHART-TYP] Chart Generator Prompt

## Anwendung
[Kurze Beschreibung wann dieser Chart-Typ verwendet wird]

### Chart-Typ: [Name]
- **Struktur**: [Beschreibung der visuellen Struktur]
- **Anwendung**: [Typische Use-Cases]
- **Abgrenzung**: [Unterschied zu anderen Chart-Typen]

---
```

### 2. DER PROMPT (Start des eigentlichen Prompts)
```markdown
## Der Prompt

\`\`\`
Erstelle ein dynamisches, interaktives [CHART-TYP] im Think-Cell-Stil mit folgenden Spezifikationen:

## TECHNOLOGIE
- **Reines SVG + Vanilla JavaScript** (kein Framework, keine externe Library)
- Responsive über SVG viewBox
- Alle Elemente werden programmatisch aus einem config-Objekt generiert
\`\`\`
```

### 3. DATENSTRUKTUR (config-Objekt)
```markdown
## DATENSTRUKTUR (config-Objekt)
Das Chart wird vollständig aus diesem JavaScript-Objekt generiert:

\`\`\`javascript
const config = {
    // KOMMENTAR: Beschreibung des Abschnitts
    property: value,

    // KOMMENTAR: Nächster Abschnitt
    anotherProperty: [
        // Beispiel-Einträge mit Kommentaren
        { key: 'value', description: 'Erklärung' }
    ]
};
\`\`\`
```

### 4. KRITISCHE REGELN
```markdown
## KRITISCH: [REGEL-NAME]

**[Fettgedruckte Hauptaussage]**

❌ FALSCH: [Beispiel was vermieden werden soll]
✅ RICHTIG: [Beispiel wie es gemacht werden soll]
```

### 5. CHART-ELEMENTE
```markdown
## CHART-ELEMENTE

### 1. [Element-Name]
- Beschreibung des Elements
- Styling-Eigenschaften
- Positionierung

\`\`\`javascript
// Code-Beispiel mit Kommentaren
function beispielFunktion() {
    // Erklärung was hier passiert
    const variable = berechnung();
    return variable;
}
\`\`\`
```

### 6. LAYOUT-BERECHNUNG
```markdown
## LAYOUT-BERECHNUNG

\`\`\`javascript
// Dynamische Dimensionen
const width = 1320;
const height = 500;
const margin = { top: 100, right: 40, bottom: 60, left: 40 };

// Erklärende Kommentare für jeden Berechnungsschritt
const chartWidth = width - margin.left - margin.right;
\`\`\`
```

### 7. CSS-KLASSEN
```markdown
## CSS-KLASSEN

\`\`\`css
.element-class {
    property: value;  /* Kommentar zur Erklärung */
}
\`\`\`
```

### 8. DYNAMIK-PRINZIPIEN
```markdown
## DYNAMIK-PRINZIPIEN

1. **[Prinzip 1]**: Beschreibung
2. **[Prinzip 2]**: Beschreibung
```

### 9. ANPASSUNG FÜR SPEZIFISCHE USE-CASES
```markdown
## ANPASSUNG FÜR SPEZIFISCHE USE-CASES

### [Use-Case Name]:
\`\`\`javascript
// Konfigurations-Beispiel
config = { ... }
\`\`\`
```

### 10. PROMPT-ABSCHLUSS
```markdown
---

Generiere nun einen vollständigen, funktionsfähigen HTML-Code basierend auf diesen Spezifikationen.
Die Daten sollen sein: [HIER DATEN EINFÜGEN]
Das Farbschema soll sein: [HIER FARBEN EINFÜGEN]
\`\`\`
```

### 11. BEISPIEL-AUFRUF
```markdown
## Beispiel-Aufruf

\`\`\`
[Vollständiges Beispiel wie der Prompt aufgerufen wird]
\`\`\`
```

### 12. TECHNISCHE BEGRÜNDUNG
```markdown
## Technische Begründung

### Warum [Entscheidung]?

| Aspekt | Alternative A | Alternative B |
|--------|--------------|--------------|
| ... | ... | ... |
```

### 13. VISUALISIERUNG
```markdown
## Visualisierung

\`\`\`
[ASCII-Art Darstellung des Charts]
\`\`\`
```

### 14. HÄUFIGE FEHLER (falls relevant)
```markdown
## Häufige Fehler vermeiden

| Problem | Ursache | Lösung |
|---------|---------|--------|
| ... | ... | ... |
```

---

## Synchronisations-Regeln

### Bei Änderung in charts.html:
1. Identifiziere welcher Prompt geändert wurde (`WATERFALL_CHART_PROMPT`, `BAR_CHART_PROMPT`, etc.)
2. Öffne die entsprechende Markdown-Datei
3. Finde den Abschnitt `## Der Prompt` und aktualisiere den Inhalt zwischen den Code-Fences
4. Dokumentiere die Änderung mit Datum im Commit

### Bei Änderung in Prompt-Markdown:
1. Extrahiere den Prompt-Inhalt aus dem Abschnitt `## Der Prompt` (zwischen den Code-Fences)
2. Öffne `HTML-Seiten/charts.html`
3. Finde die entsprechende JavaScript-Konstante
4. Ersetze den Template-Literal-Inhalt

### Mapping der Dateien:

| Markdown-Datei | JavaScript-Konstante in charts.html |
|----------------|-------------------------------------|
| `BAR-CHART-PROMPT.md` | `BAR_CHART_PROMPT` |
| `WATERFALL-CHART-PROMPT.md` | `WATERFALL_CHART_PROMPT` |
| `STACKED-BAR-CHART-PROMPT.md` | `STACKED_BAR_CHART_PROMPT` |
| `COLOR-SCHEMA-PROMPT.md` | `COLOR_SCHEMA_PROMPT` |
| `RANKING-MIX-PROMPT.md` | `RANKING_MIX_PROMPT` |
| `FIELD-MAPPING-PROMPT.md` | `FIELD_MAPPING_PROMPT` |

**HINWEIS:** LINE-CHART-PROMPT.md wurde entfernt. Line-Charts werden nicht mehr unterstützt.

---

## Kommentierungs-Standards

### JavaScript-Code in Prompts:
```javascript
// ============================================
// ABSCHNITT: [Name des Abschnitts]
// ============================================

// [Kurze Erklärung was der folgende Code macht]
function funktionsName(parameter) {
    // Schritt 1: [Beschreibung]
    const schritt1 = berechnung();

    // Schritt 2: [Beschreibung]
    // WICHTIG: [Kritischer Hinweis falls vorhanden]
    const schritt2 = weitereBerechnung(schritt1);

    return schritt2;
}
```

### Kritische Stellen markieren:
```javascript
// KRITISCH: [Warum ist das wichtig]
// FEHLER VERMEIDEN: [Was kann schief gehen]
// HINWEIS: [Zusätzliche Information]
```

---

## Beispiel-Anforderungen für Code-Blöcke

Jeder wesentliche Code-Block MUSS enthalten:

1. **Einleitenden Kommentar** - Was macht dieser Code?
2. **Variablen-Kommentare** - Bei nicht-offensichtlichen Werten
3. **Logik-Erklärung** - Bei komplexen Berechnungen
4. **Beispiel-Werte** - Konkrete Zahlen zeigen

### Beispiel:
```javascript
// Berechnet die Y-Position eines Balkens basierend auf seinem Wert
// Beachte: SVG Y=0 ist OBEN, daher invertierte Berechnung
function calculateBarY(value, maxValue, chartHeight, marginTop) {
    // Verhältnis des Werts zum Maximum (z.B. 0.75 bei 75%)
    const ratio = value / maxValue;

    // Y-Position: Je größer der Wert, desto kleiner Y (weiter oben)
    // Beispiel: Bei ratio=0.75 und chartHeight=400 → barY = marginTop + 100
    const barY = marginTop + chartHeight * (1 - ratio);

    return barY;
}
```

---

## Prüf-Checkliste bei Änderungen

- [ ] Abschnitte in korrekter Reihenfolge?
- [ ] Alle Code-Blöcke kommentiert?
- [ ] Beispiele mit konkreten Werten?
- [ ] Kritische Regeln mit ❌/✅ markiert?
- [ ] Markdown-Datei und charts.html synchron?
- [ ] Keine Formatierungs-Unterschiede (Backticks, Einrückung)?
- [ ] CSS-Klassen dokumentiert?
- [ ] Visualisierung (ASCII-Art) vorhanden?
