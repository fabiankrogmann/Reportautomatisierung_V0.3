// =====================================================
// MODUL 3: API CLIENT
// Einheitlicher Client für Anthropic und OpenAI
// MIT ANTHROPIC PROMPT CACHING für 90% Kostenersparnis bei wiederholten Calls
// =====================================================
const APIClient = {
    provider: 'anthropic',
    apiKey: null,

    // Cache-Statistiken für Monitoring
    cacheStats: {
        totalCacheHits: 0,
        totalCacheWrites: 0,
        totalTokensSaved: 0
    },

    // Call-Log für Pipeline-Performance-Tracking
    callLog: [],

    /**
     * Initialisiert den API Client
     */
    init(apiKey, provider = 'anthropic') {
        this.apiKey = apiKey;
        this.provider = provider;
        this.callLog = [];
    },

    /**
     * Führt einen API-Call aus
     * @param {string} systemPrompt - System-Prompt
     * @param {string} userPrompt - User-Prompt mit Daten
     * @param {Object} options - Zusätzliche Optionen
     * @param {number} options.maxTokens - Maximale Ausgabe-Tokens (default: 4096)
     * @param {boolean} options.enableCaching - Prompt Caching aktivieren (default: true für Anthropic)
     * @returns {Promise<string>} API-Antwort
     */
    async call(systemPrompt, userPrompt, options = {}) {
        const maxTokens = options.maxTokens || 4096;
        const enableCaching = options.enableCaching !== false; // Default: true
        const label = options.label || 'unknown';

        const startTime = performance.now();
        let response;

        if (this.provider === 'anthropic') {
            response = await this._callAnthropic(systemPrompt, userPrompt, maxTokens, { enableCaching });
        } else {
            response = await this._callOpenAI(systemPrompt, userPrompt, maxTokens);
        }

        const duration = (performance.now() - startTime) / 1000;

        this.callLog.push({
            label,
            duration: Math.round(duration * 10) / 10,
            usage: response.usage || {},
            timestamp: new Date().toISOString()
        });

        return response.text;
    },

    /**
     * Anthropic API Call mit Prompt Caching Support
     * Caching reduziert Kosten um bis zu 90% bei wiederholten Calls mit gleichem System-Prompt
     *
     * @param {string} systemPrompt - Der System-Prompt (wird gecacht)
     * @param {string} userPrompt - Der User-Prompt mit den Daten
     * @param {number} maxTokens - Maximale Ausgabe-Tokens
     * @param {Object} options - { enableCaching: boolean }
     */
    async _callAnthropic(systemPrompt, userPrompt, maxTokens, options = {}) {
        console.log('APIClient: Starte Anthropic API Call...');

        // AbortController für Timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s Timeout

        // System-Prompt: String → Array mit cache_control für Prompt Caching
        let systemContent;
        const estimatedTokens = Math.round(systemPrompt.length / 4);

        // Caching nur aktivieren wenn:
        // 1. enableCaching = true
        // 2. Prompt hat mindestens 1024 Tokens (Anthropic Minimum)
        if (options.enableCaching && estimatedTokens >= 1024) {
            systemContent = [{
                type: 'text',
                text: systemPrompt,
                cache_control: { type: 'ephemeral' }
            }];
            console.log(`APIClient: Prompt Caching aktiviert (~${estimatedTokens} Tokens, TTL: 5 Min)`);
        } else {
            // Ohne Caching: einfacher String
            systemContent = systemPrompt;
            if (options.enableCaching && estimatedTokens < 1024) {
                console.log(`APIClient: Prompt zu kurz für Caching (~${estimatedTokens} < 1024 Tokens)`);
            }
        }

        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true'
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: maxTokens,
                    system: systemContent,  // Array-Format für Caching
                    messages: [{ role: 'user', content: userPrompt }]
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(`Anthropic API Error: ${error.error?.message || response.statusText}`);
            }

            const data = await response.json();

            // Cache-Statistiken loggen und tracken
            if (data.usage) {
                const { cache_creation_input_tokens, cache_read_input_tokens, input_tokens } = data.usage;

                if (cache_read_input_tokens > 0) {
                    // Cache HIT - 90% Ersparnis auf diese Tokens!
                    this.cacheStats.totalCacheHits++;
                    this.cacheStats.totalTokensSaved += Math.round(cache_read_input_tokens * 0.9);
                    console.log(`✓ CACHE HIT: ${cache_read_input_tokens} Tokens aus Anthropic-Cache gelesen (90% günstiger)`);
                } else if (cache_creation_input_tokens > 0) {
                    // Cache WRITE - 25% Aufschlag für erste Anfrage
                    this.cacheStats.totalCacheWrites++;
                    console.log(`Cache geschrieben: ${cache_creation_input_tokens} Tokens (TTL: 5 Min, +25% einmalig)`);
                }

                const totalInputTokens = (input_tokens || 0) + (cache_read_input_tokens || 0) + (cache_creation_input_tokens || 0);
                console.log(`APIClient: Input-Tokens gesamt: ${totalInputTokens}, Output: ${data.usage.output_tokens || 'N/A'}`);
            }

            console.log('APIClient: Anthropic API Antwort erhalten');
            return { text: data.content[0].text, usage: data.usage || {} };
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('API Timeout: Anfrage dauerte länger als 60 Sekunden');
            }
            throw error;
        }
    },

    /**
     * OpenAI API Call (ohne Prompt Caching - nicht unterstützt)
     */
    async _callOpenAI(systemPrompt, userPrompt, maxTokens) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                max_tokens: maxTokens,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`OpenAI API Error: ${error.error?.message || response.statusText}`);
        }

        const data = await response.json();
        return { text: data.choices[0].message.content, usage: data.usage || {} };
    },

    /**
     * Gibt Call-Log für Pipeline-Performance zurück
     */
    getCallLog() {
        return [...this.callLog];
    },

    /**
     * Gibt Cache-Statistiken zurück
     * @returns {Object} - { totalCacheHits, totalCacheWrites, totalTokensSaved, estimatedSavings }
     */
    getCacheStats() {
        // Geschätzte Ersparnis in USD (bei $3/MTok Input, $0.30/MTok Cache-Read)
        const estimatedSavings = (this.cacheStats.totalTokensSaved / 1000000) * 2.70; // Ersparnis: $3.00/MTok (Input) - $0.30/MTok (Cache-Read) = $2.70/MTok
        return {
            ...this.cacheStats,
            estimatedSavingsUSD: estimatedSavings.toFixed(4)
        };
    },

    /**
     * Parst JSON aus einer API-Antwort mit Auto-Repair für unvollständiges JSON
     */
    parseJSON(response) {
        console.log('parseJSON: Input (erste 200 Zeichen):', response?.substring(0, 200));

        if (!response || typeof response !== 'string') {
            throw new Error('Keine gültige Antwort erhalten');
        }

        // Schritt 1: Bereinige Markdown/BOM und extrahiere JSON-String
        const jsonStr = this._extractJsonFromText(response);

        // Schritt 2: Direktes Parsen versuchen
        try {
            return JSON.parse(jsonStr);
        } catch (firstError) {
            console.warn('parseJSON: Erstes Parsen fehlgeschlagen, versuche Reparatur...', firstError.message);

            // Schritt 3: Offene Strings schließen
            let repaired = this._repairOpenStrings(jsonStr);

            // Schritt 4: Unvollständige Elemente entfernen + Klammern balancieren
            repaired = this._balanceBraces(repaired);

            try {
                return JSON.parse(repaired);
            } catch (secondError) {
                // Schritt 5: Aggressives Kürzen als Fallback
                return this._truncateToValidJson(repaired, jsonStr, secondError);
            }
        }
    },

    /**
     * Extrahiert JSON-String aus API-Antwort (entfernt Markdown, BOM, Freitext)
     */
    _extractJsonFromText(text) {
        let cleaned = text
            .replace(/^\uFEFF/, '')
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .replace(/^[\s\S]*?(?=\{)/m, '')
            .trim();

        const startIndex = cleaned.indexOf('{');
        if (startIndex === -1) {
            console.error('parseJSON: Kein JSON-Objekt gefunden in:', cleaned.substring(0, 500));
            throw new Error('Kein JSON-Objekt in der Antwort gefunden');
        }

        let jsonStr = cleaned.substring(startIndex);

        // Prüfe ob JSON mit ungültigem Zeichen nach { beginnt
        const afterBrace = jsonStr.substring(1).trim();
        if (afterBrace && !afterBrace.startsWith('"') && !afterBrace.startsWith('}')) {
            console.warn('parseJSON: Ungültiger JSON-Start erkannt, suche alternatives JSON-Objekt');
            const nextBrace = jsonStr.indexOf('{', 1);
            if (nextBrace !== -1) {
                jsonStr = jsonStr.substring(nextBrace);
            }
        }

        return jsonStr;
    },

    /**
     * Repariert offene (nicht geschlossene) Strings
     */
    _repairOpenStrings(jsonStr) {
        let repaired = jsonStr;
        let inString = false;
        let lastStringStart = -1;
        let escapeNext = false;

        for (let i = 0; i < repaired.length; i++) {
            const char = repaired[i];
            if (escapeNext) { escapeNext = false; continue; }
            if (char === '\\' && inString) { escapeNext = true; continue; }
            if (char === '"') {
                if (!inString) { inString = true; lastStringStart = i; }
                else { inString = false; }
            }
        }

        if (inString && lastStringStart !== -1) {
            console.warn('parseJSON: Offener String gefunden, schließe ihn');
            repaired += '"';
        }

        return repaired;
    },

    /**
     * Entfernt unvollständige Elemente und balanciert Klammern
     */
    _balanceBraces(jsonStr) {
        // Zähle offene/geschlossene Klammern
        let openBraces = 0, openBrackets = 0;
        let inString = false, escapeNext = false;

        for (let i = 0; i < jsonStr.length; i++) {
            const char = jsonStr[i];
            if (escapeNext) { escapeNext = false; continue; }
            if (char === '\\' && inString) { escapeNext = true; continue; }
            if (char === '"') { inString = !inString; continue; }
            if (!inString) {
                if (char === '{') openBraces++;
                else if (char === '}') openBraces--;
                else if (char === '[') openBrackets++;
                else if (char === ']') openBrackets--;
            }
        }

        // Entferne unvollständige letzte Elemente
        let repaired = jsonStr
            .replace(/,\s*$/, '')
            .replace(/,\s*"[^"]*":\s*$/, '')
            .replace(/,\s*"[^"]*"\s*$/, '')
            .replace(/:\s*"[^"]*$/, ': ""')
            .replace(/:\s*-?\d+\.?\d*$/, ': 0');

        // Füge fehlende Klammern hinzu
        for (let i = 0; i < openBrackets; i++) repaired += ']';
        for (let i = 0; i < openBraces; i++) repaired += '}';

        console.log(`parseJSON: Repariert - ${openBraces} fehlende }, ${openBrackets} fehlende ]`);
        return repaired;
    },

    /**
     * Kürzt JSON aggressiv Zeichen für Zeichen bis ein valides Objekt entsteht
     */
    _truncateToValidJson(repaired, originalJson, parseError) {
        console.warn('parseJSON: Einfache Reparatur fehlgeschlagen, versuche aggressivere Methode');

        for (let cutoff = repaired.length - 1; cutoff > 100; cutoff--) {
            const attempt = repaired.substring(0, cutoff);
            let braces = 0, brackets = 0;
            let inStr = false, esc = false;
            for (const c of attempt) {
                if (esc) { esc = false; continue; }
                if (c === '\\' && inStr) { esc = true; continue; }
                if (c === '"') { inStr = !inStr; continue; }
                if (!inStr) {
                    if (c === '{') braces++;
                    else if (c === '}') braces--;
                    else if (c === '[') brackets++;
                    else if (c === ']') brackets--;
                }
            }

            let fixed = attempt.replace(/,\s*$/, '');
            for (let i = 0; i < brackets; i++) fixed += ']';
            for (let i = 0; i < braces; i++) fixed += '}';

            try {
                const result = JSON.parse(fixed);
                console.log(`parseJSON: Erfolgreich nach Kürzung um ${repaired.length - cutoff} Zeichen`);
                return result;
            } catch (e) {
                // Weiter kürzen
            }
        }

        console.error('parseJSON: Alle Reparaturversuche fehlgeschlagen');
        console.error('parseJSON: Original (erste 500 Zeichen):', originalJson.substring(0, 500));
        throw new Error(`JSON Parse error: ${parseError.message}`);
    }
};
