# Feature-Katalog: Waterfall Charts

Dieses Dokument definiert alle verfügbaren Features für Waterfall-Charts, ihre Aktivierungsregeln und Konflikte. Es wird von PROMPT-3 (Config Generator) zur autonomen Feature-Auswahl verwendet.

---

## Verfügbare Features

| ID | Name | Kategorie | Komplexität | Modul |
|----|------|-----------|-------------|-------|
| `bracket` | Bracket (Prozentuale Veränderung) | annotation | mittel | BRACKET.md |
| `scaleBreak` | Scale-Break (Skalenbruch) | layout | mittel | SCALE-BREAK.md |
| `categoryBrackets` | Category-Brackets (Anteil-Annotationen) | annotation | mittel | CATEGORY-BRACKET.md |
| `footnotes` | Footnotes (Fußnoten) | annotation | niedrig | FOOTNOTES.md |
| `arrows` | Arrows (Balken-Verbindungen) | annotation | niedrig | ARROWS.md |
| `benchmarkLines` | Benchmark-Linien | layout | mittel | BENCHMARK-LINES.md |
| `grouping` | Gruppierung | layout | hoch | GROUPING.md |
| `negativeBridges` | Negative Bridges | layout | hoch | NEGATIVE-BRIDGES.md |

---

## Aktivierungsregeln

### 1. BRACKET

**Wann aktivieren (natürliche Sprache):**
Aktiviere Bracket wenn mindestens 4 Balken vorhanden sind UND Start- und End-Balken existieren UND die Veränderung > 5% ist. Bei Variance-Templates den sinnvollsten Vergleich wählen (Budget→Actual bevorzugt vor PY→CY). Bei Trend-Templates CAGR berechnen.

**Aktivierungsregel (Pseudo-Code):**
```
IF bars.length >= 4
   AND hasBarType('start') AND hasBarType('end')
   AND abs(endValue - startValue) / startValue > 0.05
THEN bracket.enabled = true

// Modus-Auswahl basierend auf Template-Kategorie
SWITCH templateCategory:
    CASE 'variance': bracket.mode = auto (budget/yoy/fc)
    CASE 'trend': bracket.mode = cagr
    CASE 'compare_bars': bracket.mode = multiple
    DEFAULT: bracket.mode = standard
```

**Parameter-Berechnung:**
- `fromIndex`: Index des Start-Balkens (meist 0)
- `toIndex`: Index des End-Balkens
- `label`: KI berechnet basierend auf Modus (z.B. "+9.8% vs. Budget")
- `mode`: auto, standard, budget, yoy, fc, cagr, multiple

---

### 2. SCALE-BREAK

**Wann aktivieren (natürliche Sprache):**
Aktiviere einen Skalenbruch wenn der Start- oder End-Balken mehr als dreimal so groß ist wie die durchschnittlichen Veränderungsbalken. NICHT bei Trend- oder Compare-Bars-Templates.

**Aktivierungsregel (Pseudo-Code):**
```
IF templateCategory IN ['structure', 'variance']:
    avgDelta = average(abs(value) for bar where type IN ['increase', 'decrease', 'delta'])
    maxBar = max(startValue, endValue)

    IF avgDelta > 0 AND maxBar / avgDelta > 3:
        scaleBreak.enabled = true
        scaleBreak.breakAt = avgDelta * 2
        scaleBreak.style = "zigzag"
```

**Parameter-Berechnung:**
- `breakAt`: 2x der durchschnittlichen Delta-Höhe
- `style`: "zigzag" (Standard für Waterfall)

---

### 3. CATEGORY-BRACKETS

**Wann aktivieren (natürliche Sprache):**
Aktiviere Category-Brackets wenn es logische Gruppen gibt UND das Template eine Structure-Kategorie hat. Besonders sinnvoll bei P&L (Kosten als % vom Umsatz), Cashflow, Segment-Analysen.

**Aktivierungsregel (Pseudo-Code):**
```
IF templateCategory == 'structure'
   AND hierarchy.detected == true
   AND hierarchy.groups.length >= 2
THEN:
    categoryBrackets.enabled = true
    // KI identifiziert Gruppen und berechnet Prozent-Anteile
```

**Parameter-Berechnung:**
- `items[].barIndex`: Index des Balkens
- `items[].label`: abs(value) / referenceValue * 100
- `items[].description`: "vom " + referenceLabel

---

### 4. FOOTNOTES

**Wann aktivieren (natürliche Sprache):**
Aktiviere Footnotes wenn Quellenangaben, Einheiten oder vorläufige Werte in den Metadaten vorhanden sind. Bei ALLEN Template-Typen einsetzbar.

**Aktivierungsregel (Pseudo-Code):**
```
IF metadata.source != null
   OR metadata.preliminary == true
   OR metadata.currency != null
   OR metadata.unit != null
THEN footnotes.enabled = true
```

**Parameter-Berechnung:**
- `items`: Array aus Metadaten zusammengestellt

---

### 5. ARROWS

**Wann aktivieren (natürliche Sprache):**
Aktiviere Arrows als Alternative zu Brackets für spezifische Vergleiche zwischen zwei nicht-benachbarten Balken. NICHT zusammen mit Bracket (Konflikt).

**Aktivierungsregel (Pseudo-Code):**
```
IF specificComparison.requested == true
   AND bracket.enabled == false
THEN arrows.enabled = true
```

---

### 6. BENCHMARK-LINES

**Wann aktivieren (natürliche Sprache):**
Aktiviere horizontale Benchmark-Linien wenn explizite Zielwerte (TARGET, GUIDANCE, PLAN) in den Daten oder Metadaten vorhanden sind. Besonders sinnvoll bei Variance- und Compare-Bars-Templates. NICHT aktivieren für berechnete Durchschnitte — nur für echte, benannte Referenzwerte. Maximal 2 Linien gleichzeitig.

**Aktivierungsregel (Pseudo-Code):**
```
IF metadata.scenarios.includes('TARGET') OR metadata.scenarios.includes('GUIDANCE')
   OR metadata.scenarios.includes('PLAN')
   OR (metadata.comparison_type == 'variance' AND hasExplicitTargetValue)
THEN:
    benchmarkLines.enabled = true
    benchmarkLines.lines = []
    // Für jedes TARGET/GUIDANCE Szenario eine Linie erstellen
    // Maximal 2 Linien
ELSE:
    benchmarkLines.enabled = false
    benchmarkLines._reason = "Keine expliziten Zielwerte in den Daten"
```

**Parameter-Berechnung:**
- `lines[].value`: Absoluter Wert des Zielwerts
- `lines[].label`: Name des Szenarios ("Target", "Guidance")
- `lines[].style`: "dashed" (Target), "dotted" (Guidance)
- `lines[].color`: "#FF8C00" (primär), "#888888" (sekundär)

---

### 7. GROUPING

**Wann aktivieren (natürliche Sprache):**
Aktiviere Gruppierung wenn Balken zu logischen Gruppen zusammengefasst werden können (z.B. Kostenarten, CF-Kategorien). NUR bei Structure-Templates mit mindestens 6 Balken. Gruppen müssen mindestens 2 Balken umfassen und dürfen sich nicht überlappen.

**Aktivierungsregel (Pseudo-Code):**
```
IF templateCategory == 'structure'
   AND bars.length >= 6
   AND hierarchy.detected == true
   AND hierarchy.groups.length >= 2
   AND hierarchy.groups.every(g => g.items.length >= 2)
THEN:
    grouping.enabled = true
    grouping.groups = hierarchy.groups.map(g => ({
        label: g.name,
        fromIndex: g.firstBarIndex,
        toIndex: g.lastBarIndex
    }))
    // Validierung: Gruppen dürfen sich nicht überlappen
ELSE:
    grouping.enabled = false
```

**Parameter-Berechnung:**
- `groups[].label`: Gruppenname aus Hierarchie
- `groups[].fromIndex`: Index des ersten Balkens in der Gruppe
- `groups[].toIndex`: Index des letzten Balkens in der Gruppe
- `style`: "bracket" (Standard) oder "line"

---

### 8. NEGATIVE-BRIDGES

**Wann aktivieren (natürliche Sprache):**
Aktiviere Negative-Bridges-Logik wenn der kumulative Wert die Nulllinie kreuzt oder der End-Wert negativ ist. Bei ALLEN Template-Typen relevant. KONFLIKT: Scale-Break wird deaktiviert wenn Negative-Bridges aktiv ist.

**Aktivierungsregel (Pseudo-Code):**
```
// Kumulative Werte berechnen
cumulativeValues = calculateCumulativeValues(bars)
minCumulative = min(cumulativeValues)
endValue = bars.find(b => b.type == 'end')?.value

IF cumulativeValues.some(v => v < 0)
   OR endValue < 0
   OR minCumulative < 0
THEN:
    negativeBridges.enabled = true
    negativeBridges.minValue = minCumulative
    negativeBridges.crossingIndices = findZeroCrossings(cumulativeValues)
    // WICHTIG: Scale-Break deaktivieren (Konflikt)
    scaleBreak.enabled = false
ELSE:
    negativeBridges.enabled = false
    negativeBridges._reason = "Alle kumulativen Werte positiv"
```

**Parameter-Berechnung:**
- `minValue`: Minimaler kumulativer Wert
- `crossingIndices`: Array der Indizes wo die Nulllinie gekreuzt wird
- `showZeroLine`: true (Standard)

---

## Feature-Konflikte

| Feature A | Feature B | Konflikt? | Lösung |
|-----------|-----------|:---------:|--------|
| bracket | arrows | Ja | Bracket hat Priorität |
| scaleBreak | Compare-Bars Template | Ja | Scale-Break deaktivieren |
| scaleBreak | Trend Template | Ja | Scale-Break deaktivieren |
| scaleBreak | negativeBridges | Ja | Scale-Break deaktivieren (negativeBridges hat Priorität) |
| categoryBrackets | Variance Template | Ja | Category-Brackets deaktivieren |
| categoryBrackets | Trend Template | Ja | Category-Brackets deaktivieren |
| grouping | Variance Template | Ja | Grouping deaktivieren |
| grouping | Trend Template | Ja | Grouping deaktivieren |
| grouping | Compare-Bars Template | Ja | Grouping deaktivieren |
| benchmarkLines | * | Nein | Immer kombinierbar |
| negativeBridges | * | Nein | Immer kombinierbar (außer scaleBreak) |
| footnotes | * | Nein | Immer kombinierbar |

## Rendering-Reihenfolge

```
1. scaleBreak        ← Beeinflusst Y-Skala, MUSS zuerst
2. negativeBridges   ← Beeinflusst Y-Skala (negative Werte), MUSS früh
3. Basis-Balken      ← Immer (Kern-Rendering)
4. Connector-Linien  ← Immer (Kern-Rendering)
5. Value-Labels      ← Immer (Kern-Rendering)
6. benchmarkLines    ← Wenn enabled (horizontale Linien)
7. categoryBrackets  ← Wenn enabled (über Balken)
8. grouping          ← Wenn enabled (Klammern unter Balken)
9. bracket / arrows  ← Wenn enabled (über allem)
10. footnotes        ← Immer zuletzt (unter Chart)
```

## Hinweise für PROMPT-3

1. **Template-Kategorie bestimmen** anhand der Template-ID (aus _TEMPLATE-MATRIX.md)
2. **Verfügbare Features filtern** anhand der Template-Kompatibilität
3. **Aktivierungsregeln prüfen** gegen die konkreten extractedData
4. **Parameter autonom berechnen** nach den Formeln
5. **Konflikte auflösen** (z.B. Bracket vs. Arrows)
6. **Begründung dokumentieren** mit `_reason` Feld
