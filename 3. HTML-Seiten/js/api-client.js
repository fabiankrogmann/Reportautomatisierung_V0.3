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
        const estimatedSavings = (this.cacheStats.totalTokensSaved / 1000000) * 2.70; // $3 - $0.30 = $2.70 pro MTok
        return {
            ...this.cacheStats,
            estimatedSavingsUSD: estimatedSavings.toFixed(4)
        };
    },

    /**
     * Parst JSON aus einer API-Antwort mit Auto-Repair für unvollständiges JSON
     */
    parseJSON(response) {
        // Debug: Zeige die ersten 200 Zeichen der Antwort
        console.log('parseJSON: Input (erste 200 Zeichen):', response?.substring(0, 200));

        if (!response || typeof response !== 'string') {
            throw new Error('Keine gültige Antwort erhalten');
        }

        // Entferne Markdown-Code-Blöcke und BOM
        let cleaned = response
            .replace(/^\uFEFF/, '')                              // BOM entfernen
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/g, '')
            .replace(/^[\s\S]*?(?=\{)/m, '')                     // Alles VOR dem ersten { entfernen
            .trim();

        // Finde das JSON-Objekt (vom ersten { bis zum Ende)
        const startIndex = cleaned.indexOf('{');
        if (startIndex === -1) {
            console.error('parseJSON: Kein JSON-Objekt gefunden in:', cleaned.substring(0, 500));
            throw new Error('Kein JSON-Objekt in der Antwort gefunden');
        }

        let jsonStr = cleaned.substring(startIndex);

        // Spezialfall: Prüfe ob JSON mit ungültigem Zeichen nach { beginnt
        // Fehler "Expected property name or '}'" bei Position 6 bedeutet oft: { + Whitespace + ungültiges Zeichen
        const afterBrace = jsonStr.substring(1).trim();
        if (afterBrace && !afterBrace.startsWith('"') && !afterBrace.startsWith('}')) {
            // JSON beginnt nicht mit einem Property-Namen oder schließender Klammer
            // Versuche, das nächste gültige JSON-Objekt zu finden
            console.warn('parseJSON: Ungültiger JSON-Start erkannt, suche alternatives JSON-Objekt');
            const nextBrace = jsonStr.indexOf('{', 1);
            if (nextBrace !== -1) {
                jsonStr = jsonStr.substring(nextBrace);
                console.log('parseJSON: Alternatives JSON-Objekt gefunden bei Position', nextBrace);
            }
        }

        // Versuche zuerst direktes Parsen
        try {
            return JSON.parse(jsonStr);
        } catch (firstError) {
            console.warn('parseJSON: Erstes Parsen fehlgeschlagen, versuche Reparatur...', firstError.message);

            // Schritt 1: Repariere abgeschnittene Strings
            // Finde offene Strings und schließe sie
            let repaired = jsonStr;
            let inString = false;
            let lastStringStart = -1;
            let escapeNext = false;

            for (let i = 0; i < repaired.length; i++) {
                const char = repaired[i];

                if (escapeNext) {
                    escapeNext = false;
                    continue;
                }

                if (char === '\\' && inString) {
                    escapeNext = true;
                    continue;
                }

                if (char === '"') {
                    if (!inString) {
                        inString = true;
                        lastStringStart = i;
                    } else {
                        inString = false;
                    }
                }
            }

            // Wenn wir in einem offenen String enden, schließe ihn
            if (inString && lastStringStart !== -1) {
                console.warn('parseJSON: Offener String gefunden, schließe ihn');
                repaired += '"';
            }

            // Schritt 2: Zähle offene/geschlossene Klammern
            let openBraces = 0;
            let openBrackets = 0;
            inString = false;
            escapeNext = false;

            for (let i = 0; i < repaired.length; i++) {
                const char = repaired[i];

                if (escapeNext) {
                    escapeNext = false;
                    continue;
                }

                if (char === '\\' && inString) {
                    escapeNext = true;
                    continue;
                }

                if (char === '"') {
                    inString = !inString;
                    continue;
                }

                if (!inString) {
                    if (char === '{') openBraces++;
                    else if (char === '}') openBraces--;
                    else if (char === '[') openBrackets++;
                    else if (char === ']') openBrackets--;
                }
            }

            // Schritt 3: Entferne unvollständige letzte Elemente
            // Entferne trailing comma, unvollständige key-value pairs
            repaired = repaired
                .replace(/,\s*$/, '')                           // Trailing comma
                .replace(/,\s*"[^"]*":\s*$/, '')                // Unvollständiges key:value
                .replace(/,\s*"[^"]*"\s*$/, '')                 // Key ohne Wert
                .replace(/:\s*"[^"]*$/, ': ""')                 // Abgeschnittener String-Wert
                .replace(/:\s*-?\d+\.?\d*$/, ': 0');            // Abgeschnittene Zahl

            // Schritt 4: Füge fehlende Klammern hinzu
            for (let i = 0; i < openBrackets; i++) {
                repaired += ']';
            }
            for (let i = 0; i < openBraces; i++) {
                repaired += '}';
            }

            console.log(`parseJSON: Repariert - ${openBraces} fehlende }, ${openBrackets} fehlende ]`);

            try {
                return JSON.parse(repaired);
            } catch (secondError) {
                // Schritt 5: Aggressivere Reparatur - suche letztes gültiges Objekt/Array
                console.warn('parseJSON: Einfache Reparatur fehlgeschlagen, versuche aggressivere Methode');

                // Versuche, das JSON Zeichen für Zeichen zu kürzen bis es parst
                let truncated = repaired;
                for (let cutoff = truncated.length - 1; cutoff > 100; cutoff--) {
                    const attempt = truncated.substring(0, cutoff);
                    // Zähle Klammern für diesen Versuch
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

                    // Baue den abgeschnittenen JSON zusammen
                    let fixed = attempt.replace(/,\s*$/, '');
                    for (let i = 0; i < brackets; i++) fixed += ']';
                    for (let i = 0; i < braces; i++) fixed += '}';

                    try {
                        const result = JSON.parse(fixed);
                        console.log(`parseJSON: Erfolgreich nach Kürzung um ${truncated.length - cutoff} Zeichen`);
                        return result;
                    } catch (e) {
                        // Weiter kürzen
                    }
                }

                console.error('parseJSON: Alle Reparaturversuche fehlgeschlagen');
                console.error('parseJSON: Original (erste 500 Zeichen):', jsonStr.substring(0, 500));
                throw new Error(`JSON Parse error: ${secondError.message}`);
            }
        }
    }
};
