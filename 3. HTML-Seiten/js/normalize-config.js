function generateConfigFingerprint(config, cType) {
    try {
        const titleHash = (config.title || '').toLowerCase().replace(/\s+/g, '');
        const perspective = config._perspectiveName || 'default';
        if (cType === 'waterfall' || cType === 'waterfall') {
            const barLabels = config.bars?.slice(0, 3).map(b => (b.label || '').substring(0, 10)).join('|') || '';
            return `WF:${perspective}:${titleHash}:${config.bars?.length || 0}:${barLabels}`;
        }
        if (cType === 'bar') {
            return `BAR:${perspective}:${titleHash}:${config.periods?.length || 0}:${config.categories?.length || 0}`;
        }
        if (cType === 'stacked_bar' || cType === 'stacked-bar') {
            return `SB:${perspective}:${titleHash}:${config.categories?.length || 0}:${config.segments?.length || 0}`;
        }
        return `GENERIC:${perspective}:${titleHash}:${JSON.stringify(config).length}`;
    } catch (e) {
        return `ERROR:${Date.now()}`;
    }
}

// =====================================================
// normalizeConfigForRenderer()
// Wandelt features.bracket.enabled → config.bracket.show etc.
// für die JS-Rendering-Engine
// =====================================================
function normalizeConfigForRenderer(config) {
    if (!config) return config;

    // 1. data[] → bars[] Alias
    if (config.data && Array.isArray(config.data) && !config.bars) {
        config.bars = config.data;
    }

    // 2. features.bracket → config.bracket (flaches Format für JS-Renderer)
    if (config.features?.bracket?.enabled) {
        config.bracket = {
            show: true,
            fromIndex: config.features.bracket.fromIndex || 0,
            toIndex: config.features.bracket.toIndex || (config.bars?.length ? config.bars.length - 1 : 0),
            label: config.features.bracket.label || ''
        };
    }

    // 3. features.categoryBrackets → config.categoryBrackets[]
    if (config.features?.categoryBrackets?.enabled && Array.isArray(config.features.categoryBrackets.items)) {
        config.categoryBrackets = config.features.categoryBrackets.items;
    }

    // 4. features.scaleBreak → config.scaleBreak
    if (config.features?.scaleBreak?.enabled) {
        config.scaleBreak = {
            enabled: true,
            breakAt: config.features.scaleBreak.breakAt,
            style: config.features.scaleBreak.style || 'zigzag'
        };
    }

    // 5. features.benchmarkLines → config.benchmarkLines
    if (config.features?.benchmarkLines?.enabled && Array.isArray(config.features.benchmarkLines.lines)) {
        config.benchmarkLines = config.features.benchmarkLines.lines;
    }

    // 6. features.grouping → config.grouping
    if (config.features?.grouping?.enabled && Array.isArray(config.features.grouping.groups)) {
        config.grouping = config.features.grouping.groups;
    }

    // 7. displayValue auf allen bars sicherstellen
    if (config.bars && Array.isArray(config.bars)) {
        config.bars.forEach(bar => {
            if (bar.displayValue === undefined && bar.value !== undefined) {
                const absVal = Math.abs(bar.value);
                if (absVal >= 1000000) {
                    bar.displayValue = (bar.value / 1000000).toFixed(1).replace('.', ',') + ' Mio.';
                } else if (absVal >= 1000) {
                    bar.displayValue = Math.round(bar.value).toLocaleString('de-DE');
                } else {
                    bar.displayValue = bar.value.toLocaleString('de-DE');
                }
            }
        });
    }

    // 8. colors-Objekt sicherstellen
    if (!config.colors && config.bars) {
        config.colors = { ...DEFAULT_COLORS.waterfall };
    }

    return config;
}
