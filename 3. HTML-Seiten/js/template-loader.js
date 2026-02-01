// =====================================================
// GLOBALE VARIABLEN
// =====================================================

let analysisResult = null;
let companyColors = [];
let chartConfigs = [];
let renderedCharts = {}; // Speichert SVG-Inhalte für Export
let chartCount = 12; // Generiere alle Templates des gewählten Typs (max 12)
let selectedChartsForExport = new Set(); // Tracks which charts are selected for export

// KI-Entscheidungsdaten für Chain-of-Thought Anzeige
let aiReasoningData = {
    profile: null,
    selectedTemplates: [],
    chartConfigs: [],
    timestamp: null,
    chartType: null,
    chartCount: 0,
    generationMode: 'deterministic', // Einziger Modus: 'deterministic'
    errors: [], // Fehler die waehrend der Generierung auftreten
    apiKeyPresent: false,
    loadedPrompts: [], // Welche Prompts wurden geladen (Name, Größe, Quelle)
    reasoning: {
        chartTypeReason: '',
        templateReasons: [],
        dataInsights: [],
        mixStrategy: ''
    },
    variants: [],   // Varianten von PROMPT-2
    callLog: []     // API-Call-Log (Timing, Tokens, Kosten)
};

// Default-Farben wenn keine Company Colors definiert
const DEFAULT_COLORS = {
    waterfall: {
        start: '#1B4F72',
        end: '#1B4F72',
        positive: '#27AE60',
        negative: '#E74C3C',
        compare: '#7F8C8D',
        connector: '#333333'
    },
    bar: ['#CCCCCC', '#999999', '#666666', '#0066B1'],
    stacked: ['#1E3A5F', '#2E5A88', '#5B8DBE', '#8BBDE0', '#B8D4E8', '#D9E8F0']
};

// =====================================================
// LAYOUT-RANKING-SYSTEM (NEU)
// Verwendet vordefinierte Layouts + API-basiertes Ranking
// =====================================================

// Layout-Kataloge werden beim Start geladen
const LAYOUT_CATALOGS = {
    waterfall: null,
    bar: null,
    'stacked-bar': null
};

// Flag ob das neue Ranking-System verwendet werden soll
const USE_LAYOUT_RANKING = true;

// =====================================================
// MODUL 0: CONFIG LOADER - Zentrale Konfigurationsverwaltung
// Lädt externe JSON-Dateien: color-schemes.json, chart-examples.json
// Hinweis: chart-examples.json wird aktuell nur geladen, nicht aktiv genutzt
// (reserviert für zukünftiges KI-Training / Few-Shot-Beispiele)
// =====================================================
const ConfigLoader = {
    cache: {},
    basePath: '../6. Bibliotheken/',

    /**
     * Lädt eine JSON-Datei und cached das Ergebnis
     * @param {string} filename - Name der Datei (z.B. 'color-schemes.json')
     * @returns {Promise<Object>} Geladene Daten
     */
    async loadJSON(filename) {
        if (this.cache[filename]) {
            return this.cache[filename];
        }

        try {
            const response = await fetch(this.basePath + filename);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            this.cache[filename] = data;
            console.log(`ConfigLoader: ${filename} geladen`);
            return data;
        } catch (error) {
            console.warn(`ConfigLoader: Fehler beim Laden von ${filename}:`, error.message);
            return null;
        }
    },

    /**
     * Lädt Farbschemas aus color-schemes.json
     * @returns {Promise<Object>} Farbschemas oder null
     */
    async getColorSchemes() {
        return this.loadJSON('color-schemes.json');
    },

    /**
     * Lädt Beispiel-Konfigurationen für einen Chart-Typ
     * @param {string} chartType - 'waterfall', 'bar', oder 'stacked_bar'
     * @returns {Promise<Array>} Array von Beispiel-Configs
     */
    async getChartExamples(chartType) {
        const data = await this.loadJSON('chart-examples.json');
        if (!data || !data.examples) return [];
        // Normalisiere den Typ (stacked-bar → stacked_bar)
        const normalizedType = chartType.replace('-', '_');
        return data.examples[normalizedType] || [];
    },

    /**
     * Lädt alle Beispiele für alle Chart-Typen
     * @returns {Promise<Object>} Alle Beispiele gruppiert nach Typ
     */
    async getAllExamples() {
        const data = await this.loadJSON('chart-examples.json');
        return data?.examples || {};
    },

    /**
     * Prüft ob externe Konfigurationen verfügbar sind
     * @returns {Promise<boolean>} true wenn externe Configs geladen werden konnten
     */
    async isAvailable() {
        const colorSchemes = await this.getColorSchemes();
        return colorSchemes !== null;
    }
};

// =====================================================
// MODUL 1: TEMPLATE LOADER
// Lädt und cached die Template-Bibliothek (templates.json)
// =====================================================
const TemplateLoader = {
    templates: null,
    loaded: false,
    loading: null,

    /**
     * Lädt templates.json und cached die Templates
     * @returns {Promise<Object>} Template-Bibliothek
     */
    async load() {
        if (this.loaded && this.templates) {
            return this.templates;
        }

        // Verhindere parallele Ladevorgänge
        if (this.loading) {
            return this.loading;
        }

        this.loading = (async () => {
            try {
                // Relativer Pfad zur templates.json
                const response = await fetch('../6. Bibliotheken/templates.json');
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                this.templates = await response.json();
                this.loaded = true;
                console.log(`TemplateLoader: ${this.templates.total_templates} Templates geladen`);
                return this.templates;
            } catch (error) {
                console.error('TemplateLoader: Fehler beim Laden:', error);
                // Fallback: Leere Struktur
                this.templates = {
                    version: '1.0',
                    templates: { waterfall: [], stacked_bar: [], bar: [] }
                };
                this.loaded = true;
                return this.templates;
            } finally {
                this.loading = null;
            }
        })();

        return this.loading;
    },

    /**
     * Gibt alle Templates eines bestimmten Typs zurück
     * @param {string} type - 'waterfall', 'stacked_bar', oder 'bar'
     * @returns {Array} Array von Templates
     */
    getByType(type) {
        if (!this.loaded || !this.templates) {
            console.warn('TemplateLoader: Templates nicht geladen');
            return [];
        }
        // Normalisiere den Typ (stacked-bar → stacked_bar)
        const normalizedType = type.replace('-', '_');
        return this.templates.templates[normalizedType] || [];
    },

    /**
     * Gibt ein einzelnes Template anhand der ID zurück
     * @param {string} id - Template-ID (z.B. 'WF-01', 'BC-03')
     * @returns {Object|null} Template oder null
     */
    getById(id) {
        if (!this.loaded || !this.templates) {
            console.warn('TemplateLoader: Templates nicht geladen');
            return null;
        }
        // Durchsuche alle Template-Typen
        for (const type of ['waterfall', 'stacked_bar', 'bar']) {
            const templates = this.templates.templates[type] || [];
            const found = templates.find(t => t.template_id === id);
            if (found) return found;
        }
        return null;
    },

    /**
     * Gibt alle Templates zurück
     * @returns {Array} Flaches Array aller Templates
     */
    getAll() {
        if (!this.loaded || !this.templates) {
            console.warn('TemplateLoader: Templates nicht geladen');
            return [];
        }
        const all = [];
        for (const type of ['waterfall', 'stacked_bar', 'bar']) {
            all.push(...(this.templates.templates[type] || []));
        }
        return all;
    },

    /**
     * Filtert Templates nach Kriterien
     * @param {Object} criteria - Filter-Kriterien
     * @returns {Array} Gefilterte Templates
     */
    filter(criteria) {
        let templates = this.getAll();

        if (criteria.chart_type) {
            templates = templates.filter(t => t.chart_type === criteria.chart_type);
        }
        if (criteria.target_audience) {
            templates = templates.filter(t =>
                t.metadata?.target_audience === criteria.target_audience);
        }
        if (criteria.analysis_perspective) {
            templates = templates.filter(t =>
                t.metadata?.analysis_perspective === criteria.analysis_perspective);
        }
        if (criteria.detail_level) {
            templates = templates.filter(t =>
                t.metadata?.detail_level === criteria.detail_level);
        }

        return templates;
    }
};
