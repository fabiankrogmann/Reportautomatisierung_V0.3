# Plan: 50 Neue Testdateien

## Analyse der Template-Anforderungen

### Fehlende Daten-Kombinationen (aus vorheriger Analyse)
1. **IST + VJ + BUD + FC** (4 Szenarien) → für WF-16, WF-17
2. **VJ + Quartale** → für BC-08
3. **Lange Labels (>25 Zeichen)** → für SB-07 horizontal
4. **>10 Kategorien** → für WF-05 horizontal

### Aktuelle Verteilung (alte 50 Dateien)
- IST only: 20 (40%)
- IST + BUD: 13 (26%)
- IST + BUD + FC: 3 (6%)
- IST + VJ: 2 (4%)
- IST + BUD + VJ: 2 (4%)
- FC Iterations: 2 (4%)
- IST + FC: 1 (2%)

### Ziel-Verteilung (neue 50 Dateien)
- IST only: 5 (10%) - reduziert, da wenig Varianten möglich
- IST + BUD: 10 (20%)
- IST + FC: 5 (10%)
- IST + VJ: 8 (16%)
- IST + BUD + FC: 8 (16%)
- IST + BUD + VJ: 6 (12%)
- IST + FC + VJ: 4 (8%)
- **IST + BUD + FC + VJ: 4 (8%)** - NEU! Für WF-16/17

---

## Kategorien und Zeitperioden

### Finanzreport-Kategorien
| Kategorie | Anzahl | Typische Szenarien |
|-----------|--------|-------------------|
| GuV / P&L | 12 | Alle Kombinationen |
| Bilanz / Balance | 5 | IST+VJ, IST+BUD |
| Cashflow | 5 | IST, IST+FC |
| Segmente/Regionen | 8 | IST+BUD+FC, IST+VJ |
| Sales/Revenue | 8 | Alle Kombinationen |
| Kosten/OPEX | 6 | IST+BUD, IST+BUD+FC |
| Personal/HR | 3 | IST+BUD, IST+VJ |
| KPIs/Bridges | 3 | IST+BUD+FC+VJ |

### Zeitperioden-Mix
| Zeitraum | Anzahl | Beschreibung |
|----------|--------|--------------|
| Monat SEL | 15 | Einzelmonat (aktuell) |
| Monat KUM/YTD | 12 | Kumuliert Jan-Aktuell |
| Quartale | 10 | Q1-Q4 Vergleich |
| Halbjahr | 5 | H1 vs H2 |
| Annual | 5 | Jahresvergleich |
| Multi-Monat (12M) | 3 | Monatstrend |

---

## Die 50 neuen Testdateien

### Gruppe 1: GuV / P&L (12 Dateien)

| # | Dateiname | Szenarien | Zeitraum | Besonderheit |
|---|-----------|-----------|----------|--------------|
| 01 | GuV_Monat_IST_BUD_FC.csv | IST+BUD+FC | Monat SEL | 3-Szenario-Standard |
| 02 | GuV_Monat_IST_VJ.csv | IST+VJ | Monat SEL | YoY-Vergleich |
| 03 | GuV_YTD_IST_BUD_VJ.csv | IST+BUD+VJ | KUM | 3-Szenario YTD |
| 04 | GuV_Q1-Q4_IST_VJ.csv | IST+VJ | Quartale | Quartals-YoY für BC-08 |
| 05 | GuV_H1_IST_BUD_FC_VJ.csv | IST+BUD+FC+VJ | H1 | **4 Szenarien!** WF-16/17 |
| 06 | GuV_Detail_IST_BUD.csv | IST+BUD | Monat SEL | 15+ Positionen |
| 07 | GuV_Summary_IST_FC.csv | IST+FC | Monat SEL | Executive Summary |
| 08 | GuV_Monatstrend_12M.csv | IST only | 12 Monate | Trend ohne Vergleich |
| 09 | GuV_Quartale_IST_BUD_FC.csv | IST+BUD+FC | Q1-Q4 | Quartalsweise |
| 10 | GuV_YTD_IST_FC_VJ.csv | IST+FC+VJ | KUM | 3-Szenario inkl. VJ |
| 11 | GuV_H1H2_IST_BUD.csv | IST+BUD | H1+H2 | Halbjahresvergleich |
| 12 | GuV_Annual_IST_BUD_FC_VJ.csv | IST+BUD+FC+VJ | Annual | **4 Szenarien!** |

### Gruppe 2: Segmente / Regionen (8 Dateien)

| # | Dateiname | Szenarien | Zeitraum | Besonderheit |
|---|-----------|-----------|----------|--------------|
| 13 | Segment_DACH_EMEA_US_IST_BUD.csv | IST+BUD | Monat SEL | 3 Regionen |
| 14 | Segment_Produkte_IST_VJ.csv | IST+VJ | Monat SEL | Produktsegmente |
| 15 | Segment_Kunden_IST_BUD_FC.csv | IST+BUD+FC | KUM | Kundensegmente |
| 16 | Region_Q1-Q4_IST_VJ.csv | IST+VJ | Quartale | Regional YoY für BC-08 |
| 17 | Segment_Business_Units_IST_BUD_FC_VJ.csv | IST+BUD+FC+VJ | Monat | **4 Szenarien!** |
| 18 | Division_Revenue_IST_FC.csv | IST+FC | KUM | 5 Divisionen |
| 19 | Markt_Anteile_IST_VJ.csv | IST+VJ | Annual | Marktanteilsanalyse |
| 20 | Channel_Mix_IST_BUD.csv | IST+BUD | Monat SEL | Online/Retail/Wholesale |

### Gruppe 3: Sales / Revenue (8 Dateien)

| # | Dateiname | Szenarien | Zeitraum | Besonderheit |
|---|-----------|-----------|----------|--------------|
| 21 | Sales_Monthly_IST_FC.csv | IST+FC | Monat SEL | Forecast-Abweichung |
| 22 | Sales_YTD_IST_BUD_VJ.csv | IST+BUD+VJ | KUM | 3-Szenario YTD |
| 23 | Sales_Produkte_Top10_IST.csv | IST only | Monat SEL | Ranking >10 Items |
| 24 | Sales_Quartale_IST_VJ.csv | IST+VJ | Q1-Q4 | YoY Quartalsvergleich |
| 25 | Revenue_Mix_IST_BUD_FC.csv | IST+BUD+FC | Monat SEL | Produkt-Mix |
| 26 | Sales_H1_IST_BUD_FC_VJ.csv | IST+BUD+FC+VJ | H1 | **4 Szenarien!** |
| 27 | Revenue_Trend_12M_IST.csv | IST only | 12 Monate | Monatstrend |
| 28 | Sales_Kunden_Top15_IST_VJ.csv | IST+VJ | Annual | **Lange Labels** für SB-07 |

### Gruppe 4: Kosten / OPEX (6 Dateien)

| # | Dateiname | Szenarien | Zeitraum | Besonderheit |
|---|-----------|-----------|----------|--------------|
| 29 | Kosten_OPEX_IST_BUD.csv | IST+BUD | Monat SEL | Standard Budget |
| 30 | Kosten_Detail_IST_BUD_FC.csv | IST+BUD+FC | Monat SEL | 12+ Kostenarten |
| 31 | OPEX_YTD_IST_VJ.csv | IST+VJ | KUM | YoY Kostenvergleich |
| 32 | Kosten_Quartale_IST_BUD.csv | IST+BUD | Q1-Q4 | Quartalsweise Budget |
| 33 | Kosten_Abteilungen_LangeNamen.csv | IST+BUD | Monat SEL | **Labels >25 Zeichen** |
| 34 | OPEX_Kategorie_IST_FC_VJ.csv | IST+FC+VJ | Monat SEL | 3 Szenarien inkl. VJ |

### Gruppe 5: Bilanz / Balance Sheet (5 Dateien)

| # | Dateiname | Szenarien | Zeitraum | Besonderheit |
|---|-----------|-----------|----------|--------------|
| 35 | Bilanz_Aktiva_IST_VJ.csv | IST+VJ | Annual | YoY Bilanzvergleich |
| 36 | Bilanz_Passiva_IST_BUD.csv | IST+BUD | Monat SEL | Plan-Bilanz |
| 37 | Working_Capital_IST_BUD_FC.csv | IST+BUD+FC | Monat SEL | WC-Positionen |
| 38 | Balance_Sheet_IST_FC.csv | IST+FC | KUM | Forecast-Bilanz |
| 39 | Assets_Liabilities_IST_VJ.csv | IST+VJ | Q4 | Jahresend-Bilanz |

### Gruppe 6: Cashflow (5 Dateien)

| # | Dateiname | Szenarien | Zeitraum | Besonderheit |
|---|-----------|-----------|----------|--------------|
| 40 | Cashflow_Operating_IST.csv | IST only | Monat SEL | Bridge-Format |
| 41 | Cashflow_IST_FC.csv | IST+FC | KUM | FC-Abweichung |
| 42 | Cashflow_Quartale_IST_VJ.csv | IST+VJ | Q1-Q4 | Quartals-YoY |
| 43 | Cashflow_Direct_IST_BUD.csv | IST+BUD | Monat SEL | Direkte Methode |
| 44 | Cashflow_FCF_IST_BUD_FC.csv | IST+BUD+FC | H1 | Free Cashflow |

### Gruppe 7: Personal / HR (3 Dateien)

| # | Dateiname | Szenarien | Zeitraum | Besonderheit |
|---|-----------|-----------|----------|--------------|
| 45 | Personal_FTE_IST_BUD.csv | IST+BUD | Monat SEL | Headcount |
| 46 | HR_Kosten_IST_VJ.csv | IST+VJ | KUM | YoY Personalkosten |
| 47 | Personal_Abteilungen_Lang.csv | IST+BUD | Monat SEL | **Lange Abteilungsnamen** |

### Gruppe 8: KPIs / Bridges (3 Dateien)

| # | Dateiname | Szenarien | Zeitraum | Besonderheit |
|---|-----------|-----------|----------|--------------|
| 48 | KPI_Dashboard_IST_BUD_FC_VJ.csv | IST+BUD+FC+VJ | Monat SEL | **4 Szenarien!** |
| 49 | EBITDA_Bridge_IST_VJ.csv | IST+VJ | Monat SEL | Bridge-Format |
| 50 | Margin_Analysis_IST_BUD_FC.csv | IST+BUD+FC | KUM | Margenanalyse |

---

## Zusammenfassung Szenario-Verteilung

| Szenario-Kombination | Anzahl | Prozent | Target |
|---------------------|--------|---------|--------|
| IST only | 5 | 10% | 10% |
| IST + BUD | 10 | 20% | 20% |
| IST + FC | 5 | 10% | 10% |
| IST + VJ | 8 | 16% | 16% |
| IST + BUD + FC | 8 | 16% | 16% |
| IST + BUD + VJ | 0 | 0% | - |
| IST + FC + VJ | 2 | 4% | - |
| IST + BUD + FC + VJ | 5 | 10% | 8% |
| **Gesamt** | **50** | **100%** | |

### Anpassung: IST + BUD + VJ hinzufügen

Korrigierte Verteilung (mit IST+BUD+VJ):
- Datei 03, 22: IST+BUD+VJ (2 Dateien)
- Datei 11 umbenennen zu IST+BUD+VJ

## Zeitraum-Verteilung

| Zeitraum | Anzahl | Prozent |
|----------|--------|---------|
| Monat SEL | 18 | 36% |
| Monat KUM/YTD | 9 | 18% |
| Quartale (Q1-Q4) | 8 | 16% |
| Halbjahr (H1/H2) | 5 | 10% |
| Annual | 4 | 8% |
| 12-Monats-Trend | 3 | 6% |
| Multi | 3 | 6% |

## Spezielle Anforderungen

### Für WF-16, WF-17 (YoY Bridge mit Compare-Bars)
- **Benötigt: IST + VJ + BUD + FC** (4 Szenarien)
- Dateien: 05, 12, 17, 26, 48 (5 Dateien)

### Für BC-08 (YoY Vergleich gruppiert)
- **Benötigt: IST + VJ + Quartals-Struktur**
- Dateien: 04, 16, 24, 42 (4 Dateien)

### Für SB-07 (Horizontal mit langen Labels)
- **Benötigt: Labels > 25 Zeichen**
- Dateien: 28, 33, 47 (3 Dateien)

### Für WF-05 (Horizontal P&L)
- **Benötigt: >10 Positionen**
- Dateien: 06, 23, 30 (3 Dateien)

---

## Datenqualität-Anforderungen

### Realistische Wertebereiche
- Umsatz: 1 Mio - 500 Mio EUR
- Kosten: Proportional zu Umsatz (60-90%)
- EBITDA-Marge: 5-25%
- Varianzen: -15% bis +20% realistisch

### Logische Konsistenz
- IST < BUD bei konservativer Planung (meistens)
- FC zwischen IST und BUD (Rolling Forecast)
- VJ ~IST ± 10% (normales Wachstum/Rückgang)
- Summen müssen stimmen

### Spracherhaltung
- Deutsche Labels (Umsatz, Kosten, Ergebnis)
- Englische Labels für internationale Dateien
- Keine gemischten Sprachen

---

## Nächste Schritte

1. Alle 50 CSV-Dateien generieren
2. Dateien im Ordner `5. Datenbeispiele/` speichern
3. Phase 1 Tests durchführen
4. Phase 2 Tests durchführen
5. Prüfen ob alle 40 Templates genutzt werden
