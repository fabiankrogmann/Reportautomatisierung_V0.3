// =====================================================
// INITIALISIERUNG
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('de-DE');
    initializeCharts();
});

async function initializeCharts() {
    try {
        // HINWEIS: Prompts werden NICHT mehr vorab geladen
        // Stattdessen wird nur der benötigte Chart-Prompt später geladen
        // Das spart ~20.000 Tokens pro Generierung!

        // Lade Analyse-Ergebnis
        const resultRaw = sessionStorage.getItem('analysisResult');
        if (!resultRaw) {
            showEmptyState('Keine Analyseergebnisse gefunden. Bitte starte eine neue Analyse.');
            return;
        }

        analysisResult = JSON.parse(resultRaw);

        // Parse das result wenn es ein String ist
        if (typeof analysisResult.result === 'string') {
            analysisResult.parsed = JSON.parse(analysisResult.result);
        } else {
            analysisResult.parsed = analysisResult.result;
        }

        // Lade Company Colors
        const colorsRaw = sessionStorage.getItem('companyColors');
        if (colorsRaw) {
            companyColors = JSON.parse(colorsRaw);
        }

        // Chart-Anzahl: ALLE Templates des gewählten Typs generieren
        // (Slider wurde in Phase 1 entfernt - keine User-Auswahl mehr)
        // chartCount bleibt auf 12 (Maximum aus templates.json)
        console.log('Chart-Anzahl: Generiere alle Templates des Typs (max', chartCount, ')');

        // Ermittle Chart-Typ
        console.log('=== CHART-TYP DEBUG (charts.html) ===');
        console.log('Gesamtes analysisResult.parsed.recommendation:', JSON.stringify(analysisResult.parsed.recommendation, null, 2));
        console.log('selectedChart:', analysisResult.parsed.recommendation?.selectedChart);
        console.log('primaryChart:', analysisResult.parsed.recommendation?.primaryChart);
        console.log('_userSelectedChart:', analysisResult.parsed.recommendation?._userSelectedChart);

        // chartType kommt aus User-Auswahl in results.html (selectedChart)
        // Fallback auf primaryChart (KI-Empfehlung) wenn nichts gewählt
        let chartType;
        if (analysisResult.parsed.recommendation?.selectedChart) {
            chartType = analysisResult.parsed.recommendation.selectedChart;
            console.log('chartType aus selectedChart:', chartType);
        } else if (analysisResult.parsed.recommendation?.primaryChart) {
            chartType = analysisResult.parsed.recommendation.primaryChart;
            console.log('chartType aus primaryChart (KI-Empfehlung):', chartType);
        } else {
            chartType = 'waterfall';
            console.log('chartType auf waterfall gesetzt (Default)');
        }
        console.log('Finaler chartType:', chartType);
        console.log('=== END DEBUG (charts.html) ===')

        // Setze Seitentitel
        const typeLabels = {
            'waterfall': 'Waterfall Charts',
            'bar': 'Bar Charts',
            'stacked-bar': 'Stacked Bar Charts',
            'stacked_bar': 'Stacked Bar Charts'  // Alternative Schreibweise
        };
        // Normalisiere chartType für Titel
        const displayChartType = chartType === 'stacked_bar' ? 'stacked-bar' : chartType;
        console.log('displayChartType für Titel:', displayChartType);
        document.getElementById('page-title').textContent =
            `${typeLabels[displayChartType] || 'Charts'} - Think-Cell Stil`;
        document.getElementById('page-subtitle').textContent =
            `Basierend auf: ${analysisResult.displayName || analysisResult.fileName}`;

        // API-Key für Chart-Generierung (2. API-Call)
        const apiKey = sessionStorage.getItem('apiKey');
        const provider = sessionStorage.getItem('apiProvider') || 'anthropic';

        // Erstelle Daten-Profil (immer, auch ohne API-Key)
        console.log('Erstelle Daten-Profil...');
        const profile = DataProfiler.profile(analysisResult);
        console.log('Daten-Profil:', profile);
        aiReasoningData.profile = profile;

        // =====================================================
        // CHART-GENERIERUNG: Nur KI oder Demo-Modus
        // =====================================================

        // Track API-Key Status
        aiReasoningData.apiKeyPresent = !!apiKey;

        console.log('API-Key Status:', apiKey ? 'vorhanden (***' + apiKey.slice(-4) + ')' : 'NICHT vorhanden');
        console.log('Provider:', provider);

        if (apiKey) {
            // =====================================================
            // KI-MODUS: Pipeline (PROMPT-2 → DeterministicConfig → JS-Renderer)
            // =====================================================
            try {
                console.log('=== STARTE KI-GENERIERUNG (Neue Pipeline) ===');
                showLoadingState();
                aiReasoningData.generationMode = 'deterministic';

                // Initialisiere API Client
                APIClient.init(apiKey, provider);
                console.log('APIClient initialisiert');

                // Lade Template-Bibliothek
                console.log('1/4: Lade Template-Bibliothek...');
                await TemplateLoader.load();
                console.log('1/4: Template-Bibliothek geladen');

                // Lade benötigte Prompts (nur variant_generator — config_generator und chart-prompt entfernt)
                console.log('2/4: Lade Prompts...');
                const variantPrompt = await PromptLoader.load('variant_generator');
                console.log('2/4: Prompt geladen (variant_generator)');

                // Verfügbare Templates für diesen Typ laden
                const allowedTypes = [chartType.replace('-', '_')];
                const allTemplates = TemplateLoader.getAll();
                const availableTemplates = ChartMixer.selectTemplates(profile, allTemplates, chartCount, allowedTypes);
                console.log(`Verfügbare Templates für ${chartType}: ${availableTemplates.length}`);

                // =====================================================
                // SCHRITT 1: PROMPT-2 (Variant Generator) → Varianten
                // =====================================================
                console.log('3/4: PROMPT-2 - Generiere Varianten...');
                const extractedData = analysisResult.parsed.extractedData || {};
                const detectedLanguage = analysisResult.detectedLanguage || 'unknown';

                const variantUserPrompt = `## Chart-Typ
${chartType.replace('-', '_')}

## Analyse-Ergebnis (von PROMPT-1)
${JSON.stringify(analysisResult.parsed, null, 2)}

## Verfügbare Templates
${JSON.stringify(availableTemplates.map(t => ({
    template_id: t.template_id,
    name: t.name,
    display_name: t.display_name,
    chart_type: t.chart_type,
    description: t.description || '',
    metadata: t.metadata || {}
})), null, 2)}

## Erkannte Sprache
${detectedLanguage}

Generiere 3-10 unterschiedliche Varianten für diese Daten.
Antworte NUR mit einem validen JSON-Objekt im Format { "variants": [...] }.`;

                let variants = [];
                try {
                    const variantResponse = await APIClient.call(variantPrompt, variantUserPrompt, { maxTokens: 8192, label: 'PROMPT-2 (Variant Generator)' });
                    const variantResult = APIClient.parseJSON(variantResponse);

                    if (variantResult && Array.isArray(variantResult.variants) && variantResult.variants.length > 0) {
                        variants = variantResult.variants;
                        console.log(`PROMPT-2: ${variants.length} Varianten generiert:`, variants.map(v => v.title || v.templateId));
                    } else {
                        console.warn('PROMPT-2: Keine Varianten im Output, verwende Fallback');
                    }
                } catch (variantError) {
                    console.warn('PROMPT-2 fehlgeschlagen:', variantError.message);
                    aiReasoningData.errors = aiReasoningData.errors || [];
                    aiReasoningData.errors.push({
                        phase: 'variant-generation',
                        error: variantError.message,
                        timestamp: new Date().toISOString()
                    });
                }

                // Fallback: Wenn keine Varianten generiert wurden, erstelle eine pro Template
                if (variants.length === 0) {
                    console.log('Fallback: Erstelle eine Variante pro verfügbarem Template');
                    variants = availableTemplates.map(t => ({
                        templateId: t.template_id,
                        title: t.display_name || t.name,
                        perspective: null,
                        dataFilter: null
                    }));
                }

                // Befülle aiReasoningData für UI (Templates aus Varianten)
                aiReasoningData.selectedTemplates = variants.map(v => {
                    const tmpl = availableTemplates.find(t => t.template_id === v.templateId);
                    return tmpl || { template_id: v.templateId, name: v.title, chart_type: chartType };
                });

                // =====================================================
                // SCHRITT 2: Pro Variante: Deterministische Config → JS-Renderer
                // =====================================================
                console.log('4/4: Deterministische Config-Generierung...');
                chartConfigs = [];
                const usedFingerprints = new Set();
                let duplicatesSkipped = 0;

                // Fingerprint-Funktion für Duplikat-Erkennung

                for (const variant of variants) {
                    try {
                        console.log(`--- Variante: "${variant.title}" (Template: ${variant.templateId}) ---`);

                        // SCHRITT A: Deterministische Config-Generierung (ersetzt PROMPT-3)
                        const chartConfig = DeterministicConfigGenerator.generateConfig(
                            variant,
                            analysisResult,
                            companyColors,
                            detectedLanguage
                        );

                        // SCHRITT B: Fingerprint + Dedup
                        const fp = generateConfigFingerprint(chartConfig, chartType.replace('-', '_'));
                        const wasDeduped = usedFingerprints.has(fp);

                        // Variante + Features tracken
                        aiReasoningData.variants.push({
                            title: variant.title,
                            templateId: variant.templateId,
                            perspective: variant.perspective || null,
                            features: chartConfig.features || {},
                            wasDeduped: wasDeduped,
                            fingerprint: fp
                        });

                        if (wasDeduped) {
                            duplicatesSkipped++;
                            console.log(`Duplikat erkannt: "${variant.title}" (Fingerprint: ${fp})`);
                            continue;
                        }

                        // Config normalisieren für JS-Renderer
                        const normalizedConfig = normalizeConfigForRenderer(chartConfig);

                        usedFingerprints.add(fp);
                        chartConfigs.push(normalizedConfig);
                        console.log(`Config hinzugefuegt: "${variant.title}" (Fingerprint: ${fp})`);
                    } catch (err) {
                        console.warn(`Fehler bei Variante "${variant.title}":`, err.message);
                        aiReasoningData.errors = aiReasoningData.errors || [];
                        aiReasoningData.errors.push({
                            phase: 'config-generation',
                            template: variant.templateId,
                            variant: variant.title,
                            error: err.message,
                            timestamp: new Date().toISOString()
                        });
                    }
                }

                console.log(`=== KI-GENERIERUNG ABGESCHLOSSEN: ${chartConfigs.length} Charts (${duplicatesSkipped} Duplikate übersprungen) ===`);

                // Befülle restliche aiReasoningData für UI
                aiReasoningData.duplicatesSkipped = duplicatesSkipped;
                aiReasoningData.uniqueChartsGenerated = chartConfigs.length;
                aiReasoningData.requestedChartCount = variants.length;
                aiReasoningData.callLog = APIClient.getCallLog();

                if (chartConfigs.length < variants.length) {
                    const reason = duplicatesSkipped > 0
                        ? `${duplicatesSkipped} Duplikate wurden übersprungen.`
                        : 'Nicht alle Varianten konnten generiert werden.';
                    aiReasoningData.chartCountNote = reason;
                }

                // Wenn keine Charts generiert → Demo-Modus
                if (chartConfigs.length === 0) {
                    const errors = (aiReasoningData.errors || [])
                        .filter(e => e.phase === 'config-generation')
                        .map(e => `${e.template}: ${e.error}`)
                        .join('; ');
                    throw new Error(errors
                        ? `KI konnte keine Charts generieren: ${errors}`
                        : 'KI konnte keine Charts generieren');
                }

            } catch (error) {
                // BEI JEDEM FEHLER: Wechsel zu Demo-Modus
                console.error('KI-Generierung fehlgeschlagen:', error);
                aiReasoningData.generationMode = 'demo';
                aiReasoningData.errors = aiReasoningData.errors || [];
                aiReasoningData.errors.push({
                    phase: 'ai-generation',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });

                showEmptyState('Fehler bei der Chart-Generierung: ' + error.message);
                return;
            }
        } else {
            // Kein API-Key: Fehlermeldung anzeigen
            showEmptyState('Kein API-Key vorhanden. Bitte geben Sie einen API-Key in upload.html ein.');
            return;
        }

        renderAllCharts();

        // Sammle finale KI-Entscheidungsdaten für Chain-of-Thought Anzeige
        // Sammle finale Daten für Chain-of-Thought Anzeige
        const finalChartType = chartType;
        aiReasoningData.chartConfigs = chartConfigs;
        aiReasoningData.chartType = finalChartType;
        aiReasoningData.chartCount = chartConfigs.length;
        aiReasoningData.timestamp = new Date().toISOString();
        aiReasoningData.reasoning = generateReasoning(profile, finalChartType, chartConfigs);

        renderReasoningSection();

        // Falls immer noch nichts gerendert wurde
        if (chartConfigs.length === 0) {
            showEmptyState('Es konnten keine Charts generiert werden. Bitte versuche es erneut.');
        }

    } catch (error) {
        console.error('Error loading data:', error);
        showEmptyState('Fehler beim Laden der Daten: ' + error.message);
    }
}

// =====================================================
// RENDERING
// =====================================================

function renderAllCharts() {
    const wrapper = document.getElementById('charts-wrapper');
    const selectedChartType = analysisResult?.parsed?.recommendation?.selectedChart ||
                      analysisResult?.parsed?.recommendation?.primaryChart || 'waterfall';

    // Alle Charts rendern (kein Limit mehr)
    let configsToRender = [...chartConfigs];

    // Hilfsfunktion: Bestimme den Chart-Typ einer Config
    function detectChartType(config) {
        // Prüfe ob ein expliziter Typ gesetzt wurde (z.B. durch KI-Generierung)
        if (config._chartType) {
            // Normalisiere den Typ (stacked_bar -> stacked-bar)
            return config._chartType.replace('_', '-');
        }
        if (config.chartType) return config.chartType;

        // Ansonsten anhand der Struktur erkennen
        if (config.bars && Array.isArray(config.bars)) return 'waterfall';
        if (config.periods && Array.isArray(config.periods)) return 'bar';
        if (config.categories && Array.isArray(config.categories)) return 'stacked-bar';

        console.warn('detectChartType: Konnte Typ nicht erkennen, verwende waterfall als Fallback', config);
        return 'waterfall'; // Fallback
    }

    // Validiere Configs - entferne ungültige
    configsToRender = configsToRender.filter(config => {
        if (!config) return false;

        const configType = detectChartType(config);
        console.log(`=== VALIDIERE CONFIG ===`);
        console.log(`Typ: ${configType}, Titel: "${config.title || 'KEIN TITEL'}"`);
        console.log(`Vorhande Felder:`, Object.keys(config));

        if (configType === 'waterfall') {
            if (!config.bars || !Array.isArray(config.bars) || config.bars.length === 0) {
                console.warn('❌ Ungültige Waterfall-Config (keine bars):', config);
                return false;
            }
            console.log(`✅ Waterfall-Config gültig: ${config.bars.length} bars`);
        }

        if (configType === 'bar') {
            // Bar-Charts brauchen BEIDE: periods UND categories mit values
            const hasPeriods = config.periods && Array.isArray(config.periods) && config.periods.length > 0;
            const hasCategories = config.categories && Array.isArray(config.categories) && config.categories.length > 0;
            const hasValues = hasCategories && config.categories.every(c => c.values && Array.isArray(c.values) && c.values.length > 0);

            console.log(`Bar-Config Check: periods=${hasPeriods}, categories=${hasCategories}, values=${hasValues}`);

            if (!hasPeriods || !hasCategories) {
                console.warn('❌ Ungültige Bar-Config:');
                console.warn('  - periods:', config.periods);
                console.warn('  - categories:', config.categories);
                return false;
            }
            if (!hasValues) {
                console.warn('❌ Bar-Config categories ohne values Array!');
                return false;
            }
            console.log(`✅ Bar-Config gültig: ${config.periods.length} periods, ${config.categories.length} categories`);
        }

        if (configType === 'stacked-bar') {
            // Stacked-Bar braucht categories UND segments mit values
            const hasCategories = config.categories && Array.isArray(config.categories) && config.categories.length > 0;
            const hasSegments = config.segments && Array.isArray(config.segments) && config.segments.length > 0;
            const hasValues = hasSegments && config.segments.every(s => s.values && Array.isArray(s.values) && s.values.length > 0);

            console.log(`Stacked-Bar Check: categories=${hasCategories}, segments=${hasSegments}, values=${hasValues}`);

            if (!hasCategories || !hasSegments) {
                console.warn('❌ Ungültige Stacked-Bar-Config:');
                console.warn('  - categories:', config.categories);
                console.warn('  - segments:', config.segments);
                return false;
            }
            if (!hasValues) {
                console.warn('❌ Stacked-Bar segments ohne values Array!');
                return false;
            }
            console.log(`✅ Stacked-Bar gültig: ${config.categories.length} categories, ${config.segments.length} segments`);
        }

        console.log(`=== END VALIDIERE ===`);
        return true;
    });

    // Falls nach Validierung keine Configs übrig: Fehlermeldung
    if (configsToRender.length === 0) {
        console.error('Keine gültigen Configs nach Validierung');
        showEmptyState('Keine gültigen Chart-Konfigurationen konnten generiert werden. Bitte versuchen Sie es erneut.');
        return;
    }

    // Initialisiere selectedChartsForExport mit allen Charts (standardmäßig ausgewählt)
    selectedChartsForExport.clear();
    configsToRender.forEach((_, index) => selectedChartsForExport.add(index));

    // Zeige Selection-Bar und Export-Buttons
    const selectionBar = document.getElementById('selectionBar');
    if (selectionBar) {
        selectionBar.style.display = 'flex';
        document.getElementById('totalCharts').textContent = configsToRender.length;
        updateSelectionCount();
    }
    const exportButtons = document.getElementById('exportButtons');
    if (exportButtons) {
        exportButtons.style.display = 'flex';
    }

    wrapper.innerHTML = configsToRender.map((config, index) => `
        <div class="chart-wrapper">
            <div class="chart-select-row">
                <input type="checkbox" id="chartSelect${index}" ${selectedChartsForExport.has(index) ? 'checked' : ''} onchange="toggleChartSelection(${index})">
                <label for="chartSelect${index}">Für Export auswählen</label>
            </div>
            <div class="chart-container ${selectedChartsForExport.has(index) ? 'selected' : ''}" id="chartContainer${index}">
                <div class="chart-header">
                    <div class="chart-info">
                        <div class="chart-title">${config.title || `Beispiel ${index + 1}`}</div>
                        <div class="chart-subtitle">${config.subtitle || ''}</div>
                    </div>
                    <div class="chart-actions">
                        <button class="btn-download btn-pptx" onclick="downloadPPTX(${index})" title="PowerPoint Export">PPTX</button>
                        <button class="btn-download" onclick="downloadPNGHD(${index})" title="PNG in 4K Auflösung">PNG HD</button>
                        <button class="btn-download" onclick="downloadSVG(${index})" title="Vektor-Grafik">SVG</button>
                        <button class="btn-download" onclick="downloadPNG(${index})" title="Standard PNG">PNG</button>
                        <button class="btn-download" onclick="downloadHTML(${index})" title="Standalone HTML">HTML</button>
                    </div>
                </div>
                <svg id="chart${index}" viewBox="0 0 1200 500"></svg>
            </div>
        </div>
    `).join('');

    // Rendere jeden Chart via JS-Rendering-Engine
    configsToRender.forEach((config, index) => {
        const svgElement = document.getElementById(`chart${index}`);
        if (!svgElement) return;

        // Typ pro Config erkennen (nicht global, da Configs unterschiedliche Typen haben können)
        const chartType = detectChartType(config);
        switch (chartType) {
            case 'waterfall':
                renderWaterfallChart(`chart${index}`, config);
                break;
            case 'bar':
                renderBarChart(`chart${index}`, config);
                break;
            case 'stacked-bar':
                renderStackedBarChart(`chart${index}`, config);
                break;
            default:
                renderWaterfallChart(`chart${index}`, config);
        }
        console.log(`Chart ${index}: ${chartType} JS-Rendering (${config._generatedBy || 'deterministic'})`);
    });
}

// Chart-Auswahl Funktionen
function toggleChartSelection(index) {
    if (selectedChartsForExport.has(index)) {
        selectedChartsForExport.delete(index);
    } else {
        selectedChartsForExport.add(index);
    }
    updateChartContainerStyle(index);
    updateSelectionCount();
}

function updateChartContainerStyle(index) {
    const container = document.getElementById(`chartContainer${index}`);
    if (container) {
        if (selectedChartsForExport.has(index)) {
            container.classList.add('selected');
        } else {
            container.classList.remove('selected');
        }
    }
}

function updateSelectionCount() {
    const countElement = document.getElementById('selectionCount');
    if (countElement) {
        countElement.textContent = selectedChartsForExport.size;
    }
}

function toggleAllCharts() {
    const checkboxes = document.querySelectorAll('[id^="chartSelect"]');
    checkboxes.forEach((cb, index) => {
        selectedChartsForExport.add(index);
        cb.checked = true;
        updateChartContainerStyle(index);
    });
    updateSelectionCount();
}

function deselectAllCharts() {
    const checkboxes = document.querySelectorAll('[id^="chartSelect"]');
    checkboxes.forEach((cb, index) => {
        selectedChartsForExport.delete(index);
        cb.checked = false;
        updateChartContainerStyle(index);
    });
    updateSelectionCount();
}
