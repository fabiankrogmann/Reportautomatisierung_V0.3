// =====================================================
// MODUL: PromptLoader - Lädt Prompts aus .md-Dateien
// VOLLSTÄNDIG laden (keine Marker-Extraktion mehr)
// Mit Hash-basierter Cache-Validierung für Anthropic Prompt Caching
// =====================================================
const PromptLoader = {
    cache: {},           // { promptName: { content, hash, timestamp, size, tokens } }
    loadedPrompts: [],   // Tracking welche Prompts geladen wurden
    basePaths: {
        charts: '../4. Prompts/Prompts for Charts/',
        general: '../4. Prompts/'
    },

    // Mapping: Prompt-Name → Dateiname
    promptFiles: {
        'variant_generator': 'PROMPT-2-VARIANT-GENERATOR.md'
    },

    /**
     * Berechnet einen einfachen Hash für Cache-Validierung
     * @param {string} content - Der Inhalt zum Hashen
     * @returns {string} - Hexadezimaler Hash-String
     */
    computeHash(content) {
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(16);
    },

    /**
     * Prüft ob Cache-Eintrag noch gültig ist (Hash-Vergleich)
     * @param {string} promptName - Name des Prompts
     * @param {string} currentHash - Hash des aktuell geladenen Inhalts
     * @returns {boolean} - true wenn Cache valide
     */
    isCacheValid(promptName, currentHash) {
        const cached = this.cache[promptName];
        if (!cached) return false;

        // Hash-Vergleich: Datei geändert?
        if (cached.hash !== currentHash) {
            console.log(`PromptLoader: Cache ungültig für '${promptName}' (Hash geändert: ${cached.hash} → ${currentHash})`);
            return false;
        }

        return true;
    },

    /**
     * Extrahiert den relevanten Prompt-Inhalt basierend auf Markern
     * Reduziert Token-Anzahl durch Ausschluss von Dokumentation
     * @param {string} rawContent - Vollständiger Dateiinhalt
     * @param {string} promptName - Name des Prompts (für Logging)
     * @returns {string} - Extrahierter Prompt-Inhalt
     */
    extractPromptContent(rawContent, promptName) {
        const startMarker = '<!-- PROMPT-START -->';
        const endMarker = '<!-- PROMPT-END -->';
        const includeStartMarker = '<!-- PROMPT-INCLUDE -->';
        const includeEndMarker = '<!-- PROMPT-INCLUDE-END -->';

        let extractedContent = '';
        let usedMarkers = false;

        // 1. Haupt-Prompt zwischen PROMPT-START und PROMPT-END extrahieren
        const startIndex = rawContent.indexOf(startMarker);
        const endIndex = rawContent.indexOf(endMarker);

        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            // Haupt-Prompt extrahieren (ohne die Marker selbst)
            extractedContent = rawContent.substring(
                startIndex + startMarker.length,
                endIndex
            ).trim();
            usedMarkers = true;
        }

        // 2. Alle PROMPT-INCLUDE Blöcke finden und hinzufügen
        let searchStart = 0;
        while (true) {
            const includeStart = rawContent.indexOf(includeStartMarker, searchStart);
            if (includeStart === -1) break;

            const includeEnd = rawContent.indexOf(includeEndMarker, includeStart);
            if (includeEnd === -1) break;

            // Include-Block extrahieren
            const includeContent = rawContent.substring(
                includeStart + includeStartMarker.length,
                includeEnd
            ).trim();

            if (includeContent) {
                extractedContent += '\n\n' + includeContent;
                usedMarkers = true;
            }

            searchStart = includeEnd + includeEndMarker.length;
        }

        // 3. Wenn keine Marker gefunden → vollständigen Inhalt verwenden
        if (!usedMarkers) {
            console.log(`PromptLoader: '${promptName}' hat keine Marker - verwende vollständigen Inhalt`);
            return rawContent;
        }

        // Token-Reduktion berechnen und loggen
        const originalTokens = Math.round(rawContent.length / 4);
        const extractedTokens = Math.round(extractedContent.length / 4);
        const reduction = Math.round((1 - extractedTokens / originalTokens) * 100);
        console.log(`PromptLoader: '${promptName}' extrahiert - ${reduction}% Token-Reduktion (${originalTokens} → ${extractedTokens})`);

        return extractedContent;
    },

    /**
     * Lädt einen Prompt aus der entsprechenden .md-Datei
     * Extrahiert nur Marker-Inhalt für Chart-Prompts
     * @param {string} promptName - Name des Prompts (z.B. 'waterfall', 'bar')
     * @param {boolean} forceReload - Cache ignorieren und neu laden
     * @returns {Promise<string>} - Der vollständige Prompt-Inhalt
     * @throws {Error} - Wenn Prompt nicht geladen werden kann
     */
    async load(promptName, forceReload = false) {
        const filename = this.promptFiles[promptName];
        if (!filename) {
            throw new Error(`PromptLoader: Unbekannter Prompt '${promptName}'. Verfügbare Prompts: ${Object.keys(this.promptFiles).join(', ')}`);
        }

        const isChartPrompt = ['waterfall', 'bar', 'stacked_bar'].includes(promptName);
        const basePath = isChartPrompt ? this.basePaths.charts : this.basePaths.general;
        const fullPath = basePath + filename;

        try {
            // Datei laden (immer für Hash-Berechnung)
            const response = await fetch(fullPath);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} beim Laden von ${fullPath}`);
            }
            const rawContent = await response.text();

            if (!rawContent || rawContent.trim().length === 0) {
                throw new Error(`Prompt-Datei ${fullPath} ist leer`);
            }

            // Hash berechnen
            const currentHash = this.computeHash(rawContent);

            // Cache-Validierung (wenn nicht forceReload)
            if (!forceReload && this.isCacheValid(promptName, currentHash)) {
                // Bei Cache-Hit: KEIN neuer Tracking-Eintrag (wurde bereits beim ersten Load getracked)
                console.log(`PromptLoader: '${promptName}' aus Cache (Hash: ${currentHash}, ~${this.cache[promptName].tokens} Tokens)`);
                return this.cache[promptName].content;
            }

            // Marker-basierte Extraktion für Chart-Prompts (Token-Reduktion)
            const content = this.extractPromptContent(rawContent, promptName);
            const tokens = Math.round(content.length / 4);

            // Cache aktualisieren
            this.cache[promptName] = {
                content: content,
                hash: currentHash,
                timestamp: Date.now(),
                size: content.length,
                tokens: tokens
            };

            // Tracking für Protokoll (nur wenn noch nicht vorhanden)
            if (!this.loadedPrompts.find(p => p.name === promptName)) {
                this.loadedPrompts.push({
                    name: promptName,
                    file: filename,
                    size: content.length,
                    tokens: tokens,
                    source: forceReload ? 'reload' : 'fresh',
                    hash: currentHash
                });
            }

            console.log(`PromptLoader: '${promptName}' geladen (${content.length} Zeichen, ~${tokens} Tokens, Hash: ${currentHash})`);
            return content;

        } catch (error) {
            // Kein Fallback - Fehler direkt weitergeben
            const errorMsg = `FEHLER: Prompt '${promptName}' konnte nicht geladen werden.\n` +
                `Datei: ${fullPath}\n` +
                `Grund: ${error.message}\n\n` +
                `HINWEIS: Stellen Sie sicher, dass:\n` +
                `1. Die Anwendung über einen HTTP-Server läuft (nicht file://)\n` +
                `2. Die Prompt-Datei existiert unter: 4. Prompts/\n` +
                `3. Der Server Zugriff auf den Prompts-Ordner hat`;

            console.error(errorMsg);
            throw new Error(errorMsg);
        }
    },

    /**
     * Lädt alle Prompts vor (für schnellere Generierung)
     * @throws {Error} - Wenn ein Prompt nicht geladen werden kann
     */
    async preloadAll() {
        const promptNames = Object.keys(this.promptFiles);
        const errors = [];

        for (const name of promptNames) {
            try {
                await this.load(name);
            } catch (error) {
                errors.push({ name, error: error.message });
            }
        }

        if (errors.length > 0) {
            const errorDetails = errors.map(e => `- ${e.name}: ${e.error}`).join('\n');
            const errorMsg = `PromptLoader: ${errors.length} von ${promptNames.length} Prompts konnten nicht geladen werden:\n${errorDetails}`;
            console.error(errorMsg);
            throw new Error(errorMsg);
        }

        // Zusammenfassung ausgeben
        const totalTokens = Object.values(this.cache).reduce((sum, c) => sum + c.tokens, 0);
        const totalSize = Object.values(this.cache).reduce((sum, c) => sum + c.size, 0);
        console.log(`PromptLoader: Alle ${promptNames.length} Prompts geladen (${(totalSize/1024).toFixed(1)} KB, ~${totalTokens} Tokens gesamt)`);
    },

    /**
     * Prüft ob Prompts neu geladen werden müssen
     * Vergleicht Hashes der gecachten Prompts mit aktuellen Dateien
     * @returns {Promise<Object>} - { valid: [], invalid: [], errors: [] }
     */
    async validateCache() {
        const results = { valid: [], invalid: [], errors: [] };

        for (const [promptName, cached] of Object.entries(this.cache)) {
            try {
                const filename = this.promptFiles[promptName];
                const isChartPrompt = ['waterfall', 'bar', 'stacked_bar'].includes(promptName);
                const basePath = isChartPrompt ? this.basePaths.charts : this.basePaths.general;

                const response = await fetch(basePath + filename);
                const content = await response.text();
                const currentHash = this.computeHash(content);

                if (cached.hash === currentHash) {
                    results.valid.push(promptName);
                } else {
                    results.invalid.push({
                        name: promptName,
                        oldHash: cached.hash,
                        newHash: currentHash
                    });
                }
            } catch (error) {
                results.errors.push({ name: promptName, error: error.message });
            }
        }

        console.log('PromptLoader: Cache-Validierung:', results);
        return results;
    },

    /**
     * Lädt ungültige Cache-Einträge neu
     * @returns {Promise<number>} - Anzahl neu geladener Prompts
     */
    async refreshInvalidCache() {
        const validation = await this.validateCache();

        for (const item of validation.invalid) {
            console.log(`PromptLoader: Lade '${item.name}' neu (Hash geändert)`);
            await this.load(item.name, true); // forceReload
        }

        return validation.invalid.length;
    },

    /**
     * Cache leeren (für Entwicklung/Debugging)
     */
    clearCache() {
        this.cache = {};
        this.loadedPrompts = [];
        console.log('PromptLoader: Cache geleert');
    },

    /**
     * Gibt Cache-Statistiken zurück
     * @returns {Object} - Statistiken über gecachte Prompts
     */
    getCacheStats() {
        const stats = {
            count: Object.keys(this.cache).length,
            prompts: {},
            totalSize: 0,
            totalTokens: 0
        };

        for (const [name, data] of Object.entries(this.cache)) {
            stats.prompts[name] = {
                size: data.size,
                tokens: data.tokens,
                hash: data.hash,
                age: Date.now() - data.timestamp
            };
            stats.totalSize += data.size;
            stats.totalTokens += data.tokens;
        }

        return stats;
    }
};


// =====================================================
// LAYOUT-RANKING API-CALL - ENTFERNT (Phase 1 Refactoring)
// =====================================================
// =====================================================
// LEGACY-CODE ENTFERNT (Bereinigung Januar 2026)
// =====================================================
// Entfernte Funktionen:
// - generateAllConfigsViaAPI() - wurde nie aufgerufen
// - generateChartsWithRanking() - durch Template-Workflow ersetzt
// Das System generiert nun ALLE Templates des gewählten Typs direkt
// über den Template-basierten Workflow (TemplateLoader + ChartMixer).

// Hilfsfunktion: Keywords aus Analyse extrahieren
function extractKeywordsFromAnalysis(analysis) {
    const keywords = [];
    if (Array.isArray(analysis?.positions)) {
        analysis.positions.forEach(p => {
            if (p.label) {
                keywords.push(p.label.toLowerCase());
            }
        });
    }
    // Zusätzliche Keywords aus dataFormat
    if (analysis?.dataFormat) {
        keywords.push(analysis.dataFormat.toLowerCase());
    }
    return keywords.slice(0, 20); // Max 20 Keywords
}
