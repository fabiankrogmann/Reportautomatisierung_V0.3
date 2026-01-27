# Phase 2 Analyse: PROMPT-2 Variant Generator

**Datum:** 2026-01-27
**Getestet:** 50 Dateien × 1 Chart-Typ (empfohlen aus Phase 1)
**Ergebnisse:** 47 Passed, 3 Warnings, 0 Failed
**Generierte Varianten:** 245 (Ø 4.9 pro Datei)

---

## 1. Übersicht Testergebnisse

| Metrik | Wert |
|--------|------|
| Gesamt Tests | 50 |
| Passed | 47 (94%) |
| Warnings | 3 (6%) |
| Failed | 0 (0%) |
| Total Varianten | 245 |
| Avg. Varianten/Datei | 4.9 |

### Validierungs-Checks Erfolgsrate

| Check | Erfolgsrate | Anmerkung |
|-------|-------------|-----------|
| templateIds | 100% | Alle Template-IDs existieren |
| noDuplicates | 100% | Keine Duplikate gefunden |
| variantCount | 100% | 3-10 Varianten im Bereich |
| dataFilterValid | 94% (47/50) | 3 Warnings |
| uniqueValues | 100% | Alle Varianten haben Begründung |

---

## 2. Template-Nutzung

### 2.1 Meistgenutzte Templates

| Rang | Template | Nutzung | Chart-Typ |
|------|----------|---------|-----------|
| 1 | BC-05 | 15× | Bar (Monthly Trend) |
| 2 | WF-01 | 12× | Waterfall (P&L Summary) |
| 2 | SB-09 | 12× | Stacked Bar (Monthly Stacked) |
| 4 | WF-04 | 10× | Waterfall (Budget Bridge) |
| 4 | SB-03 | 10× | Stacked Bar (Revenue Mix Trend) |
| 6 | BC-04 | 8× | Bar (Ranking) |
| 6 | BC-01 | 8× | Bar (IST vs BUD) |
| 6 | BC-08 | 8× | Bar (YoY Comparison) |
| 6 | SB-01 | 8× | Stacked Bar (Absolute) |
| 6 | WF-02 | 8× | Waterfall (P&L Detail) |

### 2.2 Ungenutzte Templates (7 von 40 = 17.5%)

| Template | Name | Empfehlung | Begründung |
|----------|------|------------|------------|
| **WF-05** | P&L Horizontal | ⚠️ BEHALTEN | Spezialfall für breite Präsentationen |
| **WF-07** | Margin Bridge | ❌ ENTFERNEN/ÜBERARBEITEN | Zu spezialisiert, keine Testdaten mit Margin-Fokus |
| **WF-15** | Budget Bridge (Vergleich links) | ⚠️ KONSOLIDIEREN mit WF-14 | Links/Rechts-Varianten redundant |
| **WF-16** | YoY Bridge (Vergleich rechts) | ⚠️ KONSOLIDIEREN | Benötigt 4 Szenarien (IST+VJ+BUD+FC) - selten verfügbar |
| **WF-17** | YoY Bridge (Vergleich links) | ⚠️ KONSOLIDIEREN mit WF-16 | Links/Rechts-Varianten redundant |
| **WF-19** | FC Bridge (Vergleich links) | ⚠️ KONSOLIDIEREN mit WF-18 | Links/Rechts-Varianten redundant |
| **SB-07** | Kostenaufschlüsselung (horizontal) | ⚠️ BEHALTEN | Spezialfall für lange Labels |

### 2.3 Analyse der ungenutzten Templates

#### Layout-Varianten (WF-14 bis WF-19)
**Problem:** Die Layout-Varianten (Compare-Bars links/rechts) wurden kaum genutzt.

**Ursachen:**
1. **Hohe Szenario-Anforderungen:** WF-16/WF-17 benötigen 4 Szenarien (IST+VJ+BUD+FC), was selten in Testdaten vorkommt
2. **Links/Rechts-Redundanz:** Prompt erwähnt beide Varianten, aber bietet keine klare Entscheidungshilfe
3. **Fehlende Prompt-Anleitung:** Kein expliziter Hinweis wann Layout-Varianten bevorzugt werden sollten

**Empfehlung:**
- Links-Varianten (WF-15, WF-17, WF-19) entfernen - Rechts ist Standard
- Im Prompt explizit erwähnen: "Generiere Layout-Variante wenn 3+ Szenarien vorhanden"

#### Horizontale Templates (WF-05, SB-07)
**Problem:** Horizontale Layouts wurden nie automatisch gewählt.

**Ursache:** Prompt enthält keine Kriterien wann horizontal gewählt werden sollte.

**Empfehlung:**
- Kriterium hinzufügen: "Wähle horizontal bei >10 Kategorien ODER Labels >30 Zeichen"

#### Margin Bridge (WF-07)
**Problem:** Template für spezifischen Anwendungsfall (Margin-Analyse) ohne passende Testdaten.

**Empfehlung:**
- Template behalten für zukünftige Fälle
- Prompt ergänzen: "Für reine Margin-Daten (Bruttomarge → Nettomarge) WF-07 verwenden"

---

## 3. Fehler-Patterns (Warnings)

### 3.1 Betroffene Dateien

| # | Datei | Warning | Ursache |
|---|-------|---------|---------|
| 43 | Working_Capital_Trend.csv | dataFilterValid: false | WC-Daten könnten auch als Waterfall dargestellt werden |
| 47 | Financials_Long_Format.csv | dataFilterValid: false | Long Format - Datenstruktur muss transformiert werden |
| 49 | Sparse_Data_with_Gaps.csv | dataFilterValid: false | Sparse Data - Lücken in Zeitreihe |

### 3.2 Analyse der Fehler

#### Pattern 1: Alternative Chart-Typ-Empfehlung (Datei 43)
**Problem:** Phase 1 empfahl Stacked Bar für Working Capital, aber die Daten hätten auch als Waterfall Sinn gemacht.

**Auswirkung:** dataFilter generiert Varianten für Stacked Bar, obwohl Bridge-Perspektive besser wäre.

**Prompt-Anpassung:**
```
Wenn Daten Bridge-Charakter haben (Komponenten die zu einem Total führen),
erwäge auch Waterfall-Templates, selbst wenn anderer Typ gewählt wurde.
```

#### Pattern 2: Long Format Daten (Datei 47)
**Problem:** Unpivotierte Daten (Entity | Metric | Value) erfordern Transformation.

**Auswirkung:** dataFilter kann nicht direkt auf Spalten zugreifen.

**Prompt-Anpassung:**
```
Bei Long Format (Entity | Metric | Value Struktur):
- Explizit vermerken dass Transformation nötig ist
- dataFilter auf logische Gruppierung, nicht physische Spalten beziehen
```

#### Pattern 3: Sparse Data (Datei 49)
**Problem:** Zeitreihen mit Lücken (z.B. nur Q1, Q3, Q4 ohne Q2).

**Auswirkung:** Trend-Templates (SB-09, BC-05) funktionieren nicht korrekt.

**Prompt-Anpassung:**
```
Bei Sparse Data (fehlende Perioden in Zeitreihe):
- Monthly/Quarterly Trend NICHT generieren wenn >20% der Perioden fehlen
- Stattdessen: Snapshot-Varianten für verfügbare Perioden
```

---

## 4. Empfohlene PROMPT-2 Anpassungen

### 4.1 Kritische Anpassungen (Prio 1)

#### A. Layout-Varianten-Regel hinzufügen
**Position im Prompt:** Nach "LAYOUT-VARIANTEN MIT COMPARE-BARS" Sektion

```markdown
**Automatische Generierung:**
- Generiere Layout-Variante (WF-14 oder WF-18) wenn IST + BUD + FC vorhanden
- Nur EINE Layout-Variante (rechts), nicht links + rechts
- Layout-Variante zählt als Bonus-Variante, nicht als Ersatz für Standard-Bridge
```

#### B. Horizontale Template-Kriterien
**Position im Prompt:** Neue Sektion nach "DETAIL-TIEFE"

```markdown
### F. ORIENTIERUNG (Horizontal vs. Vertikal)

Wähle horizontale Templates (WF-05, SB-07, BC-04) wenn:
- Mehr als 10 Kategorien/Positionen UND
- Durchschnittliche Label-Länge > 25 Zeichen ODER
- Explizit für Ranking-Darstellung (BC-04 immer horizontal)

Ansonsten: Vertikale Orientierung (Standard)
```

#### C. Sparse Data Warnung
**Position im Prompt:** In "ZEITLICHE PERSPEKTIVE" Sektion

```markdown
**SPARSE DATA HANDLING:**
Wenn Zeitreihe Lücken hat (>20% fehlende Perioden):
- ⚠️ KEINE Trend-Templates (BC-05, SB-09, SB-10) generieren
- Stattdessen: Snapshot-Varianten für verfügbare Perioden
- Im notGeneratedReasons vermerken: "Sparse Data - Trend nicht möglich"
```

### 4.2 Empfohlene Anpassungen (Prio 2)

#### D. Long Format Hinweis
**Position im Prompt:** Neue Sektion "SPEZIELLE DATENFORMATE"

```markdown
### G. SPEZIELLE DATENFORMATE

**Long Format (Entity | Metric | Value):**
- dataFilter bezieht sich auf logische Gruppierungen, nicht physische Spalten
- Transformation wird von PROMPT-3 übernommen
- Varianten nach logischen Dimensionen generieren (z.B. per Entity, per Metric)

**Wide/Pivoted Format:**
- Standard-Verarbeitung, keine Transformation nötig
```

#### E. Working Capital / Bridge-Charakter
**Position im Prompt:** In Chart-Typ-spezifische Regeln

```markdown
**BRIDGE-CHARAKTER ERKENNEN:**
Wenn Daten Bridge-Charakter haben (Start → Deltas → End),
auch Waterfall-Varianten in Betracht ziehen, selbst wenn
ursprünglich anderer Typ empfohlen wurde.

Indikatoren für Bridge-Charakter:
- "Anfangsbestand" / "Opening" vorhanden
- "Endbestand" / "Closing" vorhanden
- Zwischenwerte summieren sich zum Endwert
```

### 4.3 Nice-to-Have Anpassungen (Prio 3)

#### F. Template-Priorisierung dokumentieren
```markdown
**Template-Priorisierung:**

| Situation | Bevorzugtes Template |
|-----------|---------------------|
| Executive Summary | WF-01, SB-01, BC-04 |
| Detail-Analyse | WF-02, SB-03, BC-05 |
| Varianz-Analyse | WF-04, WF-12, BC-03 |
| Zeittrend | BC-05, SB-09, WF-13 |
| Ranking | BC-04 (immer horizontal) |
```

#### G. Margin Bridge Hinweis
```markdown
**Margin-Daten (Gross Margin → Net Margin):**
- Bei reinen Margin-Progressionen: WF-07 (Margin Bridge) verwenden
- Zeigt Margin-Kompression/Expansion auf einen Blick
```

---

## 5. Template-Konsolidierung Empfehlung

### Zu entfernende Templates (redundant)

| Template | Grund | Alternative |
|----------|-------|-------------|
| WF-15 | Links-Variante von WF-14 | WF-14 (rechts) |
| WF-17 | Links-Variante von WF-16 | WF-16 (rechts) |
| WF-19 | Links-Variante von WF-18 | WF-18 (rechts) |

### Zu behaltende aber selten genutzte Templates

| Template | Grund | Empfehlung |
|----------|-------|------------|
| WF-05 | Horizontale Waterfall | Automatische Auswahl-Kriterien hinzufügen |
| WF-07 | Margin Bridge | Für Margin-spezifische Daten reservieren |
| SB-07 | Horizontale Stacked | Für lange Labels reservieren |

---

## 6. Zusammenfassung

### Erfolge
- ✅ 94% Erfolgsrate (47/50)
- ✅ Alle Template-IDs valide
- ✅ Keine Duplikate
- ✅ Durchschnittlich 4.9 sinnvolle Varianten pro Datei

### Verbesserungspotential
- ⚠️ 7 von 40 Templates ungenutzt (17.5%)
- ⚠️ Layout-Varianten werden nicht automatisch gewählt
- ⚠️ Sparse Data wird nicht erkannt
- ⚠️ Long Format erfordert spezielle Behandlung

### Nächste Schritte
1. **Sofort:** Prompt-Anpassungen Prio 1 implementieren
2. **Kurzfristig:** Redundante Templates entfernen (WF-15, WF-17, WF-19)
3. **Mittelfristig:** Automatische Orientierungswahl implementieren
4. **Langfristig:** Margin Bridge Testdaten hinzufügen

---

## Anhang: Template-Nutzung Details

```
Waterfall (19 Templates):
WF-01: 12×  ████████████
WF-02:  8×  ████████
WF-03:  5×  █████
WF-04: 10×  ██████████
WF-05:  0×
WF-06:  4×  ████
WF-07:  0×
WF-08:  2×  ██
WF-09:  3×  ███
WF-10:  2×  ██
WF-11:  3×  ███
WF-12:  4×  ████
WF-13:  2×  ██
WF-14:  3×  ███
WF-15:  0×
WF-16:  0×
WF-17:  0×
WF-18:  2×  ██
WF-19:  0×

Stacked Bar (10 Templates):
SB-01:  8×  ████████
SB-02:  6×  ██████
SB-03: 10×  ██████████
SB-04:  4×  ████
SB-05:  5×  █████
SB-06:  3×  ███
SB-07:  0×
SB-08:  2×  ██
SB-09: 12×  ████████████
SB-10:  4×  ████

Bar Chart (10 Templates):
BC-01:  8×  ████████
BC-02:  6×  ██████
BC-03:  4×  ████
BC-04:  7×  ███████
BC-05: 15×  ███████████████
BC-06:  5×  █████
BC-07:  3×  ███
BC-08:  8×  ████████
BC-09:  2×  ██
BC-10:  6×  ██████
```
