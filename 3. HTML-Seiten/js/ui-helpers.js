function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showLoadingState() {
    // Vorheriges Interval aufräumen falls vorhanden
    if (window.loadingInterval) {
        clearInterval(window.loadingInterval);
        window.loadingInterval = null;
    }
    document.getElementById('charts-wrapper').innerHTML = `
        <div class="chart-container">
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <div class="loading-title">Charts werden generiert...</div>
                <div class="loading-subtitle">Die KI erstellt bis zu 10 optimierte Chart-Varianten</div>
                <div class="loading-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Animiere Progress-Bar
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        const fill = document.getElementById('progressFill');
        if (fill) fill.style.width = progress + '%';
    }, 500);

    // Speichere Interval für Cleanup
    window.loadingInterval = interval;
}

function showEmptyState(message) {
    document.getElementById('charts-wrapper').innerHTML = `
        <div class="chart-container">
            <div class="empty-state">
                <div class="empty-state-icon">📊</div>
                <div class="empty-state-title">Keine Charts verfügbar</div>
                <p>${escapeHtml(message)}</p>
                <a href="upload.html" class="btn btn-primary" style="margin-top: 20px;">Neue Analyse starten</a>
            </div>
        </div>
    `;
}

function formatValue(value) {
    if (value === undefined || value === null) return '';
    const num = parseFloat(value);
    if (isNaN(num)) return String(value);
    return num.toLocaleString('de-DE', { maximumFractionDigits: 1 }) + ' T€';
}

// =====================================================
// COMPANY COLORS ANWENDEN
// =====================================================

function applyCompanyColors(config, chartType) {
    if (companyColors.length === 0) return config;

    const newConfig = JSON.parse(JSON.stringify(config));

    switch (chartType) {
        case 'waterfall':
            if (newConfig.colors) {
                newConfig.colors.start = companyColors[0] || newConfig.colors.start;
                newConfig.colors.end = companyColors[0] || newConfig.colors.end;
                newConfig.colors.positive = companyColors[1] || newConfig.colors.positive;
                newConfig.colors.negative = companyColors[2] || newConfig.colors.negative;
                newConfig.colors.compare = companyColors[3] || newConfig.colors.compare;
                newConfig.colors.connector = companyColors[4] || newConfig.colors.connector;
            }
            break;

        case 'bar':
            if (newConfig.periods) {
                newConfig.periods = newConfig.periods.map((p, i) => ({
                    ...p,
                    color: companyColors[i % companyColors.length] || p.color
                }));
            }
            break;

        case 'stacked-bar':
            if (newConfig.segments) {
                newConfig.segments = newConfig.segments.map((s, i) => ({
                    ...s,
                    color: companyColors[i % companyColors.length] || s.color
                }));
            }
            break;
    }

    return newConfig;
}

// =====================================================
// KI-ENTSCHEIDUNGEN (CHAIN OF THOUGHT)
// =====================================================

function collectReasoningData(profile, selectedTemplates, configs, chartType) {
    aiReasoningData = {
        profile: profile,
        selectedTemplates: selectedTemplates || [],
        chartConfigs: configs || [],
        timestamp: new Date().toISOString(),
        chartType: chartType,
        chartCount: (configs || []).length,
        reasoning: generateReasoning(profile, chartType, configs)
    };
}

/**
 * Generiert automatisch Begruendungen basierend auf Daten-Profil und Auswahl
 */
function generateReasoning(profile, chartType, configs) {
    const reasoning = {
        chartTypeReason: '',
        templateReasons: [],
        dataInsights: [],
        mixStrategy: ''
    };

    if (!profile) {
        reasoning.chartTypeReason = 'Demo-Modus: Beispiel-Charts werden angezeigt, da keine Daten analysiert wurden.';
        reasoning.mixStrategy = 'Ausgewogene Verteilung von Waterfall, Bar und Stacked Bar Charts fuer maximale Vielfalt.';
        return reasoning;
    }

    // 1. Begruendung fuer Chart-Typ basierend auf Daten-Profil
    const reportType = profile.report_type || 'financial_report';
    const rowCount = profile.row_count || 0;
    const hasVariance = profile.has_variance_column;
    const hasBudget = profile.has_budget;
    const hasPriorYear = profile.has_prior_year;

    if (chartType === 'waterfall') {
        reasoning.chartTypeReason = `Waterfall gewaehlt: ${
            reportType === 'income_statement'
                ? 'Ideal fuer GuV-Darstellung mit Kostenaufschluesselung vom Umsatz zum Ergebnis.'
                : 'Zeigt Veraenderungen zwischen Ausgangs- und Endwert als Bridge.'
        }`;
    } else if (chartType === 'bar') {
        reasoning.chartTypeReason = `Bar Chart gewaehlt: ${
            hasBudget || hasVariance
                ? 'Optimal fuer Soll/Ist-Vergleiche und Abweichungsanalysen.'
                : 'Klare Darstellung von Kategorien im direkten Vergleich.'
        }`;
    } else if (chartType === 'stacked-bar') {
        reasoning.chartTypeReason = `Stacked Bar gewaehlt: ${
            rowCount > 5
                ? 'Zeigt Zusammensetzung und Anteile bei mehreren Kategorien.'
                : 'Visualisiert Teil-Ganzes-Beziehungen uebersichtlich.'
        }`;
    }

    // 2. Daten-Insights generieren
    if (reportType === 'income_statement') {
        reasoning.dataInsights.push('GuV-Struktur erkannt: Umsatz, Kosten und Ergebniszeilen identifiziert');
    }
    if (hasBudget) {
        reasoning.dataInsights.push('Budget-Werte vorhanden: Plan/Ist-Vergleich moeglich');
    }
    if (hasPriorYear) {
        reasoning.dataInsights.push('Vorjahreswerte erkannt: Jahresvergleich empfohlen');
    }
    if (hasVariance) {
        reasoning.dataInsights.push('Varianz-Spalten gefunden: Abweichungsanalyse sinnvoll');
    }
    if (rowCount >= 10) {
        reasoning.dataInsights.push(`${rowCount} Datenpunkte: Detaillierte Analyse moeglich`);
    } else if (rowCount >= 5) {
        reasoning.dataInsights.push(`${rowCount} Datenpunkte: Kompakte Darstellung empfohlen`);
    }

    // 3. Template-Begruendungen (wenn Templates vorhanden)
    if (configs && configs.length > 0) {
        configs.forEach((config, index) => {
            let reason = '';
            const title = config.title || '';

            if (title.toLowerCase().includes('bridge') || title.toLowerCase().includes('guv')) {
                reason = 'Zeigt Ergebnisherleitung Schritt fuer Schritt';
            } else if (title.toLowerCase().includes('vergleich') || title.toLowerCase().includes('comparison')) {
                reason = 'Ermoeglicht direkten Periodenvergleich';
            } else if (title.toLowerCase().includes('struktur') || title.toLowerCase().includes('kostenstruktur')) {
                reason = 'Visualisiert Kostenverteilung und -anteile';
            } else if (title.toLowerCase().includes('abweichung') || title.toLowerCase().includes('varianz')) {
                reason = 'Hebt Plan-Ist-Differenzen hervor';
            } else if (title.toLowerCase().includes('trend') || title.toLowerCase().includes('entwicklung')) {
                reason = 'Zeigt zeitliche Entwicklung';
            } else if (title.toLowerCase().includes('top') || title.toLowerCase().includes('ranking')) {
                reason = 'Fokussiert auf wichtigste Treiber';
            } else {
                reason = 'Ergaenzende Perspektive auf die Daten';
            }

            reasoning.templateReasons.push({
                title: title,
                reason: reason
            });
        });
    }

    return reasoning;
}

function renderReasoningSection() {
    const section = document.getElementById('ai-reasoning-section');
    const content = document.getElementById('reasoningContent');

    // Immer anzeigen wenn chartConfigs vorhanden sind
    if (aiReasoningData.chartConfigs.length === 0) {
        section.style.display = 'none';
        return;
    }

    section.style.display = 'block';

    let html = '';
    const profile = aiReasoningData.profile || {};
    const reasoning = aiReasoningData.reasoning || {};
    const generationMode = aiReasoningData.generationMode || 'demo';
    const isDemoMode = generationMode === 'demo';

    // Demo-Modus Banner
    if (isDemoMode) {
        const errorMessages = (aiReasoningData.errors || []).map(e => e.error).join(', ');
        html += `
            <div class="demo-warning" style="background: #fef3c7; border: 2px solid #f59e0b; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                <strong style="color: #92400e;">Demo-Modus aktiv</strong><br>
                <span style="color: #78350f;">
                    ${aiReasoningData.apiKeyPresent
                        ? 'KI-Generierung fehlgeschlagen - Beispieldaten werden angezeigt.'
                        : 'Kein API-Key vorhanden - Beispieldaten werden angezeigt.'}
                </span>
                ${errorMessages ? `<br><br><span style="color: #b45309; font-size: 12px;">Fehler: ${errorMessages}</span>` : ''}
            </div>
        `;
    }

    // ① PIPELINE-PERFORMANCE
    html += _renderPipelinePerformance();

    // ② DATENPROFIL
    html += _renderDataProfile(profile);

    // ③ ERKANNTE DATENMUSTER
    html += _renderDataPatterns(reasoning);

    // ④ LAYOUTVARIANTEN & FEATURES
    html += _renderVariantsAndFeatures();

    // ⑤ GELADENE PROMPTS
    html += _renderLoadedPrompts();

    // ⑥ FEHLER
    html += _renderErrors();

    // Timestamp
    if (aiReasoningData.timestamp) {
        html += `<div class="reasoning-timestamp">Generiert: ${new Date(aiReasoningData.timestamp).toLocaleString('de-DE')}</div>`;
    }

    content.innerHTML = html;
}

// --- Helper-Funktionen fuer renderReasoningSection ---

function _renderPipelinePerformance() {
    const callLog = aiReasoningData.callLog || [];

    // Kosten berechnen (Anthropic claude-sonnet-4-20250514 Preise)
    const INPUT_COST = 3.0;    // $/MTok
    const OUTPUT_COST = 15.0;  // $/MTok
    const CACHE_READ_COST = 0.30; // $/MTok

    function calcCost(input, output, cacheRead) {
        return ((input / 1e6) * INPUT_COST) + ((output / 1e6) * OUTPUT_COST) + ((cacheRead / 1e6) * CACHE_READ_COST);
    }

    function formatTokens(n) {
        if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
        return n.toString();
    }

    // PROMPT-1 Stats aus sessionStorage laden (gesetzt in upload.html)
    let prompt1Group = null;
    try {
        const p1Raw = sessionStorage.getItem('prompt1Stats');
        if (p1Raw) {
            const p1 = JSON.parse(p1Raw);
            prompt1Group = {
                label: p1.label || 'PROMPT-1 (Analyse)',
                count: 1,
                totalDuration: p1.duration || 0,
                totalInput: p1.usage?.input_tokens || 0,
                totalOutput: p1.usage?.output_tokens || 0,
                totalCacheRead: p1.usage?.cache_read_input_tokens || 0,
                totalCacheWrite: p1.usage?.cache_creation_input_tokens || 0
            };
        }
    } catch (e) { /* sessionStorage parse error */ }

    // PROMPT-2 Calls aus dem aktuellen callLog
    const prompt2Calls = callLog.filter(c => c.label.startsWith('PROMPT-2'));

    function aggregateGroup(calls, label) {
        if (calls.length === 0) return null;
        const totalDuration = calls.reduce((s, c) => s + (c.duration || 0), 0);
        const totalInput = calls.reduce((s, c) => s + (c.usage?.input_tokens || 0), 0);
        const totalOutput = calls.reduce((s, c) => s + (c.usage?.output_tokens || 0), 0);
        const totalCacheRead = calls.reduce((s, c) => s + (c.usage?.cache_read_input_tokens || 0), 0);
        const totalCacheWrite = calls.reduce((s, c) => s + (c.usage?.cache_creation_input_tokens || 0), 0);
        return { label, count: calls.length, totalDuration, totalInput, totalOutput, totalCacheRead, totalCacheWrite };
    }

    const groups = [
        prompt1Group,
        aggregateGroup(prompt2Calls, 'PROMPT-2 (Varianten)')
    ].filter(Boolean);

    if (groups.length === 0) return '';

    const totalInput = groups.reduce((s, g) => s + g.totalInput, 0);
    const totalOutput = groups.reduce((s, g) => s + g.totalOutput, 0);
    const totalCacheRead = groups.reduce((s, g) => s + g.totalCacheRead, 0);
    const totalDuration = groups.reduce((s, g) => s + g.totalDuration, 0);
    const totalCost = calcCost(totalInput, totalOutput, totalCacheRead);
    const cacheSavings = ((totalCacheRead / 1e6) * (INPUT_COST - CACHE_READ_COST));
    const totalCalls = (prompt1Group ? 1 : 0) + prompt2Calls.length;

    let tableRows = groups.map(g => {
        const cost = calcCost(g.totalInput, g.totalOutput, g.totalCacheRead);
        const countLabel = g.count > 1 ? ` (x${g.count})` : '';
        const cacheInfo = g.totalCacheRead > 0
            ? `<span class="pipeline-cache-hit">${formatTokens(g.totalCacheRead)} Cache</span>`
            : (g.totalCacheWrite > 0 ? `<span class="pipeline-cache-write">${formatTokens(g.totalCacheWrite)} Write</span>` : '-');
        return `<tr>
            <td>${g.label}${countLabel}</td>
            <td class="token-count">${formatTokens(g.totalInput)}</td>
            <td class="token-count">${formatTokens(g.totalOutput)}</td>
            <td>${cacheInfo}</td>
            <td>$${cost.toFixed(3)}</td>
            <td>${g.totalDuration.toFixed(1)}s</td>
        </tr>`;
    }).join('');

    // Gesamt-Zeile
    tableRows += `<tr class="pipeline-total">
        <td>GESAMT (${totalCalls} Calls)</td>
        <td class="token-count">${formatTokens(totalInput)}</td>
        <td class="token-count">${formatTokens(totalOutput)}</td>
        <td>${totalCacheRead > 0 ? `<span class="pipeline-cache-hit">-$${cacheSavings.toFixed(3)} gespart</span>` : '-'}</td>
        <td>$${totalCost.toFixed(3)}</td>
        <td>${totalDuration.toFixed(1)}s</td>
    </tr>`;

    return `
        <div class="reasoning-section" style="background: #f8fafc; border-left: 3px solid #3b82f6;">
            <div class="reasoning-section-title" style="color: #1d4ed8;">Pipeline-Performance</div>
            <table class="pipeline-table">
                <thead>
                    <tr>
                        <th>Schritt</th>
                        <th>Input</th>
                        <th>Output</th>
                        <th>Cache</th>
                        <th>Kosten</th>
                        <th>Dauer</th>
                    </tr>
                </thead>
                <tbody>${tableRows}</tbody>
            </table>
        </div>
    `;
}

function _renderDataProfile(profile) {
    const positionLabels = profile.position_labels || [];
    const periodLabels = profile.period_labels || [];
    const dataFrequency = profile.data_frequency || '';
    const isCumulative = profile.is_cumulative || '';

    const positionsDisplay = positionLabels.length > 0
        ? (positionLabels.length <= 5
            ? positionLabels.join(', ')
            : positionLabels.slice(0, 5).join(', ') + ` ... (+${positionLabels.length - 5})`)
        : '-';
    const periodsDisplay = periodLabels.length > 0 ? periodLabels.join(', ') : '-';
    const dataTypeInfo = [dataFrequency, isCumulative].filter(Boolean).join(', ');

    return `
        <div class="reasoning-section">
            <div class="reasoning-section-title">Datenprofil</div>
            <div class="reasoning-item">
                <span class="reasoning-label">Report-Typ:</span>
                <span class="reasoning-value">${profile.report_type || 'Demo-Daten'}${dataTypeInfo ? ` <span style="color: #6b7280;">(${dataTypeInfo})</span>` : ''}</span>
            </div>
            <div class="reasoning-item">
                <span class="reasoning-label">Positionen (${positionLabels.length || profile.row_count || '-'}):</span>
                <span class="reasoning-value">${positionsDisplay}</span>
            </div>
            <div class="reasoning-item">
                <span class="reasoning-label">Perioden (${periodLabels.length || profile.period_count || '-'}):</span>
                <span class="reasoning-value">${periodsDisplay}</span>
            </div>
            <div class="reasoning-item">
                <span class="reasoning-label">Wertarten:</span>
                <span class="reasoning-value">${(profile.available_value_types || []).join(', ') || 'IST'}</span>
            </div>
        </div>
    `;
}

function _renderDataPatterns(reasoning) {
    if (!reasoning.dataInsights || reasoning.dataInsights.length === 0) return '';
    return `
        <div class="reasoning-section">
            <div class="reasoning-section-title">Erkannte Datenmuster</div>
            ${reasoning.dataInsights.map((insight, i) => `
                <div class="reasoning-item">
                    <span class="reasoning-label">Muster ${i + 1}:</span>
                    <span class="reasoning-value">${insight}</span>
                </div>
            `).join('')}
        </div>
    `;
}

function _renderVariantsAndFeatures() {
    const variants = aiReasoningData.variants || [];
    const chartConfigs = aiReasoningData.chartConfigs || [];

    // Wenn keine Varianten-Daten, zeige Configs als Fallback (Demo-Modus)
    if (variants.length === 0 && chartConfigs.length === 0) return '';

    // Feature-ID zu lesbarem Namen
    const featureNames = {
        bracket: 'Bracket',
        scaleBreak: 'Scale-Break',
        categoryBrackets: 'Category-Brackets',
        arrows: 'Arrows',
        benchmarkLines: 'Benchmark',
        grouping: 'Grouping',
        negativeBridges: 'Neg. Bridges'
    };

    function renderFeatureTag(featureId, featureConfig) {
        const name = featureNames[featureId] || featureId;
        if (!featureConfig || !featureConfig.enabled) {
            return `<span class="feature-tag feature-tag-disabled" title="${featureConfig?._reason || 'Deaktiviert'}">${name}</span>`;
        }
        // Detail-Info aus Config extrahieren
        let detail = '';
        if (featureId === 'bracket' && featureConfig.label) detail = ': ' + featureConfig.label;
        else if (featureId === 'bracket' && featureConfig.mode) detail = ' (' + featureConfig.mode + ')';
        else if (featureId === 'grouping' && featureConfig.groups) detail = ': ' + featureConfig.groups.length + ' Gruppen';
        else if (featureId === 'categoryBrackets' && featureConfig.items) detail = ': ' + featureConfig.items.length;
        else if (featureId === 'benchmarkLines' && featureConfig.lines) detail = ': ' + featureConfig.lines.length + ' Linien';
        else if (featureId === 'scaleBreak' && featureConfig.breakAt) detail = ' (' + featureConfig.breakAt + ')';

        return `<span class="feature-tag feature-tag-active" title="${featureConfig._reason || ''}">${name}${detail}</span>`;
    }

    let html = '';
    const usedCount = variants.filter(v => !v.wasDeduped).length || chartConfigs.length;
    const dedupedCount = variants.filter(v => v.wasDeduped).length || 0;

    html += `<div class="reasoning-section">`;
    html += `<div class="reasoning-section-title">Layoutvarianten & Features (${usedCount} generiert${dedupedCount > 0 ? `, ${dedupedCount} Duplikate` : ''})</div>`;

    if (variants.length > 0) {
        // Varianten mit Feature-Details
        variants.forEach((v, i) => {
            const cardClass = v.wasDeduped ? 'variant-card variant-deduped' : 'variant-card variant-used';
            const statusIcon = v.wasDeduped ? '○' : '&#10003;';
            const statusColor = v.wasDeduped ? '#9ca3af' : '#15803d';

            html += `<div class="${cardClass}">`;
            html += `<div class="variant-card-header">`;
            html += `<span class="variant-card-title"><span style="color: ${statusColor}; margin-right: 4px;">${statusIcon}</span>${i + 1}. ${v.title || 'Ohne Titel'}</span>`;
            html += `<span class="variant-card-template">${v.templateId || ''}</span>`;
            html += `</div>`;

            if (v.perspective) {
                html += `<div class="variant-card-perspective">Perspektive: ${v.perspective}</div>`;
            }

            // Feature-Tags
            const features = v.features || {};
            const featureKeys = Object.keys(features);
            if (featureKeys.length > 0) {
                html += `<div class="feature-tags">`;
                // Aktive Features zuerst, dann deaktivierte
                const activeFeatures = featureKeys.filter(k => features[k]?.enabled);
                const disabledFeatures = featureKeys.filter(k => !features[k]?.enabled);
                activeFeatures.forEach(k => { html += renderFeatureTag(k, features[k]); });
                disabledFeatures.forEach(k => { html += renderFeatureTag(k, features[k]); });
                html += `</div>`;

                // Reasons fuer aktive Features
                const reasons = activeFeatures
                    .filter(k => features[k]?._reason)
                    .map(k => `${featureNames[k] || k}: ${features[k]._reason}`);
                if (reasons.length > 0) {
                    html += `<div class="feature-reason">${reasons.join(' | ')}</div>`;
                }
            }

            if (v.wasDeduped) {
                html += `<div style="font-size: 11px; color: #9ca3af; margin-top: 4px;">Duplikat - nicht generiert</div>`;
            }

            html += `</div>`;
        });
    } else {
        // Fallback: Nur Configs anzeigen (Demo-Modus)
        chartConfigs.forEach((c, i) => {
            const cleanTitle = (c.title || 'Ohne Titel').replace(/Beispiel/g, 'Chart');
            html += `<div class="variant-card variant-used">`;
            html += `<div class="variant-card-header">`;
            html += `<span class="variant-card-title">${i + 1}. ${cleanTitle}</span>`;
            html += `<span class="variant-card-template">${c._layoutId || ''}</span>`;
            html += `</div></div>`;
        });
    }

    html += `</div>`;
    return html;
}

function _renderLoadedPrompts() {
    if (!PromptLoader.loadedPrompts || PromptLoader.loadedPrompts.length === 0) return '';

    const totalTokens = PromptLoader.loadedPrompts.reduce((sum, p) => sum + p.tokens, 0);
    const totalSize = PromptLoader.loadedPrompts.reduce((sum, p) => sum + p.size, 0);
    const totalRawSize = PromptLoader.loadedPrompts.reduce((sum, p) => sum + (p.rawSize || p.size), 0);
    const reduction = totalRawSize > totalSize ? Math.round((1 - totalSize/totalRawSize) * 100) : 0;

    return `
        <div class="reasoning-section" style="background: #f0fdf4; border-left: 3px solid #22c55e;">
            <div class="reasoning-section-title" style="color: #15803d;">
                Geladene Prompts (${PromptLoader.loadedPrompts.length})
            </div>
            ${PromptLoader.loadedPrompts.map(p => {
                const wasExtracted = p.rawSize && p.rawSize !== p.size;
                const reductionPct = wasExtracted ? Math.round((1 - p.size/p.rawSize) * 100) : 0;
                return `
                <div class="reasoning-item">
                    <span class="reasoning-label">${p.name}:</span>
                    <span class="reasoning-value">
                        ${p.file}
                        <span style="color: #6b7280; font-size: 11px;">
                            (${(p.size / 1024).toFixed(1)} KB, ~${p.tokens.toLocaleString('de-DE')} Tokens${wasExtracted ? `, -${reductionPct}%` : ''})
                        </span>
                    </span>
                </div>
            `}).join('')}
            <div class="reasoning-item" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #d1fae5;">
                <span class="reasoning-label">Gesamt:</span>
                <span class="reasoning-value" style="font-weight: 600; color: ${totalTokens > 20000 ? '#dc2626' : '#15803d'};">
                    ${(totalSize / 1024).toFixed(1)} KB, ~${totalTokens.toLocaleString('de-DE')} Tokens
                    ${reduction > 0 ? ` (${reduction}% reduziert durch Extraktion)` : ''}
                    ${totalTokens > 20000 ? ' Ueberschreitet Rate-Limit!' : ''}
                </span>
            </div>
        </div>
    `;
}

function _renderErrors() {
    if (!aiReasoningData.errors || aiReasoningData.errors.length === 0) return '';
    return `
        <div class="reasoning-section" style="background: #fef2f2; border-left: 3px solid #ef4444;">
            <div class="reasoning-section-title" style="color: #dc2626;">Fehler bei KI-Generierung</div>
            ${aiReasoningData.errors.map(err => `
                <div class="reasoning-item">
                    <span class="reasoning-label">${err.phase}${err.template ? ' (' + err.template + ')' : ''}:</span>
                    <span class="reasoning-value" style="color: #dc2626;">${err.error}</span>
                </div>
            `).join('')}
        </div>
    `;
}

// =====================================================
// HILFSFUNKTIONEN (von allen Renderern verwendet)
// =====================================================

function getContrastColor(hexColor) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#333333' : '#FFFFFF';
}

function setupTooltip(svgId) {
    const svg = document.getElementById(svgId);
    const tooltip = document.getElementById('tooltip');

    svg.querySelectorAll('.bar, .stacked-bar, .data-point').forEach(el => {
        el.addEventListener('mouseenter', (e) => {
            const label = e.target.dataset.label || e.target.dataset.segmentName || e.target.dataset.series || '';
            const value = e.target.dataset.value || '';
            tooltip.textContent = `${label}: ${value}`;
            tooltip.classList.add('visible');
        });

        el.addEventListener('mousemove', (e) => {
            tooltip.style.left = (e.clientX + 15) + 'px';
            tooltip.style.top = (e.clientY - 10) + 'px';
        });

        el.addEventListener('mouseleave', () => {
            tooltip.classList.remove('visible');
        });
    });
}
