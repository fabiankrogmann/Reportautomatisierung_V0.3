// =====================================================
// MODUL 4: CHART MIXER
// Filtert Templates nach Typ und nutzt optional KI-Ranking
// =====================================================
const ChartMixer = {
    /**
     * Wählt Templates des gewählten Typs aus
     * @param {Object} profile - Daten-Profil vom DataProfiler
     * @param {Array} templates - Verfügbare Templates
     * @param {number} count - Max Anzahl (für Ranking)
     * @param {Array} allowedTypes - Erlaubte Chart-Typen (nur einer!)
     * @param {boolean} useRanking - Ob KI-Ranking verwendet werden soll
     * @returns {Promise<Array>} Ausgewählte Templates
     */
    selectTemplates(profile, templates, count, allowedTypes = ['waterfall']) {
        // Filtere Templates nach erlaubtem Typ
        const filtered = templates.filter(t =>
            allowedTypes.includes(t.chart_type) ||
            allowedTypes.includes(t.chart_type.replace('_', '-'))
        );

        console.log(`ChartMixer: ${filtered.length} Templates für Typ "${allowedTypes.join(', ')}" gefunden`);
        console.log('ChartMixer: Template-IDs:', filtered.map(t => t.template_id).join(', '));

        // Alle Templates des Typs zurückgeben (Ranking macht jetzt PROMPT-2)
        return filtered;
    }
};

// =====================================================
// MODUL 4b: LAYOUT RANKER — ENTFERNT (ersetzt durch PROMPT-2)
// MODUL 4c: PERSPECTIVE DERIVER — ENTFERNT (ersetzt durch PROMPT-2)
// =====================================================

// =====================================================
// MODUL 5a: DETERMINISTIC CONFIG GENERATOR
// Ersetzt PROMPT-3 — generiert Chart-Configs deterministisch
// =====================================================
const DeterministicConfigGenerator = {

    generateConfig(variant, analysisResult, colors, detectedLanguage) {
        const template = TemplateLoader.getAll().find(t => t.template_id === variant.templateId) || {};
        const chartType = (template.chart_type || 'waterfall').replace('-', '_');
        const extracted = analysisResult.parsed?.extractedData || {};
        const analysis = analysisResult.parsed?.analysis || {};
        const metadata = analysisResult.parsed?.metadata || {};

        // Extrahiere tatsächliche Value-Keys aus normalized-Daten
        // Dies ist die einzige zuverlässige Quelle — analysis.scenarios kann abweichen
        const actualValueKeys = this._extractActualValueKeys(extracted.normalized || []);
        if (actualValueKeys.length > 0) {
            const mergedScenarios = this._mergeScenarios(analysis.scenarios || [], actualValueKeys);
            analysis.scenarios = mergedScenarios;
            analysis._actualValueKeys = actualValueKeys;
        }

        let config;
        switch (chartType) {
            case 'waterfall':
                config = this._generateWaterfallConfig(variant, template, extracted, analysis, metadata, colors);
                break;
            case 'bar':
                config = this._generateBarConfig(variant, template, extracted, analysis, metadata, colors);
                break;
            case 'stacked_bar':
                config = this._generateStackedBarConfig(variant, template, extracted, analysis, metadata, colors);
                break;
            default:
                config = this._generateWaterfallConfig(variant, template, extracted, analysis, metadata, colors);
        }

        // Gemeinsame Metadaten
        config._generatedBy = 'deterministic';
        config._layoutId = variant.templateId;
        config._perspectiveName = variant.perspective || null;
        config._variantTitle = variant.title;
        config.title = variant.title || template.display_name || '';
        config.subtitle = variant.subtitle || metadata.suggestedSubtitle || '';

        console.log(`DeterministicConfigGenerator: "${variant.title}" (${variant.templateId}) → ${config.bars?.length ?? 0} bars`);
        return config;
    },

    // ── Waterfall Config ──────────────────────────────────
    _generateWaterfallConfig(variant, template, extracted, analysis, metadata, colors) {
        const category = this._getTemplateCategory(template.template_id);
        const normalized = extracted.normalized || [];
        const scenarios = analysis.scenarios || ['IST'];
        const chartColors = this._resolveWaterfallColors(colors);

        let bars;
        switch (category) {
            case 'variance':
                bars = this._buildVarianceBars(normalized, variant.dataFilter, scenarios, chartColors);
                break;
            case 'trend':
                bars = this._buildTrendBars(normalized, variant.dataFilter, extracted.periods, scenarios, chartColors);
                break;
            case 'compare':
                bars = this._buildCompareBars(normalized, variant.dataFilter, scenarios, chartColors);
                break;
            default:
                bars = this._buildStructureBars(normalized, variant.dataFilter, scenarios, chartColors);
        }

        const features = this._activateFeatures(bars, template, category, analysis, extracted);

        return {
            type: 'waterfall',
            bars: bars,
            colors: chartColors,
            features: features
        };
    },

    // Case-insensitive Wert-Lookup in item.values mit Alias-Auflösung
    _getValueForScenario(values, scenario) {
        if (!values) return undefined;
        // 1. Exakter Match
        if (values[scenario] !== undefined) return values[scenario];
        // 2. Case-insensitive Match
        const upper = scenario.toUpperCase();
        const keys = Object.keys(values);
        const ciKey = keys.find(k => k.toUpperCase() === upper);
        if (ciKey) return values[ciKey];
        // 3. Alias-Match: z.B. scenario="FC" → suche "Forecast" in values-keys
        const aliases = this._SCENARIO_ALIASES[upper] || [];
        for (const alias of aliases) {
            const aliasKey = keys.find(k => k.toUpperCase() === alias.toUpperCase());
            if (aliasKey) return values[aliasKey];
        }
        // 4. Reverse-Alias: values hat z.B. "FC", scenario ist "Forecast"
        for (const k of keys) {
            const kAliases = this._SCENARIO_ALIASES[k.toUpperCase()] || [];
            if (kAliases.some(a => a.toUpperCase() === upper)) return values[k];
        }
        // 5. Substring-Match: z.B. scenario="IST" und key="IST_CUM" oder key="IST Q1"
        const substringKey = keys.find(k => k.toUpperCase().includes(upper) || upper.includes(k.toUpperCase()));
        if (substringKey) return values[substringKey];
        // 6. Wenn nur ein Wert vorhanden, diesen nehmen
        if (keys.length === 1) return values[keys[0]];
        return undefined;
    },

    // ── Structure Bars (WF-01,02,05,06,07,10) ────────────
    _buildStructureBars(normalized, dataFilter, scenarios, colors) {
        const scenario = this._resolveScenario(dataFilter, scenarios);
        return normalized
            .filter(item => item.values && this._getValueForScenario(item.values, scenario) !== undefined)
            .map(item => {
                const value = this._getValueForScenario(item.values, scenario);
                return {
                    label: item.position,
                    value: value,
                    type: item.type || 'increase',
                    displayValue: this._formatValue(value),
                    color: this._colorForBarType(item.type, colors)
                };
            });
    },

    // ── Variance Bars (WF-03,04,08,09,12) ────────────────
    _buildVarianceBars(normalized, dataFilter, scenarios, colors) {
        const scenarioPair = this._resolveScenarioPair(dataFilter, scenarios);
        const [fromScenario, toScenario] = scenarioPair;

        const startItem = normalized.find(n => n.type === 'start');
        const endItem = normalized.find(n => n.type === 'end');

        const fromValue = this._getValueForScenario(startItem?.values, fromScenario)
                       ?? this._getValueForScenario(endItem?.values, fromScenario) ?? 0;
        const toValue = this._getValueForScenario(startItem?.values, toScenario)
                     ?? this._getValueForScenario(endItem?.values, toScenario) ?? 0;

        const bars = [];

        bars.push({
            label: fromScenario,
            value: fromValue,
            type: 'start',
            displayValue: this._formatValue(fromValue),
            color: colors.start
        });

        normalized
            .filter(n => n.type !== 'start' && n.type !== 'end')
            .forEach(item => {
                const fromVal = this._getValueForScenario(item.values, fromScenario) ?? 0;
                const toVal = this._getValueForScenario(item.values, toScenario) ?? 0;
                const delta = toVal - fromVal;
                if (Math.abs(delta) > 0) {
                    bars.push({
                        label: item.position,
                        value: delta,
                        type: delta >= 0 ? 'increase' : 'decrease',
                        displayValue: this._formatValue(delta),
                        color: delta >= 0 ? colors.positive : colors.negative
                    });
                }
            });

        bars.push({
            label: toScenario,
            value: toValue,
            type: 'end',
            displayValue: this._formatValue(toValue),
            color: colors.end
        });

        return bars;
    },

    // ── Trend Bars (WF-11,13) ─────────────────────────────
    _buildTrendBars(normalized, dataFilter, periods, scenarios, colors) {
        return this._buildStructureBars(normalized, dataFilter, scenarios, colors);
    },

    // ── Compare Bars (WF-14 bis WF-19) ───────────────────
    _buildCompareBars(normalized, dataFilter, scenarios, colors) {
        const bars = this._buildStructureBars(normalized, dataFilter, scenarios, colors);
        const primaryScenario = this._resolveScenario(dataFilter, scenarios);
        const compareScenarios = (Array.isArray(dataFilter?.scenario) ? dataFilter.scenario : scenarios)
            .filter(s => s !== primaryScenario);

        if (compareScenarios.length > 0) {
            const startItem = normalized.find(n => n.type === 'start');
            const endItem = normalized.find(n => n.type === 'end');

            compareScenarios.forEach(cs => {
                const startVal = this._getValueForScenario(startItem?.values, cs);
                if (startVal !== undefined) {
                    const idx = bars.findIndex(b => b.type === 'start');
                    if (idx >= 0) {
                        bars.splice(idx + 1, 0, {
                            label: cs,
                            value: startVal,
                            type: 'compare',
                            displayValue: this._formatValue(startVal),
                            color: colors.compare || '#7F8C8D'
                        });
                    }
                }
                const endVal = this._getValueForScenario(endItem?.values, cs);
                if (endVal !== undefined) {
                    bars.push({
                        label: cs,
                        value: endVal,
                        type: 'compare',
                        displayValue: this._formatValue(endVal),
                        color: colors.compare || '#7F8C8D'
                    });
                }
            });
        }

        return bars;
    },

    // ── Bar Config ────────────────────────────────────────
    _generateBarConfig(variant, template, extracted, analysis, metadata, colors) {
        const normalized = extracted.normalized || [];
        const scenarios = analysis.scenarios || ['IST'];
        // Resolve KI-Szenarien gegen tatsächliche Szenarien (case-insensitive)
        const rawScenarios = Array.isArray(variant.dataFilter?.scenario)
            ? variant.dataFilter.scenario
            : [this._resolveScenario(variant.dataFilter, scenarios)];
        const resolvedScenarios = rawScenarios.map(s => this._matchScenario(s, scenarios) || s);

        const barColors = Array.isArray(colors) && colors.length > 0 ? colors : DEFAULT_COLORS.bar;
        const periods = resolvedScenarios.map((s, i) => ({
            label: s,
            color: barColors[i % barColors.length] || DEFAULT_COLORS.bar[i % DEFAULT_COLORS.bar.length],
            type: ['FC', 'FORECAST', 'BUD', 'BUDGET', 'PLAN'].includes(s.toUpperCase()) ? s : 'IST'
        }));

        const categories = normalized
            .filter(item => item.type !== 'subtotal')
            .map(item => ({
                name: item.position,
                values: resolvedScenarios.map(s => Math.abs(this._getValueForScenario(item.values, s) ?? 0))
            }));

        return {
            type: 'bar',
            periods: periods,
            categories: categories
        };
    },

    // ── Stacked Bar Config ────────────────────────────────
    _generateStackedBarConfig(variant, template, extracted, analysis, metadata, colors) {
        const normalized = extracted.normalized || [];
        const scenarios = analysis.scenarios || ['IST'];
        const scenario = this._resolveScenario(variant.dataFilter, scenarios);

        const stackedColors = Array.isArray(colors) && colors.length > 0 ? colors : DEFAULT_COLORS.stacked;
        const periodLabels = extracted.periods?.all || scenarios;
        const categories = periodLabels.map(p => ({ name: p }));

        const positions = normalized.filter(n =>
            !['start', 'end', 'subtotal'].includes(n.type)
        );

        const segments = positions.map((pos, i) => ({
            name: pos.position,
            color: stackedColors[i % stackedColors.length] || DEFAULT_COLORS.stacked[i % DEFAULT_COLORS.stacked.length],
            values: periodLabels.map(p => {
                return Math.abs(this._getValueForScenario(pos.values, p) ?? this._getValueForScenario(pos.values, scenario) ?? 0);
            }),
            type: pos.type
        }));

        return {
            type: 'stacked-bar',
            categories: categories,
            segments: segments,
            options: { showValues: true, showTotals: true, showLegend: true }
        };
    },

    // ── Feature-Aktivierung (alle 7 Features) ────────────
    _activateFeatures(bars, template, category, analysis, extracted) {
        const features = {};
        const available = template.availableFeatures || [];
        const hints = template.featureHints || {};

        // 1. BRACKET
        if (available.includes('bracket')) {
            const startBar = bars.find(b => b.type === 'start');
            const endBar = bars.find(b => b.type === 'end');

            if (bars.length >= 4 && startBar && endBar && startBar.value !== 0) {
                const delta = (endBar.value - startBar.value) / Math.abs(startBar.value);

                if (Math.abs(delta) > 0.05) {
                    let mode = hints.bracket?.mode || 'standard';
                    if (category === 'variance') {
                        const sc = analysis.scenarios || [];
                        if (sc.includes('BUD')) mode = 'budget';
                        else if (sc.includes('VJ') || sc.includes('PY')) mode = 'yoy';
                        else if (sc.includes('FC')) mode = 'fc';
                    } else if (category === 'trend') {
                        mode = 'cagr';
                    }

                    const sign = delta >= 0 ? '+' : '';
                    let label = `${sign}${(delta * 100).toFixed(1)}%`;
                    if (mode === 'budget') label += ' vs. Budget';
                    else if (mode === 'yoy') label += ' YoY';
                    else if (mode === 'fc') label += ' vs. FC';

                    features.bracket = {
                        enabled: true,
                        mode: mode,
                        fromIndex: bars.indexOf(startBar),
                        toIndex: bars.indexOf(endBar),
                        label: label,
                        _reason: `Delta ${(delta * 100).toFixed(1)}% > 5% Schwelle`
                    };
                } else {
                    features.bracket = { enabled: false, _reason: `Delta ${(delta * 100).toFixed(1)}% < 5% Schwelle` };
                }
            } else {
                features.bracket = { enabled: false, _reason: bars.length < 4 ? 'Weniger als 4 Balken' : 'Kein Start/End' };
            }
        }

        // 2. SCALE-BREAK
        if (available.includes('scaleBreak') && ['structure', 'variance'].includes(category)) {
            const deltas = bars.filter(b => ['increase', 'decrease'].includes(b.type));
            const avgDelta = deltas.length > 0
                ? deltas.reduce((s, b) => s + Math.abs(b.value), 0) / deltas.length
                : 0;
            const maxBar = Math.max(
                bars.find(b => b.type === 'start')?.value || 0,
                bars.find(b => b.type === 'end')?.value || 0
            );
            const ratio = avgDelta > 0 ? maxBar / avgDelta : 0;

            if (ratio > 3) {
                features.scaleBreak = {
                    enabled: true,
                    breakAt: avgDelta * 2,
                    style: 'zigzag',
                    _reason: `Ratio ${ratio.toFixed(1)} > 3`
                };
            } else {
                features.scaleBreak = { enabled: false, _reason: `Ratio ${ratio.toFixed(1)} <= 3` };
            }
        }

        // 3. NEGATIVE-BRIDGES
        if (available.includes('negativeBridges')) {
            let cumulative = 0;
            const cumulatives = bars.map(b => {
                if (b.type === 'start') cumulative = b.value;
                else if (b.type === 'end') cumulative = b.value;
                else cumulative += b.value;
                return cumulative;
            });
            const minVal = Math.min(...cumulatives);

            if (cumulatives.some(v => v < 0)) {
                features.negativeBridges = {
                    enabled: true,
                    minValue: minVal,
                    crossingIndices: cumulatives.reduce((acc, v, i) => {
                        if (i > 0 && ((cumulatives[i-1] >= 0 && v < 0) || (cumulatives[i-1] < 0 && v >= 0))) acc.push(i);
                        return acc;
                    }, []),
                    _reason: `Min. kumulativer Wert: ${minVal}`
                };
                if (features.scaleBreak?.enabled) {
                    features.scaleBreak.enabled = false;
                    features.scaleBreak._reason = 'Deaktiviert wegen negativeBridges (Konflikt)';
                }
            } else {
                features.negativeBridges = { enabled: false, _reason: 'Alle kumulativen Werte positiv' };
            }
        }

        // 4. CATEGORY-BRACKETS
        if (available.includes('categoryBrackets') && category === 'structure') {
            const hierarchy = analysis.hierarchy;
            if (hierarchy?.detected && hierarchy.groups?.length >= 2) {
                const startBar = bars.find(b => b.type === 'start');
                const referenceValue = startBar?.value || 1;

                const items = [];
                bars.forEach((bar, idx) => {
                    if (bar.type === 'decrease' || bar.type === 'increase') {
                        const pct = Math.abs(bar.value / referenceValue * 100).toFixed(1);
                        items.push({
                            barIndex: idx,
                            label: pct + '%',
                            description: 'vom ' + (startBar?.label || 'Gesamt')
                        });
                    }
                });

                if (items.length > 0) {
                    features.categoryBrackets = { enabled: true, items: items, _reason: 'Hierarchie erkannt' };
                } else {
                    features.categoryBrackets = { enabled: false, _reason: 'Keine sinnvollen Anteile berechenbar' };
                }
            } else {
                features.categoryBrackets = { enabled: false, _reason: category !== 'structure' ? 'Nicht Structure' : 'Keine Hierarchie' };
            }
        }

        // 5. GROUPING
        if (available.includes('grouping') && category === 'structure' && bars.length >= 6) {
            const hierarchy = analysis.hierarchy;
            if (hierarchy?.detected && hierarchy.groups?.length >= 2) {
                features.grouping = {
                    enabled: true,
                    groups: hierarchy.groups.map(g => ({
                        label: g.name || g.label,
                        fromIndex: g.firstBarIndex || 0,
                        toIndex: g.lastBarIndex || 0
                    })),
                    style: hints.grouping?.style || 'bracket',
                    _reason: `${hierarchy.groups.length} Gruppen erkannt`
                };
            } else {
                features.grouping = { enabled: false, _reason: 'Keine Hierarchie-Gruppen' };
            }
        }

        // 6. BENCHMARK-LINES
        if (available.includes('benchmarkLines')) {
            const targetScenarios = (analysis.scenarios || [])
                .filter(s => ['TARGET', 'GUIDANCE', 'PLAN', 'ZIEL'].includes(s.toUpperCase()));

            if (targetScenarios.length > 0) {
                const endItem = (extracted.normalized || []).find(n => n.type === 'end');
                const lines = targetScenarios.slice(0, 2).map((ts, i) => ({
                    value: endItem?.values?.[ts] || 0,
                    label: ts,
                    style: i === 0 ? 'dashed' : 'dotted',
                    color: i === 0 ? '#FF8C00' : '#888888'
                }));
                features.benchmarkLines = { enabled: true, lines: lines, _reason: `Zielwerte: ${targetScenarios.join(', ')}` };
            } else {
                features.benchmarkLines = { enabled: false, _reason: 'Keine Zielwert-Szenarien' };
            }
        }

        // 7. ARROWS (nur wenn bracket NICHT aktiv)
        if (available.includes('arrows')) {
            features.arrows = {
                enabled: false,
                _reason: features.bracket?.enabled ? 'Bracket hat Priorität (Konflikt)' : 'Kein spezifischer Vergleich'
            };
        }

        return features;
    },

    // ── Helfer-Methoden ───────────────────────────────────

    // Extrahiert alle tatsächlichen Value-Keys aus normalized[].values
    // Dies ist die einzige zuverlässige Szenario-Quelle
    _extractActualValueKeys(normalized) {
        const keySet = new Set();
        for (const item of normalized) {
            if (item.values && typeof item.values === 'object') {
                for (const k of Object.keys(item.values)) {
                    keySet.add(k);
                }
            }
        }
        return [...keySet];
    },

    // Merged analysis.scenarios mit tatsächlichen Value-Keys
    // Stellt sicher dass alle tatsächlichen Keys als Szenarien verfügbar sind
    _mergeScenarios(declaredScenarios, actualKeys) {
        const result = [...declaredScenarios];
        for (const key of actualKeys) {
            // Prüfe ob dieser Key bereits (exakt oder als Alias) abgedeckt ist
            const alreadyCovered = result.some(s => {
                if (s === key) return true;
                if (s.toUpperCase() === key.toUpperCase()) return true;
                const aliases = this._SCENARIO_ALIASES[s.toUpperCase()] || [];
                if (aliases.some(a => a.toUpperCase() === key.toUpperCase())) return true;
                const keyAliases = this._SCENARIO_ALIASES[key.toUpperCase()] || [];
                if (keyAliases.some(a => a.toUpperCase() === s.toUpperCase())) return true;
                return false;
            });
            if (!alreadyCovered) {
                result.push(key);
            }
        }
        return result;
    },

    _getTemplateCategory(templateId) {
        const map = {
            'WF-01':'structure', 'WF-02':'structure', 'WF-05':'structure',
            'WF-06':'structure', 'WF-07':'structure', 'WF-10':'structure',
            'WF-03':'variance', 'WF-04':'variance', 'WF-08':'variance',
            'WF-09':'variance', 'WF-12':'variance',
            'WF-11':'trend', 'WF-13':'trend',
            'WF-14':'compare', 'WF-15':'compare', 'WF-16':'compare',
            'WF-17':'compare', 'WF-18':'compare', 'WF-19':'compare'
        };
        return map[templateId] || 'structure';
    },

    // Szenario-Alias-Map: KI-Modelle verwenden unterschiedliche Bezeichnungen
    _SCENARIO_ALIASES: {
        'ACTUAL': ['IST', 'ACT', 'ACTUAL', 'ACTUALS', 'AKTUELL'],
        'IST': ['ACTUAL', 'ACT', 'ACTUALS', 'AKTUELL'],
        'FC': ['FORECAST', 'FCST', 'FC'],
        'FORECAST': ['FC', 'FCST'],
        'BUD': ['BUDGET', 'BUD', 'PLAN', 'TARGET'],
        'BUDGET': ['BUD', 'PLAN', 'TARGET'],
        'PLAN': ['BUD', 'BUDGET', 'TARGET'],
        'PY': ['VJ', 'PRIOR YEAR', 'PRIOR_YEAR', 'VORJAHR', 'LY', 'LAST YEAR'],
        'VJ': ['PY', 'PRIOR YEAR', 'PRIOR_YEAR', 'VORJAHR', 'LY', 'LAST YEAR'],
        'LY': ['PY', 'VJ', 'PRIOR YEAR', 'VORJAHR'],
        'YTD': ['YEAR TO DATE', 'YEAR-TO-DATE', 'CUM'],
        'CUM': ['YTD', 'CUMULATED', 'SEL_CUM'],
    },

    // Case-insensitive Szenario-Matching mit Alias-Auflösung
    // Findet das tatsächliche Szenario in der scenarios-Liste, auch wenn
    // KI-Modelle unterschiedliche Bezeichnungen verwenden
    _matchScenario(candidate, scenarios) {
        if (!candidate || !scenarios || scenarios.length === 0) return null;
        // 1. Exakter Match
        if (scenarios.includes(candidate)) return candidate;
        // 2. Case-insensitive Match
        const upper = candidate.toUpperCase();
        const match = scenarios.find(s => s.toUpperCase() === upper);
        if (match) return match;
        // 3. Alias-Match: z.B. KI sagt "Forecast" → suche "FC" in scenarios
        const aliases = this._SCENARIO_ALIASES[upper] || [];
        for (const alias of aliases) {
            const aliasMatch = scenarios.find(s => s.toUpperCase() === alias.toUpperCase());
            if (aliasMatch) return aliasMatch;
        }
        // 4. Reverse-Alias: z.B. scenarios hat "Forecast", KI sagt "FC"
        for (const s of scenarios) {
            const sAliases = this._SCENARIO_ALIASES[s.toUpperCase()] || [];
            if (sAliases.some(a => a.toUpperCase() === upper)) return s;
        }
        // 5. Kein Match
        return null;
    },

    _resolveScenario(dataFilter, scenarios) {
        if (dataFilter?.scenario && typeof dataFilter.scenario === 'string') {
            const matched = this._matchScenario(dataFilter.scenario, scenarios);
            if (matched) return matched;
            console.warn(`_resolveScenario: KI-Szenario "${dataFilter.scenario}" nicht in [${scenarios.join(', ')}] gefunden`);
        }
        if (Array.isArray(dataFilter?.scenario) && dataFilter.scenario.length > 0) {
            const matched = this._matchScenario(dataFilter.scenario[0], scenarios);
            if (matched) return matched;
            console.warn(`_resolveScenario: KI-Szenario "${dataFilter.scenario[0]}" nicht in [${scenarios.join(', ')}] gefunden`);
        }
        const priority = ['IST', 'ACTUAL', 'FC', 'FORECAST', 'BUD', 'BUDGET'];
        for (const p of priority) {
            const matched = this._matchScenario(p, scenarios);
            if (matched) return matched;
        }
        return scenarios[0] || 'IST';
    },

    _resolveScenarioPair(dataFilter, scenarios) {
        if (Array.isArray(dataFilter?.scenario) && dataFilter.scenario.length >= 2) {
            const s0 = this._matchScenario(dataFilter.scenario[0], scenarios) || dataFilter.scenario[0];
            const s1 = this._matchScenario(dataFilter.scenario[1], scenarios) || dataFilter.scenario[1];
            return [s0, s1];
        }
        // Case-insensitive Paar-Suche
        const pairs = [['BUD', 'IST'], ['VJ', 'IST'], ['PY', 'IST'], ['FC', 'IST']];
        for (const [a, b] of pairs) {
            const ma = this._matchScenario(a, scenarios);
            const mb = this._matchScenario(b, scenarios);
            if (ma && mb) return [ma, mb];
        }
        return [scenarios[0] || 'BUD', scenarios[1] || 'IST'];
    },

    _resolveWaterfallColors(colors) {
        if (Array.isArray(colors) && colors.length > 0) {
            return {
                start: colors[0] || DEFAULT_COLORS.waterfall.start,
                end: colors[0] || DEFAULT_COLORS.waterfall.end,
                positive: colors[1] || DEFAULT_COLORS.waterfall.positive,
                negative: colors[2] || DEFAULT_COLORS.waterfall.negative,
                compare: colors[3] || DEFAULT_COLORS.waterfall.compare,
                connector: '#333333'
            };
        }
        return { ...DEFAULT_COLORS.waterfall };
    },

    _colorForBarType(barType, colors) {
        const map = {
            start: colors.start, end: colors.end,
            increase: colors.positive, decrease: colors.negative,
            subtotal: colors.start, compare: colors.compare
        };
        return map[barType] || colors.start;
    },

    _formatValue(value) {
        const absVal = Math.abs(value);
        if (absVal >= 1000000) {
            return (value / 1000000).toFixed(1).replace('.', ',') + ' Mio.';
        }
        return Math.round(value).toLocaleString('de-DE');
    }
};
