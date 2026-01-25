# Skill: /new-layout

Fügt ein neues Chart-Layout zum System hinzu und stellt Konsistenz über alle 3 korrespondierenden Dateien sicher.

## Anwendung
```
/new-layout [Beschreibung des gewünschten Layouts]
```

## Beispiele
```
/new-layout Waterfall mit PY und BUD Vergleichsbalken am Anfang
/new-layout Horizontaler Stacked Bar für Kostenstruktur
/new-layout YoY Grouped Bar mit Varianz-Annotation
```

## Was dieser Skill macht

1. **Analysiert** welche Bar-Typen das Layout benötigt
2. **Prüft** ob alle Bar-Typen bereits unterstützt werden
3. **Aktualisiert** die notwendigen Dateien:
   - `templates.json` (IMMER)
   - Chart-Prompt (nur wenn neuer Bar-Typ)
   - `chart-examples.json` (nur wenn neues Format)
4. **Validiert** die Konsistenz aller Dateien

## Die 3 korrespondierenden Dateien

| Datei | Zweck | Wann anpassen? |
|-------|-------|----------------|
| `6. Bibliotheken/templates.json` | Layout-Struktur | IMMER |
| `4. Prompts/Prompts for Charts/[CHART]-PROMPT.md` | Rendering-Logik | Nur bei neuem Bar-Typ |
| `6. Bibliotheken/chart-examples.json` | KI-Beispiele | Nur bei neuem Format |

## Unterstützte Bar-Typen

### Waterfall
- `start`, `increase`, `decrease`, `end`, `compare`, `budget`, `actual`, `target`
- **Nicht unterstützt:** `subtotal`, `delta`, `reference`

### Bar Chart
- Single Bar, Grouped Bar, Horizontal/Vertical
- IST, PLAN, BUD, FC Styling
- **Nicht unterstützt:** VJ/PY Styling

### Stacked Bar
- Absolute Stack, Percent Stack, Vertical
- **Nicht unterstützt:** Horizontal Stacked

## Detaillierte Anleitung
Siehe: `7. Skills/new-layout.md`
