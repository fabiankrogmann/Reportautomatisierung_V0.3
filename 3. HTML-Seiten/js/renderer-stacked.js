// =====================================================
// STACKED BAR CHART RENDERING
// =====================================================

function renderStackedBarChart(svgId, config) {
    const svg = document.getElementById(svgId);
    const options = config.options || {};

    // Validierung: Prüfe ob benötigte Felder vorhanden sind
    if (!config.categories || !Array.isArray(config.categories) || config.categories.length === 0) {
        console.error('renderStackedBarChart: Keine categories in config', config);
        if (svg) {
            svg.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="#666" font-size="14">Keine Daten für Stacked-Bar-Chart verfügbar (fehlende categories)</text>`;
        }
        return;
    }
    if (!config.segments || !Array.isArray(config.segments) || config.segments.length === 0) {
        console.error('renderStackedBarChart: Keine segments in config', config);
        if (svg) {
            svg.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="#666" font-size="14">Keine Daten für Stacked-Bar-Chart verfügbar (fehlende segments)</text>`;
        }
        return;
    }

    const width = 1200;
    const height = 500;
    const margin = { top: 80, right: 40, bottom: 100, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const numCategories = config.categories.length;

    // WICHTIG: FESTE Balkenbreite für Konsistenz zwischen allen Charts!
    const barWidth = 60;  // Feste Breite in Pixel - NICHT dynamisch berechnen!
    const minBarGap = 20;

    // Lücke zwischen Balken: gleichmäßig verteilt, aber mindestens minBarGap
    const barGap = Math.max(minBarGap, (chartWidth - (numCategories * barWidth)) / (numCategories + 1));

    const categoryTotals = config.categories.map((_, catIndex) =>
        config.segments.reduce((sum, seg) => sum + seg.values[catIndex], 0)
    );
    const maxTotal = options.normalized ? 100 : Math.max(...categoryTotals);
    const chartBottom = margin.top + chartHeight;

    // Track bar positions for brackets
    const barPositions = [];

    // Generate hatch patterns for each segment color
    let defsContent = '<defs>';
    config.segments.forEach((segment, segIndex) => {
        const color = segment.color;
        defsContent += `
            <pattern id="hatch-${svgId}-${segIndex}" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
                <rect width="6" height="6" fill="${color}" fill-opacity="0.7"/>
                <line x1="0" y1="0" x2="0" y2="6" stroke="white" stroke-width="1.5" stroke-opacity="0.4"/>
            </pattern>
        `;
    });
    defsContent += '</defs>';

    let svgContent = defsContent;

    config.categories.forEach((category, catIndex) => {
        const barX = margin.left + barGap + catIndex * (barWidth + barGap);
        const barCenterX = barX + barWidth / 2;
        const categoryTotal = categoryTotals[catIndex];

        let currentY = chartBottom;
        let barTopY = chartBottom;

        // Check if this category should be hatched (historical data)
        const isHatched = category.hatched === true;

        config.segments.forEach((segment, segIndex) => {
            const value = segment.values[catIndex];
            const displayValue = options.normalized ? (value / categoryTotal * 100) : value;
            const segmentHeight = (displayValue / maxTotal) * chartHeight;
            const segmentY = currentY - segmentHeight;

            const isTopSegment = segIndex === config.segments.length - 1;
            const roundedCorners = isTopSegment ? 'rx="3" ry="3"' : '';

            // Use hatched pattern for historical data, solid for current/plan
            const fillAttr = isHatched
                ? `fill="url(#hatch-${svgId}-${segIndex})"`
                : `fill="${segment.color}"`;

            svgContent += `<rect class="stacked-bar" x="${barX}" y="${segmentY}" width="${barWidth}" height="${segmentHeight}" ${fillAttr} ${roundedCorners} data-category="${catIndex}" data-segment="${segIndex}" data-value="${value}" data-segment-name="${segment.name}"/>`;

            // Segment label inside bar (if enough space)
            if (options.showValues && segmentHeight >= 25) {
                const textColor = getContrastColor(segment.color);
                const labelY = segmentY + segmentHeight / 2;
                const displayText = options.showPercentages
                    ? `${((value / categoryTotal) * 100).toFixed(0)}%`
                    : value.toLocaleString('de-DE');

                svgContent += `<text class="segment-label" x="${barCenterX}" y="${labelY}" fill="${textColor}">${displayText}</text>`;
            }

            currentY = segmentY;
            barTopY = segmentY;
        });

        // Store bar position for brackets
        barPositions.push({
            centerX: barCenterX,
            topY: barTopY,
            total: categoryTotal
        });

        // Total label above bar
        if (options.showTotals) {
            const totalDisplay = options.normalized ? '100%' : categoryTotal.toLocaleString('de-DE');
            svgContent += `<text class="total-label" x="${barCenterX}" y="${barTopY - 10}">${totalDisplay}</text>`;
        }

        // X-axis label (main label)
        svgContent += `<text x="${barCenterX}" y="${chartBottom + 20}" text-anchor="middle" class="axis-label" font-weight="bold" fill="#333">${category.label}</text>`;

        // X-axis sublabel (e.g., year or type indicator like "(Plan)")
        if (category.sublabel) {
            svgContent += `<text x="${barCenterX}" y="${chartBottom + 36}" text-anchor="middle" class="axis-sublabel" font-size="10" fill="#666">${category.sublabel}</text>`;
        }
    });

    // Render brackets between bars
    if (options.showBrackets || options.brackets) {
        const bracketFormat = options.bracketFormat || 'both';
        let bracketsToRender = [];

        if (options.brackets && Array.isArray(options.brackets)) {
            // Manual brackets
            bracketsToRender = options.brackets;
        } else if (options.showBrackets) {
            // Auto brackets between consecutive bars
            for (let i = 0; i < numCategories - 1; i++) {
                bracketsToRender.push({ fromCategory: i, toCategory: i + 1 });
            }
        }

        bracketsToRender.forEach(bracket => {
            const fromIdx = bracket.fromCategory;
            const toIdx = bracket.toCategory;
            const bar1 = barPositions[fromIdx];
            const bar2 = barPositions[toIdx];

            const absoluteChange = bar2.total - bar1.total;
            const percentChange = ((absoluteChange / bar1.total) * 100).toFixed(0);

            let changeText;
            switch (bracketFormat) {
                case 'absolute':
                    changeText = absoluteChange >= 0
                        ? `+${absoluteChange.toLocaleString('de-DE')}`
                        : absoluteChange.toLocaleString('de-DE');
                    break;
                case 'percent':
                    changeText = percentChange >= 0 ? `+${percentChange}%` : `${percentChange}%`;
                    break;
                default: // 'both'
                    const absText = absoluteChange >= 0
                        ? `+${absoluteChange.toLocaleString('de-DE')}`
                        : absoluteChange.toLocaleString('de-DE');
                    const pctText = percentChange >= 0 ? `(+${percentChange}%)` : `(${percentChange}%)`;
                    changeText = `${absText} ${pctText}`;
            }

            // Bracket positioning
            const x1 = bar1.centerX;
            const x2 = bar2.centerX;
            const midX = (x1 + x2) / 2;

            const totalLabelHeight = 15;
            const totalLabelGap = 10;
            const labelTop1 = bar1.topY - totalLabelGap - totalLabelHeight;
            const labelTop2 = bar2.topY - totalLabelGap - totalLabelHeight;

            const higherLabelTop = Math.min(labelTop1, labelTop2);
            const bubbleHeight = 20;
            const bubbleY = higherLabelTop - 12 - bubbleHeight;
            const bubbleCenterY = bubbleY + bubbleHeight / 2;

            const bubbleWidth = Math.max(changeText.length * 7 + 20, 60);

            // Bubble background
            svgContent += `<rect class="bracket-bubble" x="${midX - bubbleWidth/2}" y="${bubbleY}" width="${bubbleWidth}" height="${bubbleHeight}" rx="10" fill="white" stroke="#333" stroke-width="1.5"/>`;

            // Bubble text
            svgContent += `<text class="change-label" x="${midX}" y="${bubbleCenterY + 1}" text-anchor="middle" dominant-baseline="middle" font-size="10" font-weight="bold" fill="#333">${changeText}</text>`;

            // Left horizontal line
            svgContent += `<line class="bracket-line" x1="${x1}" y1="${bubbleCenterY}" x2="${midX - bubbleWidth/2}" y2="${bubbleCenterY}" stroke="#333" stroke-width="1.5"/>`;

            // Right horizontal line
            svgContent += `<line class="bracket-line" x1="${midX + bubbleWidth/2}" y1="${bubbleCenterY}" x2="${x2}" y2="${bubbleCenterY}" stroke="#333" stroke-width="1.5"/>`;

            // Left vertical line
            svgContent += `<line class="bracket-line" x1="${x1}" y1="${labelTop1}" x2="${x1}" y2="${bubbleCenterY}" stroke="#333" stroke-width="1.5"/>`;

            // Right vertical line
            svgContent += `<line class="bracket-line" x1="${x2}" y1="${bubbleCenterY}" x2="${x2}" y2="${labelTop2}" stroke="#333" stroke-width="1.5"/>`;

            // Arrow head at bottom of right line
            const arrowSize = 5;
            svgContent += `<polygon class="arrow-head" points="${x2},${labelTop2} ${x2-arrowSize},${labelTop2-arrowSize*1.5} ${x2+arrowSize},${labelTop2-arrowSize*1.5}" fill="#333"/>`;
        });
    }

    // Legend
    if (options.showLegend) {
        const legendY = height - 30;
        const legendItemWidth = 120;
        const totalLegendWidth = config.segments.length * legendItemWidth;
        let legendX = (width - totalLegendWidth) / 2;

        config.segments.forEach((segment) => {
            svgContent += `<rect x="${legendX}" y="${legendY}" width="12" height="12" fill="${segment.color}" rx="2"/>`;
            svgContent += `<text class="legend-text" x="${legendX + 18}" y="${legendY + 10}">${segment.name}</text>`;
            legendX += legendItemWidth;
        });
    }

    svg.innerHTML = svgContent;
    renderedCharts[svgId] = svgContent;
    setupTooltip(svgId);
}

// Hilfsfunktionen getContrastColor() und setupTooltip() sind in ui-helpers.js definiert
