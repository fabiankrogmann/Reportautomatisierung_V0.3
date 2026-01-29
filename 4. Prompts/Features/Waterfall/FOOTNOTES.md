# Feature: Footnotes (Fußnoten)

## 1. METADATA
- **ID**: `footnotes`
- **Version**: 1.0
- **Kategorie**: annotation
- **Komplexität**: niedrig

## 2. BESCHREIBUNG
Zeigt Fußnoten unterhalb des Charts an - für Quellenangaben, Währungs-/Einheitshinweise, vorläufige Werte oder erklärende Anmerkungen. Footnotes werden als kleine Textzeilen am unteren Rand des SVG gerendert.

## 3. TEMPLATE-KOMPATIBILITÄT
| Template-Kategorie | Kompatibel | Hinweise |
|--------------------|:----------:|----------|
| Structure | ○ | Optional, wenn Metadaten vorhanden |
| Variance | ○ | Optional, wenn Metadaten vorhanden |
| Trend | ○ | Optional, wenn Metadaten vorhanden |
| Compare-Bars | ○ | Optional, wenn Metadaten vorhanden |

## 4. AKTIVIERUNGSREGELN

### 4.1 Natürliche Sprache
"Aktiviere Footnotes wenn Quellenangaben in den Metadaten vorhanden sind, wenn vorläufige Werte markiert werden sollen, oder wenn die Währung/Einheit klargestellt werden muss.

Footnotes sind IMMER optional und bei ALLEN Template-Typen verwendbar. Sie stören kein anderes Feature."

### 4.2 Pseudo-Code
```
IF metadata.source != null
   OR metadata.preliminary == true
   OR metadata.currency != null
   OR metadata.unit != null
   OR metadata.notes.length > 0
THEN:
    footnotes.enabled = true
    footnotes.items = []

    IF metadata.unit:
        footnotes.items.push("Angaben in " + metadata.unit)
    IF metadata.currency AND metadata.currency != "EUR":
        footnotes.items.push("Währung: " + metadata.currency)
    IF metadata.source:
        footnotes.items.push("Quelle: " + metadata.source)
    IF metadata.preliminary:
        footnotes.items.push("* Vorläufige Werte")
    IF metadata.notes:
        footnotes.items.push(...metadata.notes)
ELSE:
    footnotes.enabled = false
```

### 4.3 Parameter-Berechnungsformeln
| Parameter | Formel | Beispiel |
|-----------|--------|----------|
| items | Array aus Metadaten zusammengestellt | ["Angaben in TEUR", "Quelle: Geschäftsbericht 2024"] |

## 5. CONFIG-SCHEMA

### 5.1 Minimale Config
```json
{
  "footnotes": {
    "enabled": true,
    "items": ["Angaben in TEUR"]
  }
}
```

### 5.2 Vollständige Config
```json
{
  "footnotes": {
    "enabled": true,
    "items": [
      "Angaben in TEUR",
      "Quelle: Geschäftsbericht 2024",
      "* Vorläufige Werte für Q4"
    ],
    "_reason": "Einheit (TEUR) und Quelle aus Metadaten vorhanden"
  }
}
```

## 6. RENDERING-LOGIK

### 6.1 Voraussetzungen
- Benötigt: `width`, `height`, `margin`
- Abhängig von: Muss ZULETZT gerendert werden (nach allen anderen Features)

### 6.2 SVG-Code
```javascript
// FEATURE: FOOTNOTES
// Wird ausgeführt wenn config.features.footnotes.enabled = true

if (config.features?.footnotes?.enabled) {
    const items = config.features.footnotes.items || [];

    if (items.length > 0) {
        const footnoteStartY = height - margin.bottom + 45;
        const lineHeight = 14;

        items.forEach((note, i) => {
            svgContent += `<text class="footnote"
                x="${margin.left}"
                y="${footnoteStartY + i * lineHeight}"
                font-size="9" fill="#999" font-style="italic">
                ${note}
            </text>`;
        });
    }
}
```

### 6.3 Positionierung
- **Z-Index**: LETZTER Rendering-Schritt (nach allen anderen Features)
- **Anchor**: Links unten (margin.left, unterhalb X-Achsen-Labels)
- **Spacing**: Benötigt ca. 14px pro Fußnote unterhalb des Charts; margin.bottom muss ggf. erhöht werden

## 7. CSS-STYLES

```css
.footnote {
    font-size: 9px;
    fill: #999;
    font-style: italic;
}
```

## 8. KONFLIKTE & ABHÄNGIGKEITEN

### Konflikte
| Konflikt mit | Grund | Lösung |
|--------------|-------|--------|
| - | Keine Konflikte | Footnotes sind immer kombinierbar |

### Abhängigkeiten
| Benötigt | Grund |
|----------|-------|
| - | Keine Abhängigkeiten |

## 9. EDGE-CASES & FEHLERBEHANDLUNG

| Situation | Verhalten |
|-----------|-----------|
| Leeres items-Array | Feature deaktivieren |
| > 3 Fußnoten | Auf 3 begrenzen (Platz) |
| Sehr langer Text | Auf 80 Zeichen pro Zeile begrenzen |
| Kein margin.bottom Platz | margin.bottom um items.length * 14 + 10 erhöhen |

## 10. BEISPIELE

### Beispiel 1: GuV mit Quellenangabe
**Input:**
```json
{
  "footnotes": {
    "enabled": true,
    "items": [
      "Angaben in TEUR",
      "Quelle: Geschäftsbericht 2024"
    ]
  }
}
```

**Ergebnis:**
```
  ┌─────┐  ┌──┐ ┌──┐  ┌──┐  ┌─────┐
  │█████│  │██│ │██│  │░░│  │█████│
  └─────┘  └──┘ └──┘  └──┘  └─────┘
   Umsatz  Mat.  Pers.  Sonst.  EBIT

  Angaben in TEUR
  Quelle: Geschäftsbericht 2024
```
