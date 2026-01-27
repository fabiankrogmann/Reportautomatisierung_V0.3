# Prompt-Architektur: Zusammenspiel aller Prompts

## Übersicht: Aktive Prompts (7)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           AKTIVE PROMPTS (7)                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│  1. DATA_ANALYZER_PROMPT      (4. Prompts/DATA-ANALYZER-PROMPT.md)              │
│  2. PERSPECTIVE-DERIVATION    (4. Prompts/PERSPECTIVE-DERIVATION-PROMPT.md)     │
│  3. LAYOUT-RANKING            (4. Prompts/LAYOUT-RANKING-PROMPT.md)             │
│  4. FIELD-MAPPING-PROMPT      (4. Prompts/FIELD-MAPPING-PROMPT.md)              │
│  5. WATERFALL-CHART-PROMPT    (4. Prompts/Prompts for Charts/...)               │
│  6. BAR-CHART-PROMPT          (4. Prompts/Prompts for Charts/...)               │
│  7. STACKED-BAR-CHART-PROMPT  (4. Prompts/Prompts for Charts/...)               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                           SONSTIGE PROMPTS                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│  📎  COLOR-SCHEMA-PROMPT      → Verwendet in colors.html (Farbschema-Auswahl)   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**Hinweis:** Der DATA_ANALYZER_PROMPT ist aktuell noch inline in `upload.html` definiert.
Die `.md` Datei dient als Referenz-Dokumentation.

---

## Aktiver Datenfluss (AKTUALISIERT)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                          │
│   CSV/Excel Upload                                                                       │
│        │                                                                                 │
│        ▼                                                                                 │
│   ╔════════════════════════╗                                                            │
│   ║   DATA_ANALYZER_PROMPT ║  ← Inline in upload.html                                   │
│   ║   (upload.html)        ║  ← Input: Rohe CSV-Daten                                   │
│   ╚════════════════════════╝                                                            │
│        │                                                                                 │
│        │ Output: analysis, extractedData, hierarchy, recommendation                     │
│        ▼                                                                                 │
│   ┌────────────────────────┐                                                            │
│   │     sessionStorage     │                                                            │
│   └────────────────────────┘                                                            │
│        │                                                                                 │
│        │ User wählt Chart-Typ in results.html                                           │
│        ▼                                                                                 │
│   ╔════════════════════════╗                                                            │
│   ║ PERSPECTIVE-DERIVATION ║  ← API-Call #1                                             │
│   ║   (charts.html)        ║  ← Input: hierarchy, extractedData, chartType              │
│   ╚════════════════════════╝  ← Output: perspectives[] (6-10 Perspektiven)              │
│        │                                                                                 │
│        ▼                                                                                 │
│   ╔════════════════════════╗                                                            │
│   ║   LAYOUT-RANKING       ║  ← API-Call #2                                             │
│   ║   (charts.html)        ║  ← Input: dataProfile, templates[], chartType              │
│   ╚════════════════════════╝  ← Output: selectedTemplates[] (8-10 Templates)            │
│        │                                                                                 │
│        ▼                                                                                 │
│   ┌────────────────────────────────────────────────────────────────────────────┐        │
│   │                    TEMPLATE × PERSPEKTIVE LOOP                              │        │
│   │                                                                             │        │
│   │   Ein Template kann mit VERSCHIEDENEN Perspektiven kombiniert werden!       │        │
│   │   Duplikat-Check basiert auf DATEN (Perspektive+Titel+Struktur), nicht      │        │
│   │   auf Template-ID.                                                          │        │
│   │                                                                             │        │
│   │   for each (template, perspective) combination:                             │        │
│   │       │                                                                     │        │
│   │       ▼                                                                     │        │
│   │   ╔════════════════════════════╗                                           │        │
│   │   ║   FIELD-MAPPING-PROMPT     ║ ← API-Call (cached pro Perspektive)       │        │
│   │   ║   (ConfigGenerator)        ║ ← Input: template, data, perspective      │        │
│   │   ╚════════════════════════════╝ ← Output: fieldMapping JSON               │        │
│   │       │                                                                     │        │
│   │       ▼                                                                     │        │
│   │   ╔════════════════════════════╗                                           │        │
│   │   ║   CHART-PROMPT             ║ ← API-Call (BAR/WATERFALL/STACKED-BAR)    │        │
│   │   ║   (ConfigGenerator)        ║ ← Input: template, data, colors,          │        │
│   │   ╚════════════════════════════╝         perspective, fieldMapping         │        │
│   │       │                         ← Output: chartConfig JSON                  │        │
│   │       ▼                                                                     │        │
│   │   ┌──────────────────────────┐                                             │        │
│   │   │ Fingerprint-Check        │                                             │        │
│   │   │ (Daten-basiert!)         │                                             │        │
│   │   └──────────────────────────┘                                             │        │
│   │       │                                                                     │        │
│   │       ├── Neu? → chartConfigs.push()                                       │        │
│   │       └── Duplikat? → skip                                                 │        │
│   │                                                                             │        │
│   └────────────────────────────────────────────────────────────────────────────┘        │
│        │                                                                                 │
│        ▼                                                                                 │
│   ┌────────────────────────┐                                                            │
│   │   SVG-Rendering        │                                                            │
│   └────────────────────────┘                                                            │
│        │                                                                                 │
│        ▼                                                                                 │
│   ┌────────────────────────┐                                                            │
│   │   Export (ZIP/PPTX)    │                                                            │
│   └────────────────────────┘                                                            │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Detaillierte Prompt-Beschreibungen

### 1. DATA_ANALYZER_PROMPT
| Eigenschaft | Wert |
|-------------|------|
| **Speicherort** | `4. Prompts/DATA-ANALYZER-PROMPT.md` (Referenz) |
| **Verwendet in** | `upload.html` (inline als Konstante) |
| **Trigger** | User lädt CSV/Excel-Datei hoch |
| **API-Calls** | 1 |

**Aufgaben:**
1. Strukturerkennung (Matrix-einfach, Matrix-komplex, Faktentabelle)
2. Positions-Klassifikation (Summenzeilen, Detailzeilen)
3. **Hierarchie-Erkennung** (Cluster → Regionen → Länder)
4. Chart-Typ-Empfehlung
5. Daten-Extraktion

---

### 2. PERSPECTIVE-DERIVATION-PROMPT
| Eigenschaft | Wert |
|-------------|------|
| **Speicherort** | `4. Prompts/PERSPECTIVE-DERIVATION-PROMPT.md` |
| **Aufgerufen in** | `charts.html` → `PerspectiveDeriver.derive()` |
| **API-Calls** | 1 |

**Aufgaben:**
1. Analysiert Hierarchie-Struktur
2. Generiert 6-10 verschiedene Perspektiven
3. **Erstellt für JEDEN Cluster eine gefilterte Perspektive**

**Output-Beispiel:**
```json
{
  "perspectives": [
    { "id": "p1", "name": "Cluster-Übersicht", "aggregationLevel": "summary" },
    { "id": "p2", "name": "Regionen-Detail", "aggregationLevel": "detail" },
    { "id": "p3", "name": "DACH-Breakdown", "filter": "DACH", "aggregationLevel": "filtered" },
    { "id": "p4", "name": "Nordics-Breakdown", "filter": "Nordics", "aggregationLevel": "filtered" },
    { "id": "p5", "name": "Southern Europe-Breakdown", "filter": "Southern Europe", "aggregationLevel": "filtered" }
  ]
}
```

---

### 3. LAYOUT-RANKING-PROMPT
| Eigenschaft | Wert |
|-------------|------|
| **Speicherort** | `4. Prompts/LAYOUT-RANKING-PROMPT.md` |
| **Aufgerufen in** | `charts.html` → `LayoutRanker.rank()` |
| **API-Calls** | 1 |

**Aufgaben:**
1. Prüft welche Templates zu den Daten passen
2. Maximiert Perspektiven-Vielfalt
3. Verhindert redundante Layouts

---

### 4. FIELD-MAPPING-PROMPT (NEU: Separater API-Call)
| Eigenschaft | Wert |
|-------------|------|
| **Speicherort** | `4. Prompts/FIELD-MAPPING-PROMPT.md` |
| **Aufgerufen in** | `charts.html` → `ConfigGenerator._performFieldMapping()` |
| **API-Calls** | 1 pro Perspektive (gecached!) |

**Aufgaben:**
1. Mappt Template-Felder auf Quelldaten
2. Berücksichtigt Perspektive (Filter, Aggregation)
3. Erkennt berechnete/aggregierte Felder
4. Behandelt Vorzeichen-Konventionen

**Warum separater Call?**
- Transparenz: Mapping-Entscheidungen sind nachvollziehbar
- Caching: Mapping wird pro Perspektive gecached (spart API-Calls)
- Qualität: KI kann sich auf eine Aufgabe konzentrieren

---

### 5-7. CHART-PROMPTS (BAR, WATERFALL, STACKED-BAR)
| Eigenschaft | Wert |
|-------------|------|
| **Speicherort** | `4. Prompts/Prompts for Charts/*.md` |
| **Aufgerufen in** | `charts.html` → `ConfigGenerator._generateWithAI()` |
| **API-Calls** | 1 pro Template-Perspektive-Kombination |

**Aufgaben:**
1. Generiert vollständige Chart-Config im JSON-Format
2. Befolgt Template-Anforderungen
3. **Wendet Perspektive an** (Filter, Dimension)
4. **Nutzt vorbereitetes Field-Mapping**
5. Übernimmt Labels 1:1 aus Quelldaten

---

## Template-Wiederverwendung (NEUE LOGIK)

### Bisherige Logik (falsch):
```
Template 1 → Perspektive 1
Template 2 → Perspektive 2
Template 3 → Perspektive 3
...
```
Jedes Template nur 1x verwendet.

### Neue Logik (korrekt):
```
Perspektive 1 (Cluster-Übersicht) → Template 1, Template 2
Perspektive 2 (DACH-Breakdown)    → Template 1, Template 3
Perspektive 3 (Nordics-Breakdown) → Template 1, Template 2
...
```
Ein Template kann MEHRFACH verwendet werden, wenn die Daten unterschiedlich sind!

### Duplikat-Erkennung:
```javascript
// Fingerprint basiert auf DATEN, nicht auf Template!
fingerprint = `${chartType}:${perspectiveId}:${titleHash}:${dataStructure}`

// Beispiele:
"BAR:p1:clusterübersicht:3:3"  // Cluster-Übersicht mit Template 1
"BAR:p3:dachbreakdown:3:3"     // DACH-Breakdown mit Template 1  ← KEIN Duplikat!
"BAR:p1:clusterübersicht:3:3"  // Cluster-Übersicht mit Template 2  ← DUPLIKAT (gleiche Daten)
```

---

## API-Calls pro Durchlauf (Beispiel)

| Phase | Prompt | Anzahl Calls |
|-------|--------|--------------|
| Upload | DATA_ANALYZER | 1 |
| Chart-Gen | PERSPECTIVE-DERIVATION | 1 |
| Chart-Gen | LAYOUT-RANKING | 1 |
| Chart-Gen | FIELD-MAPPING | ~5 (1 pro Perspektive, gecached) |
| Chart-Gen | CHART-PROMPT | ~10 (Template × Perspektive Kombinationen) |
| **Gesamt** | | **~18** |

---

## Zusammenfassung der Änderungen

1. **FIELD-MAPPING ist jetzt separater API-Call** (nicht mehr inline im Chart-Prompt)
2. **Templates können mehrfach verwendet werden** (mit verschiedenen Perspektiven)
3. **Duplikat-Check basiert auf Daten** (Perspektive + Titel + Struktur), nicht auf Template-ID
4. **Field-Mapping wird gecached** pro Perspektive (spart API-Calls)
