// =====================================================
// WATERFALL CHART RENDERING
// =====================================================

function renderWaterfallChart(svgId, config) {
    const svg = document.getElementById(svgId);

    // Validierung: config und config.bars müssen existieren
    if (!config || !config.bars || !Array.isArray(config.bars) || config.bars.length === 0) {
        console.error('renderWaterfallChart: Ungültige config oder keine bars vorhanden', config);
        if (svg) {
            svg.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="#666" font-size="14">Keine Daten für Waterfall-Chart verfügbar</text>`;
        }
        return;
    }

    const colors = config.colors || DEFAULT_COLORS.waterfall;

    const width = CHART_DEFAULTS.width;
    const height = CHART_DEFAULTS.height;
    const margin = { top: 80, right: 40, bottom: 80, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const numBars = config.bars.length;

    // WICHTIG: FESTE Balkenbreite für Konsistenz zwischen allen Charts!
    const barWidth = 50;  // Feste Breite in Pixel - NICHT dynamisch berechnen!
    const minBarGap = 15;

    // Lücke zwischen Balken: gleichmäßig verteilt, aber mindestens minBarGap
    const barGap = Math.max(minBarGap, (chartWidth - numBars * barWidth) / (numBars + 1));

    function getBarX(index) {
        return margin.left + barGap + index * (barWidth + barGap);
    }

    // Kumulative Werte berechnen
    let cumulative = 0;
    const barData = [];

    config.bars.forEach((bar) => {
        // Sicherheitsprüfung: value als Zahl erzwingen
        const barValue = typeof bar.value === 'string' ? parseFloat(bar.value) : (bar.value || 0);

        if (bar.type === 'start') {
            cumulative = barValue;
            barData.push({ ...bar, cumulative: barValue, startY: 0, value: barValue });
        } else if (bar.type === 'increase') {
            const startY = cumulative;
            cumulative += barValue;
            barData.push({ ...bar, cumulative, startY, value: barValue });
        } else if (bar.type === 'decrease') {
            const startY = cumulative;
            cumulative += barValue;
            barData.push({ ...bar, cumulative, startY, value: barValue });
        } else if (bar.type === 'end') {
            // Sicherheitsprüfung: value als Zahl erzwingen
            let endValue;
            if (bar.value !== undefined && bar.value !== null) {
                endValue = typeof bar.value === 'string' ? parseFloat(bar.value) : bar.value;
            } else {
                endValue = cumulative;  // Automatisch berechnen
            }
            if (isNaN(endValue)) endValue = cumulative;
            cumulative = endValue;
            barData.push({ ...bar, cumulative: endValue, startY: 0, value: endValue });
        } else if (bar.type === 'compare') {
            barData.push({ ...bar, cumulative: bar.value, startY: 0 });
        }
    });

    // Y-Skala berechnen
    const allValues = [];
    barData.forEach(bar => {
        if (bar.type === 'start' || bar.type === 'end' || bar.type === 'compare') {
            allValues.push(bar.cumulative);
            allValues.push(0);
        } else {
            allValues.push(bar.startY);
            allValues.push(bar.cumulative);
        }
    });

    const maxValue = Math.max(...allValues) * 1.2;
    const minValue = Math.min(0, ...allValues);
    const valueRange = maxValue - minValue;

    function yScale(value) {
        if (valueRange === 0) return margin.top + chartHeight / 2;
        return margin.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
    }

    const baselineY = yScale(0);

    let svgContent = '';

    // Achsenlinie
    svgContent += `<line x1="${margin.left}" y1="${baselineY}" x2="${width - margin.right}" y2="${baselineY}" stroke="#ccc" stroke-width="1"/>`;

    // Connector-Linien ZUERST
    barData.forEach((bar, index) => {
        if (index < barData.length - 1) {
            const nextBar = barData[index + 1];
            if (nextBar.type === 'compare') return;

            let connectorY;
            if (bar.type === 'start' || bar.type === 'end') {
                connectorY = yScale(bar.cumulative);
            } else if (bar.type === 'increase' || bar.type === 'decrease') {
                connectorY = yScale(bar.cumulative);
            }

            if (connectorY !== undefined) {
                const fromX = getBarX(index) + barWidth;
                const toX = getBarX(index + 1);
                svgContent += `<line class="connector-line" x1="${fromX}" y1="${connectorY}" x2="${toX}" y2="${connectorY}" stroke="${colors.connector}" stroke-dasharray="4,3"/>`;
            }
        }
    });

    // Balken zeichnen
    barData.forEach((bar, index) => {
        const barX = getBarX(index);
        let barY, barHeight, fillColor;

        if (bar.type === 'start') {
            // Start-Balken: von 0 bis zum Wert (kann auch negativ sein)
            if (bar.cumulative >= 0) {
                barY = yScale(bar.cumulative);
                barHeight = baselineY - barY;
            } else {
                barY = baselineY;
                barHeight = yScale(bar.cumulative) - baselineY;
            }
            fillColor = colors.start;
        } else if (bar.type === 'end') {
            // End-Balken: von 0 bis zum Wert (kann auch negativ sein!)
            if (bar.cumulative >= 0) {
                barY = yScale(bar.cumulative);
                barHeight = baselineY - barY;
            } else {
                // NEGATIVER END-WERT: Balken geht unter die Nulllinie
                barY = baselineY;
                barHeight = yScale(bar.cumulative) - baselineY;
            }
            fillColor = colors.end;
        } else if (bar.type === 'compare') {
            // Compare-Balken: von 0 bis zum Wert
            if (bar.cumulative >= 0) {
                barY = yScale(bar.cumulative);
                barHeight = baselineY - barY;
            } else {
                barY = baselineY;
                barHeight = yScale(bar.cumulative) - baselineY;
            }
            fillColor = colors.compare;
        } else if (bar.type === 'increase') {
            barY = yScale(bar.cumulative);
            barHeight = yScale(bar.startY) - barY;
            fillColor = colors.positive;
        } else if (bar.type === 'decrease') {
            barY = yScale(bar.startY);
            barHeight = yScale(bar.cumulative) - barY;
            fillColor = colors.negative;
        }

        // Prüfe ob Skalenbruch für diesen Balken nötig ist
        const needsScaleBreak = config.scaleBreak && config.scaleBreak.enabled &&
            (config.scaleBreak.barIndex === index ||
             (bar.type === 'increase' || bar.type === 'decrease') && Math.abs(bar.value) > maxValue * 0.4);

        // Balken (behandle sowohl \n als auch \\n in Labels)
        const cleanLabel = (bar.label || '').replace(/\\n/g, '\n').replace(/\n/g, ' ');

        if (needsScaleBreak && barHeight > 60) {
            // SKALENBRUCH: Balken in zwei Teile mit Zickzack in der Mitte
            const breakY = barY + barHeight * 0.4;  // Bruch bei 40% von oben
            const breakGap = 16;
            const zigzagAmplitude = 4;

            // Oberer Teil
            svgContent += `<rect class="bar" x="${barX}" y="${barY}" width="${barWidth}" height="${breakY - barY - breakGap/2}" fill="${fillColor}" rx="2"/>`;

            // Unterer Teil
            svgContent += `<rect class="bar" x="${barX}" y="${breakY + breakGap/2}" width="${barWidth}" height="${barY + barHeight - breakY - breakGap/2}" fill="${fillColor}" rx="2"/>`;

            // Zickzack-Linien (weiß hinterlegt)
            const segW = barWidth / 3;
            const zigzagPath1 = 'M ' + barX + ' ' + (breakY - breakGap/2 + 2) + ' L ' + (barX + segW) + ' ' + (breakY - breakGap/2 + 2 - zigzagAmplitude) + ' L ' + (barX + 2*segW) + ' ' + (breakY - breakGap/2 + 2 + zigzagAmplitude) + ' L ' + (barX + barWidth) + ' ' + (breakY - breakGap/2 + 2);
            const zigzagPath2 = 'M ' + barX + ' ' + (breakY + breakGap/2 - 2) + ' L ' + (barX + segW) + ' ' + (breakY + breakGap/2 - 2 - zigzagAmplitude) + ' L ' + (barX + 2*segW) + ' ' + (breakY + breakGap/2 - 2 + zigzagAmplitude) + ' L ' + (barX + barWidth) + ' ' + (breakY + breakGap/2 - 2);

            svgContent += '<rect x="' + (barX - 2) + '" y="' + (breakY - breakGap/2 - 2) + '" width="' + (barWidth + 4) + '" height="' + (breakGap + 4) + '" fill="white"/>';
            svgContent += '<path d="' + zigzagPath1 + '" stroke="#666" stroke-width="1.5" fill="none"/>';
            svgContent += '<path d="' + zigzagPath2 + '" stroke="#666" stroke-width="1.5" fill="none"/>';
        } else {
            // Normaler Balken
            svgContent += `<rect class="bar" x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" fill="${fillColor}" rx="2" data-value="${bar.value}" data-label="${cleanLabel}"/>`;
        }

        // Wert-Label
        const minHeightForInsideLabel = 25;
        const barCenterX = barX + barWidth / 2;

        if ((bar.type === 'increase' || bar.type === 'decrease') && barHeight >= minHeightForInsideLabel) {
            // Label IM Balken (für große Increase/Decrease-Balken)
            const labelY = barY + barHeight / 2;
            svgContent += `<text class="value-label-inside" x="${barCenterX}" y="${labelY}">${bar.displayValue}</text>`;
        } else if ((bar.type === 'start' || bar.type === 'end' || bar.type === 'compare') && bar.cumulative < 0) {
            // NEGATIVER Start/End/Compare-Balken: Label ÜBER der Nulllinie (nicht unter dem Balken!)
            // So vermeiden wir Überlappung mit X-Achsen-Labels
            svgContent += `<text class="value-label" x="${barCenterX}" y="${baselineY - 8}" fill="#1a1a1a">${bar.displayValue}</text>`;
        } else {
            // POSITIVES Wert-Label: ÜBER dem Balken
            svgContent += `<text class="value-label" x="${barCenterX}" y="${barY - 8}" fill="#1a1a1a">${bar.displayValue}</text>`;
        }

        // X-Achsen-Label (behandle sowohl \n als auch \\n aus API-Antworten)
        const labelStr = (bar.label || '').replace(/\\n/g, '\n');
        const lines = labelStr.split('\n');
        let labelText = `<text class="axis-label" x="${barCenterX}" y="${baselineY + 20}" fill="#333">`;
        lines.forEach((line, i) => {
            labelText += `<tspan x="${barCenterX}" dy="${i === 0 ? 0 : 14}">${line}</tspan>`;
        });
        labelText += '</text>';
        svgContent += labelText;
    });

    // Bracket-Annotation
    if (config.bracket && config.bracket.show) {
        const startBar = barData[config.bracket.fromIndex];
        const endBar = barData[config.bracket.toIndex];

        if (startBar && endBar) {
            const startX = getBarX(config.bracket.fromIndex) + barWidth / 2;
            const endX = getBarX(config.bracket.toIndex) + barWidth / 2;
            const centerX = (startX + endX) / 2;

            // KRITISCH: Finde den HÖCHSTEN Punkt (niedrigster Y-Wert) aller Balken
            // zwischen Start und End, damit das Bracket darüber liegt!
            let highestBarY = Infinity;
            for (let i = config.bracket.fromIndex; i <= config.bracket.toIndex; i++) {
                const bar = barData[i];
                let barTopY;

                if (bar.type === 'start' || bar.type === 'end' || bar.type === 'compare') {
                    barTopY = yScale(bar.cumulative);
                } else if (bar.type === 'increase') {
                    barTopY = yScale(bar.cumulative);  // Oberkante nach Erhöhung
                } else if (bar.type === 'decrease') {
                    barTopY = yScale(bar.startY);  // Oberkante ist der Start-Wert
                }

                if (barTopY < highestBarY) {
                    highestBarY = barTopY;
                }
            }

            // Sicherer Abstand: Bracket über dem höchsten Balken + Label-Höhe + Puffer
            // WICHTIG: Genug Abstand, damit keine Überlappung mit Wert-Labels UND Category-Brackets!
            const valueLabelHeight = 25;  // Höhe des Wert-Labels
            let bracketGap = 30;          // Mindestabstand zwischen Elementen

            // WENN Category-Brackets vorhanden sind, brauchen wir MEHR Platz!
            // Category-Brackets nehmen ca. 45px ein (Bubble 16px + Description 10px + Abstände)
            if (config.categoryBrackets && config.categoryBrackets.length > 0) {
                bracketGap = 75;  // Viel mehr Platz für Category-Brackets
            }

            // Bracket-Y ist über dem höchsten Punkt mit ausreichend Abstand
            const bracketY = Math.min(
                highestBarY - valueLabelHeight - bracketGap - 20,
                margin.top + 10  // Nicht zu weit oben
            );

            // Vertikale Linien starten von der Bracket-Höhe
            // und enden OBERHALB der Wert-Labels (mit Sicherheitsabstand)
            const startBarY = yScale(startBar.cumulative);
            const endBarY = yScale(endBar.cumulative);

            // Prüfe ob am Start- oder End-Balken ein Category-Bracket ist
            // NUR dann größeren Offset verwenden, sonst direkt über dem Wert-Label enden
            const hasStartCategoryBracket = config.categoryBrackets?.some(cb => cb.barIndex === config.bracket.fromIndex);
            const hasEndCategoryBracket = config.categoryBrackets?.some(cb => cb.barIndex === config.bracket.toIndex);

            // Offset nur dort erhöhen, wo tatsächlich ein Category-Bracket ist
            const startCategoryOffset = hasStartCategoryBracket ? 50 : 12;
            const endCategoryOffset = hasEndCategoryBracket ? 50 : 12;

            // Start-Linie endet oberhalb des Wert-Labels (oder Category-Brackets wenn vorhanden)
            const startLabelY = startBarY - valueLabelHeight - startCategoryOffset;
            // End-Pfeil endet oberhalb des Wert-Labels (oder Category-Brackets wenn vorhanden)
            const endLabelY = endBarY - valueLabelHeight - endCategoryOffset;

            const bubbleWidth = 90;  // Breiter für längere Labels
            const bubbleHeight = 24;

            // Linke vertikale Linie
            svgContent += `<line class="bracket-line" x1="${startX}" y1="${startLabelY}" x2="${startX}" y2="${bracketY}" stroke="${colors.connector}"/>`;

            // Horizontale gestrichelte Linie links
            svgContent += `<line class="bracket-line-dashed" x1="${startX}" y1="${bracketY}" x2="${centerX - bubbleWidth/2 - 5}" y2="${bracketY}" stroke="${colors.connector}" stroke-dasharray="4,3"/>`;

            // Bubble
            svgContent += `<ellipse class="bracket-bubble" cx="${centerX}" cy="${bracketY}" rx="${bubbleWidth/2}" ry="${bubbleHeight/2}" stroke="${colors.connector}" fill="white"/>`;
            svgContent += `<text class="bracket-label" x="${centerX}" y="${bracketY + 1}" fill="#1a1a1a">${config.bracket.label}</text>`;

            // Horizontale gestrichelte Linie rechts
            svgContent += `<line class="bracket-line-dashed" x1="${centerX + bubbleWidth/2 + 5}" y1="${bracketY}" x2="${endX}" y2="${bracketY}" stroke="${colors.connector}" stroke-dasharray="4,3"/>`;

            // Rechte vertikale Linie + Pfeil
            // WICHTIG: Pfeilspitze endet OBERHALB des Wert-Labels!
            const arrowTipY = endLabelY;
            svgContent += `<line class="bracket-line" x1="${endX}" y1="${bracketY}" x2="${endX}" y2="${arrowTipY + 8}" stroke="${colors.connector}"/>`;
            svgContent += `<polygon class="arrow-head" points="${endX},${arrowTipY} ${endX-5},${arrowTipY - 8} ${endX+5},${arrowTipY - 8}" fill="${colors.connector}"/>`;
        }
    }

    // =====================================================
    // CATEGORY-BRACKETS: Prozentuale Anteile über einzelnen Balken
    // Zeigt z.B.: "62,3% der Gesamtkosten" oder "51,2% vom Umsatz"
    // Darstellung: Beschreibung + Bubble DIREKT über dem Wert-Label
    // WICHTIG: Muss UNTER dem Haupt-Bracket bleiben (wenn vorhanden)!
    // =====================================================
    if (config.categoryBrackets && config.categoryBrackets.length > 0) {
        // Bubble-Größe (einheitlich für alle)
        const catBubbleHeight = 16;

        config.categoryBrackets.forEach((cb) => {
            const bar = barData[cb.barIndex];
            if (bar) {
                const barX = getBarX(cb.barIndex);
                const barCenterX = barX + barWidth / 2;

                // Position: oberhalb des Balkens
                let barTopY;
                if (bar.type === 'start' || bar.type === 'end' || bar.type === 'compare') {
                    barTopY = yScale(bar.cumulative);
                } else if (bar.type === 'increase') {
                    barTopY = yScale(bar.cumulative);
                } else if (bar.type === 'decrease') {
                    barTopY = yScale(bar.startY);
                }

                // Wert-Label ist ca. 8px über Balkenkante
                // Category-Bracket kommt DIREKT über dem Wert-Label
                // Layout von unten nach oben:
                // 1. Balkenkante (barTopY)
                // 2. Wert-Label (barTopY - 8)
                // 3. Category-Bubble (barTopY - 8 - 18 = barTopY - 26)
                // 4. Description Text (barTopY - 26 - 8 - 5 = barTopY - 39)

                const valueLabelY = barTopY - 8;  // Wert-Label Position
                const bubbleY = valueLabelY - 18 - catBubbleHeight/2;  // Bubble über Wert-Label

                // Bubble-Größe dynamisch basierend auf Label-Länge
                const labelText = cb.label || '';
                const bubbleWidth = Math.max(40, labelText.length * 7 + 14);

                // Beschreibung ÜBER der Bubble (wenn vorhanden)
                if (cb.description) {
                    svgContent += `<text class="category-bracket-desc" x="${barCenterX}" y="${bubbleY - catBubbleHeight/2 - 3}"
                        text-anchor="middle" font-size="9" fill="#666">${cb.description}</text>`;
                }

                // Runde Bubble
                svgContent += `<ellipse class="category-bracket-bubble"
                    cx="${barCenterX}" cy="${bubbleY}"
                    rx="${bubbleWidth/2}" ry="${catBubbleHeight/2}"
                    stroke="#666" stroke-width="1" fill="white"/>`;

                // Label in der Bubble (zentriert)
                svgContent += `<text class="category-bracket-label" x="${barCenterX}" y="${bubbleY + 1}"
                    text-anchor="middle" dominant-baseline="middle" font-size="10" font-weight="600" fill="#333">${cb.label}</text>`;
            }
        });
    }

    // =====================================================
    // COMPARE-BRACKETS: Prozentuale Abweichungen zwischen End/Compare-Balken
    // Zeigt z.B.: "FC vs. BUD: +5,3%", "FC vs. VJ: +38,2%"
    // =====================================================
    if (config.compareBrackets && config.compareBrackets.length > 0) {
        // Basis-Y-Position: unterhalb der X-Achsen-Labels
        const compareBracketBaseY = baselineY + 60;
        const compareBracketSpacing = 25;  // Abstand zwischen mehreren Brackets

        config.compareBrackets.forEach((cb, cbIndex) => {
            const fromBar = barData[cb.fromIndex];
            const toBar = barData[cb.toIndex];

            if (fromBar && toBar) {
                const fromX = getBarX(cb.fromIndex) + barWidth / 2;
                const toX = getBarX(cb.toIndex) + barWidth / 2;
                const centerX = (fromX + toX) / 2;
                const bracketY = compareBracketBaseY + cbIndex * compareBracketSpacing;

                // Gestrichelte Linie zwischen den Balken
                svgContent += `<line class="compare-bracket-line" x1="${fromX}" y1="${bracketY}" x2="${toX}" y2="${bracketY}" stroke="#666" stroke-width="1" stroke-dasharray="3,2"/>`;

                // Kleine vertikale Striche an den Enden
                svgContent += `<line x1="${fromX}" y1="${bracketY - 4}" x2="${fromX}" y2="${bracketY + 4}" stroke="#666" stroke-width="1"/>`;
                svgContent += `<line x1="${toX}" y1="${bracketY - 4}" x2="${toX}" y2="${bracketY + 4}" stroke="#666" stroke-width="1"/>`;

                // Label in der Mitte (mit weißem Hintergrund für Lesbarkeit)
                const labelText = cb.description ? `${cb.label}` : cb.label;
                const labelWidth = Math.max(50, labelText.length * 7);

                // Weißer Hintergrund für das Label
                svgContent += `<rect x="${centerX - labelWidth/2 - 4}" y="${bracketY - 8}" width="${labelWidth + 8}" height="16" fill="white" rx="2"/>`;

                // Label-Text
                svgContent += `<text class="compare-bracket-label" x="${centerX}" y="${bracketY + 4}" text-anchor="middle" font-size="11" font-weight="500" fill="#333">${labelText}</text>`;

                // Optional: Beschreibung unter dem Label
                if (cb.description) {
                    svgContent += `<text class="compare-bracket-desc" x="${centerX}" y="${bracketY + 16}" text-anchor="middle" font-size="9" fill="#666">${cb.description}</text>`;
                }
            }
        });
    }

    svg.innerHTML = svgContent;
    renderedCharts[svgId] = svgContent;

    // Tooltip
    setupTooltip(svgId);
}
