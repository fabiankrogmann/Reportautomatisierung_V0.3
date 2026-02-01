// =====================================================
// MODUL 2: DATA PROFILER
// Analysiert Daten ohne KI-Aufruf (reine JavaScript-Logik)
// =====================================================
const DataProfiler = {
    /**
     * Erstellt ein Profil des Datensatzes für die Template-Auswahl
     * @param {Object} analysisResult - Ergebnis des DATA_ANALYZER
     * @returns {Object} Daten-Profil
     */
    profile(analysisResult) {
        const parsed = analysisResult?.parsed || analysisResult;
        const analysis = parsed?.analysis || {};
        const extractedData = parsed?.extractedData || {};
        const metadata = parsed?.metadata || {};

        return {
            // Report-Typ identifizieren
            report_type: this._detectReportType(analysis, extractedData),

            // Datenumfang
            row_count: this._countRows(extractedData, analysis),
            period_count: this._countPeriods(analysis, metadata),

            // NEU: Detaillierte Listen für Anzeige
            position_labels: this._extractPositionLabels(extractedData, analysis),
            period_labels: this._extractPeriodLabels(analysis, metadata, extractedData),

            // NEU: Datenfrequenz und Aggregation
            data_frequency: this._detectDataFrequency(analysis, metadata),
            is_cumulative: this._detectCumulative(analysis, metadata),

            // Verfügbare Datenarten
            has_variance_column: this._hasVariance(analysis, extractedData),
            has_time_series: this._hasTimeSeries(analysis, metadata),
            has_budget: this._hasValueType(analysis, 'BUD'),
            has_forecast: this._hasValueType(analysis, 'FC'),
            has_prior_year: this._hasValueType(analysis, 'VJ'),

            // Verfügbare Felder
            available_fields: this._extractFieldNames(extractedData, analysis),
            available_value_types: this._extractValueTypes(analysis),

            // Chart-Empfehlung aus Analyse
            recommended_chart: parsed?.recommendation?.primaryChart || 'waterfall',

            // Rohdaten-Referenz
            raw_data: analysisResult?.csvData || analysisResult?.rawData || ''
        };
    },

    /**
     * Erkennt den Report-Typ (P&L, Balance Sheet, Cashflow, etc.)
     */
    _detectReportType(analysis, extractedData) {
        const keywords = analysis?.dataType?.toLowerCase() || '';

        if (keywords.includes('guv') || keywords.includes('income') ||
            keywords.includes('p&l') || keywords.includes('gewinn')) {
            return 'income_statement';
        }
        if (keywords.includes('bilanz') || keywords.includes('balance')) {
            return 'balance_sheet';
        }
        if (keywords.includes('cashflow') || keywords.includes('kapitalfluss')) {
            return 'cashflow';
        }
        if (keywords.includes('kosten') || keywords.includes('cost')) {
            return 'cost_report';
        }
        if (keywords.includes('umsatz') || keywords.includes('revenue') ||
            keywords.includes('sales')) {
            return 'revenue_report';
        }

        // Fallback: Analysiere die extrahierten Daten
        if (extractedData?.waterfall?.bars) {
            const labels = extractedData.waterfall.bars.map(b =>
                (b.label || '').toLowerCase());
            if (labels.some(l => l.includes('umsatz') || l.includes('revenue'))) {
                return 'income_statement';
            }
        }

        return 'financial_report';
    },

    /**
     * Zählt die Anzahl der Datenzeilen
     */
    _countRows(extractedData, analysis) {
        // Versuche aus verschiedenen Quellen
        if (extractedData?.waterfall?.bars) {
            return extractedData.waterfall.bars.length;
        }
        if (extractedData?.bar?.categories) {
            return extractedData.bar.categories.length;
        }
        if (extractedData?.stacked?.categories) {
            return extractedData.stacked.categories.length;
        }
        if (analysis?.rowCount) {
            return analysis.rowCount;
        }
        return 10; // Default-Annahme
    },

    /**
     * Zählt die Anzahl der Perioden
     */
    _countPeriods(analysis, metadata) {
        if (metadata?.periodCount) return metadata.periodCount;
        if (analysis?.periods?.length) return analysis.periods.length;
        if (analysis?.timeRange && typeof analysis.timeRange === 'string') {
            // Versuche aus timeRange zu extrahieren
            const match = analysis.timeRange.match(/(\d{4})/g);
            if (match) return match.length;
        }
        return 1;
    },

    /**
     * Prüft ob Varianz-Daten vorhanden sind
     */
    _hasVariance(analysis, extractedData) {
        if (analysis?.hasVariance) return true;
        if (extractedData?.waterfall?.bars) {
            const types = extractedData.waterfall.bars.map(b => b.type);
            return types.includes('increase') || types.includes('decrease');
        }
        return false;
    },

    /**
     * Prüft ob Zeitreihen-Daten vorhanden sind
     */
    _hasTimeSeries(analysis, metadata) {
        if (metadata?.isTimeSeries) return true;
        if (analysis?.dataFormat?.toLowerCase().includes('zeitreihe')) return true;
        if (analysis?.periods?.length > 2) return true;
        return false;
    },

    /**
     * Prüft ob eine bestimmte Wertart vorhanden ist
     */
    _hasValueType(analysis, type) {
        const types = analysis?.valueTypes || [];
        const typeMap = {
            'IST': ['ist', 'actual', 'fy', 'cy'],
            'BUD': ['bud', 'budget', 'plan'],
            'FC': ['fc', 'forecast', 'prognose'],
            'VJ': ['vj', 'py', 'prior', 'vorjahr']
        };

        const keywords = typeMap[type] || [];
        return types.some(t =>
            keywords.some(k => t.toLowerCase().includes(k))
        );
    },

    /**
     * Extrahiert Feldnamen aus den Daten
     */
    _extractFieldNames(extractedData, analysis) {
        const fields = new Set();

        // Aus Waterfall-Bars
        if (extractedData?.waterfall?.bars) {
            extractedData.waterfall.bars.forEach(b => {
                if (b.label) fields.add(b.label);
            });
        }

        // Aus Bar-Kategorien
        if (extractedData?.bar?.categories) {
            extractedData.bar.categories.forEach(c => fields.add(c));
        }

        // Aus Stacked-Kategorien
        if (extractedData?.stacked?.categories) {
            extractedData.stacked.categories.forEach(c => fields.add(c));
        }

        // Aus Analysis
        if (analysis?.fields) {
            analysis.fields.forEach(f => fields.add(f));
        }

        return Array.from(fields);
    },

    /**
     * Extrahiert verfügbare Wertarten
     */
    _extractValueTypes(analysis) {
        const types = [];
        if (this._hasValueType(analysis, 'IST')) types.push('IST');
        if (this._hasValueType(analysis, 'VJ')) types.push('VJ');
        if (this._hasValueType(analysis, 'BUD')) types.push('BUD');
        if (this._hasValueType(analysis, 'FC')) types.push('FC');

        // Fallback wenn nichts erkannt wurde
        if (types.length === 0) types.push('IST');

        return types;
    },

    /**
     * Extrahiert Position-Labels (Datenpunkte/Zeilen)
     */
    _extractPositionLabels(extractedData, analysis) {
        const labels = [];

        // Aus Waterfall-Bars (Array)
        if (Array.isArray(extractedData?.waterfall?.bars)) {
            extractedData.waterfall.bars.forEach(b => {
                if (b.label) labels.push(b.label);
            });
        }

        // Aus Waterfall-Positionen (manchmal als positions statt bars)
        if (labels.length === 0 && Array.isArray(extractedData?.waterfall?.positions)) {
            extractedData.waterfall.positions.forEach(p => {
                if (p.label) labels.push(p.label);
                else if (p.name) labels.push(p.name);
            });
        }

        // Aus Bar-Kategorien
        if (labels.length === 0 && Array.isArray(extractedData?.bar?.categories)) {
            extractedData.bar.categories.forEach(c => {
                if (typeof c === 'string') labels.push(c);
                else if (c?.label) labels.push(c.label);
                else if (c?.name) labels.push(c.name);
            });
        }

        // Aus Stacked-Kategorien
        if (labels.length === 0 && Array.isArray(extractedData?.stacked?.categories)) {
            extractedData.stacked.categories.forEach(c => {
                if (typeof c === 'string') labels.push(c);
                else if (c?.label) labels.push(c.label);
            });
        }

        // Aus Analysis positions (als Array)
        if (labels.length === 0 && Array.isArray(analysis?.positions)) {
            analysis.positions.forEach(p => {
                if (p.label) labels.push(p.label);
                else if (p.name) labels.push(p.name);
            });
        }

        // Aus Analysis rows (alternative Struktur)
        if (labels.length === 0 && Array.isArray(analysis?.rows)) {
            analysis.rows.forEach(r => {
                if (r.label) labels.push(r.label);
                else if (r.name) labels.push(r.name);
                else if (r.position) labels.push(r.position);
            });
        }

        // Aus extractedData.normalized (PROMPT-1 Standard-Format)
        if (labels.length === 0 && Array.isArray(extractedData?.normalized)) {
            extractedData.normalized.forEach(n => {
                if (n.position) labels.push(n.position);
                else if (n.label) labels.push(n.label);
                else if (n.name) labels.push(n.name);
            });
        }

        // Aus extractedData.positions als Objekt (PROMPT-1 Gruppen-Format)
        if (labels.length === 0 && extractedData?.positions && typeof extractedData.positions === 'object' && !Array.isArray(extractedData.positions)) {
            Object.values(extractedData.positions).forEach(group => {
                if (Array.isArray(group)) {
                    group.forEach(p => { if (typeof p === 'string') labels.push(p); });
                }
            });
        }

        // Aus extractedData.positions als Array (flache Struktur)
        if (labels.length === 0 && Array.isArray(extractedData?.positions)) {
            extractedData.positions.forEach(p => {
                if (typeof p === 'string') labels.push(p);
                else if (p?.label) labels.push(p.label);
                else if (p?.name) labels.push(p.name);
            });
        }

        // Aus extractedData.data (generische Struktur)
        if (labels.length === 0 && Array.isArray(extractedData?.data)) {
            extractedData.data.forEach(d => {
                if (d.label) labels.push(d.label);
                else if (d.name) labels.push(d.name);
                else if (d.position) labels.push(d.position);
            });
        }

        // Fallback: Aus available_fields (wird von _extractFieldNames gefüllt)
        if (labels.length === 0) {
            const fields = this._extractFieldNames(extractedData, analysis);
            if (fields.length > 0) {
                labels.push(...fields);
            }
        }

        return labels;
    },

    /**
     * Extrahiert Perioden-Labels
     */
    _extractPeriodLabels(analysis, metadata, extractedData) {
        const labels = [];

        // Aus extractedData.periods.all (PROMPT-1 Standard-Format)
        if (Array.isArray(extractedData?.periods?.all)) {
            extractedData.periods.all.forEach(p => {
                if (typeof p === 'string') labels.push(p);
            });
        }

        // Aus analysis.timeRange.periods (PROMPT-1 Alternative)
        if (labels.length === 0 && Array.isArray(analysis?.timeRange?.periods)) {
            analysis.timeRange.periods.forEach(p => {
                if (typeof p === 'string') labels.push(p);
            });
        }

        // Aus Analysis periods (als Array)
        if (labels.length === 0 && Array.isArray(analysis?.periods)) {
            analysis.periods.forEach(p => {
                if (typeof p === 'string') labels.push(p);
                else if (p?.label) labels.push(p.label);
                else if (p?.name) labels.push(p.name);
            });
        }

        // Aus Analysis scenarios (Szenarien als Perioden-Proxy)
        if (labels.length === 0 && Array.isArray(analysis?.scenarios)) {
            analysis.scenarios.forEach(s => {
                if (typeof s === 'string') labels.push(s);
            });
        }

        // Aus Metadata
        if (labels.length === 0 && Array.isArray(metadata?.periods)) {
            metadata.periods.forEach(p => labels.push(p));
        }

        // Aus extractedData bar periods
        if (labels.length === 0 && Array.isArray(extractedData?.bar?.periods)) {
            extractedData.bar.periods.forEach(p => {
                if (typeof p === 'string') labels.push(p);
                else if (p?.label) labels.push(p.label);
            });
        }

        // Aus timeRange extrahieren
        if (labels.length === 0 && analysis?.timeRange && typeof analysis.timeRange === 'string') {
            const years = analysis.timeRange.match(/\d{4}/g);
            if (years) labels.push(...years);
        }

        return labels;
    },

    /**
     * Erkennt die Datenfrequenz (Monat, Quartal, Jahr)
     */
    _detectDataFrequency(analysis, metadata) {
        const frequencyHints = [
            analysis?.dataFrequency,
            metadata?.frequency,
            analysis?.timeGranularity
        ].filter(Boolean).join(' ').toLowerCase();

        if (frequencyHints.includes('monat') || frequencyHints.includes('month')) {
            return 'Monatswerte';
        }
        if (frequencyHints.includes('quartal') || frequencyHints.includes('quarter') || frequencyHints.includes('q1') || frequencyHints.includes('q2')) {
            return 'Quartalswerte';
        }
        if (frequencyHints.includes('jahr') || frequencyHints.includes('year') || frequencyHints.includes('annual')) {
            return 'Jahreswerte';
        }

        // Heuristik: Wenn periods vorhanden und kurze Labels (z.B. "Jan", "Feb")
        if (analysis?.periods?.length >= 12) {
            return 'Monatswerte';
        }
        if (analysis?.periods?.length === 4) {
            return 'Quartalswerte';
        }

        return 'Jahreswerte'; // Default
    },

    /**
     * Erkennt ob Daten kumuliert oder selektiv sind
     */
    _detectCumulative(analysis, metadata) {
        const hints = [
            analysis?.aggregationType,
            metadata?.cumulative,
            analysis?.dataAggregation
        ].filter(Boolean).join(' ').toLowerCase();

        if (hints.includes('cum') || hints.includes('kum') || hints.includes('ytd') || hints.includes('cumul')) {
            return 'kumuliert (YTD)';
        }
        if (hints.includes('sel') || hints.includes('period') || hints.includes('einzel')) {
            return 'Einzelperiode';
        }

        return null; // Unbekannt
    }
};
