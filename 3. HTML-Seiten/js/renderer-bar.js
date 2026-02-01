// =====================================================
// BAR CHART RENDERING
// =====================================================

// Hilfsfunktion: Automatische Farbabstufung für IST-Perioden (Grautöne)
function applyAutoGradientColors(periods) {
    // Zähle IST-Perioden
    const istIndices = [];
    periods.forEach((p, idx) => {
        const type = (p.type || '').toUpperCase();
        if (!['PLAN', 'BUD', 'BUDGET', 'FORECAST', 'FC', 'PROJ'].includes(type)) {
            istIndices.push(idx);
        }
    });

    // Wenn mehr als 2 IST-Perioden und keine individuelle Farbabstufung erkennbar
    if (istIndices.length >= 3) {
        const firstIstColor = periods[istIndices[0]].color;
        const allSameColor = istIndices.every(idx => periods[idx].color === firstIstColor);

        if (allSameColor) {
            // Automatische Graustufen-Abstufung: hell → dunkel
            const grayScale = ['#E0E0E0', '#CCCCCC', '#B0B0B0', '#999999', '#808080', '#666666', '#4D4D4D', '#333333'];

            istIndices.forEach((periodIdx, i) => {
                const colorIdx = Math.min(Math.floor(i / istIndices.length * grayScale.length), grayScale.length - 1);
                periods[periodIdx].color = grayScale[colorIdx];
            });
        }
    }

    return periods;
}

function renderBarChart(svgId, config) {
    const svg = document.getElementById(svgId);

    // Validierung: Prüfe ob benötigte Felder vorhanden sind
    if (!config.categories || !Array.isArray(config.categories) || config.categories.length === 0) {
        console.error('renderBarChart: Keine categories in config', config);
        if (svg) {
            svg.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="#666" font-size="14">Keine Daten für Bar-Chart verfügbar (fehlende categories)</text>`;
        }
        return;
    }
    if (!config.periods || !Array.isArray(config.periods) || config.periods.length === 0) {
        console.error('renderBarChart: Keine periods in config', config);
        if (svg) {
            svg.innerHTML = `<text x="50%" y="50%" text-anchor="middle" fill="#666" font-size="14">Keine Daten für Bar-Chart verfügbar (fehlende periods)</text>`;
        }
        return;
    }

    // Automatische Farbabstufung anwenden (falls nicht bereits definiert)
    config.periods = applyAutoGradientColors(config.periods);

    const width = 1200;  // Breitformat für Charts
    const height = 500;  // Kompaktere Höhe für Charts
    const numCategories = config.categories.length;

    // Bei mehreren Kategorien: mehr Platz oben für Kategorie-Überschriften
    const margin = {
        top: numCategories > 1 ? 100 : 80,
        right: 60,
        bottom: 80,
        left: 60
    };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const numPeriods = config.periods.length;
    const groupWidth = chartWidth / numCategories;

    // WICHTIG: FESTE Balkenbreite für Konsistenz zwischen allen Charts!
    const barWidth = 35;  // Feste Breite in Pixel - NICHT dynamisch berechnen!
    const barGap = 6;     // Fester Abstand zwischen Balken einer Gruppe

    const maxValue = Math.max(...config.categories.flatMap(c => c.values));
    const scale = chartHeight / (maxValue * 1.3);

    let svgContent = '';

    config.categories.forEach((category, catIndex) => {
        const groupCenterX = margin.left + groupWidth * catIndex + groupWidth / 2;
        const totalBarsWidth = numPeriods * barWidth + (numPeriods - 1) * barGap;
        const barsStartX = groupCenterX - totalBarsWidth / 2;

        const barPositions = [];

        category.values.forEach((value, periodIndex) => {
            const barHeight = value * scale;
            const barX = barsStartX + periodIndex * (barWidth + barGap);
            const barY = margin.top + chartHeight - barHeight;
            const color = config.periods[periodIndex].color;
            const periodType = (config.periods[periodIndex].type || '').toUpperCase();

            // Prüfe ob Forecast/Plan/Budget → gestrichelter Rand
            const isForecast = ['PLAN', 'BUD', 'BUDGET', 'FORECAST', 'FC', 'PROJ'].includes(periodType);

            barPositions.push({ x: barX, y: barY, width: barWidth, height: barHeight, value });

            if (isForecast) {
                // Forecast-Balken: gestrichelter Rand (wie im Think-Cell Beispiel)
                svgContent += `<rect class="bar" x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" fill="${color}" fill-opacity="0.3" rx="2" data-category="${category.name}" data-period="${config.periods[periodIndex].label}" data-value="${value}"/>`;
                svgContent += `<rect class="bar" x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="4,2" rx="2"/>`;
            } else {
                // Normale Balken: solid
                svgContent += `<rect class="bar" x="${barX}" y="${barY}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="2" data-category="${category.name}" data-period="${config.periods[periodIndex].label}" data-value="${value}"/>`;
            }

            const labelX = barX + barWidth / 2;
            svgContent += `<text x="${labelX}" y="${barY - 8}" class="value-label" fill="#1a1a1a">${value.toLocaleString('de-DE')}</text>`;

            // X-Achsen-Label: Intelligent aufteilen
            const periodLabel = config.periods[periodIndex].label;
            const labelY = margin.top + chartHeight + 20;

            // Versuche Jahr und Typ zu extrahieren (z.B. "2026 PLAN", "2026PLAN", "2026 BUD")
            const yearMatch = periodLabel.match(/^(\d{4})\s*(.*)$/);

            if (yearMatch && yearMatch[2]) {
                // Label hat Jahr + Zusatz (z.B. "2026 PLAN" oder "2026PLAN")
                const year = yearMatch[1];
                const typePart = yearMatch[2].trim();

                // Prüfe ob vorheriges Label das gleiche Jahr hat
                const prevLabel = periodIndex > 0 ? config.periods[periodIndex - 1].label : '';
                const prevYearMatch = prevLabel.match(/^(\d{4})/);
                const prevYear = prevYearMatch ? prevYearMatch[1] : '';
                const skipYear = (prevYear === year);

                svgContent += `<text x="${labelX}" y="${labelY}" class="axis-label" fill="#666" text-anchor="middle" font-size="9">`;
                if (skipYear) {
                    // Nur den Typ anzeigen (PLAN, BUDGET, etc.) - kein Jahr
                    svgContent += `<tspan x="${labelX}" dy="0">${typePart}</tspan>`;
                } else {
                    // Jahr und Typ auf zwei Zeilen
                    svgContent += `<tspan x="${labelX}" dy="0">${year}</tspan>`;
                    svgContent += `<tspan x="${labelX}" dy="10">${typePart}</tspan>`;
                }
                svgContent += `</text>`;
            } else {
                // Einfaches Label ohne Jahr+Typ Struktur
                svgContent += `<text x="${labelX}" y="${labelY}" class="axis-label" fill="#666" text-anchor="middle">${periodLabel}</text>`;
            }
        });

        // Brackets - SELEKTIV: Nur zwischen bestimmten Balken anzeigen
        // Option 1: config.brackets[] Array mit {fromIndex, toIndex} definiert → nur diese Brackets
        // Option 2: config.showAllBrackets = true → alle Brackets (Standard: false bei > 4 Perioden)
        // Option 3: Automatik: Bei <= 4 Perioden alle, bei > 4 nur erster→letzter IST + letzter IST→erster Forecast

        let highestBracketY = margin.top;

        // Bestimme welche Brackets gezeigt werden sollen
        let bracketsToShow = [];

        if (config.brackets && Array.isArray(config.brackets)) {
            // Explizit definierte Brackets
            bracketsToShow = config.brackets;
        } else if (config.showAllBrackets === true || numPeriods <= 4) {
            // Alle Brackets zeigen (bei wenigen Perioden oder explizit gewünscht)
            for (let i = 0; i < barPositions.length - 1; i++) {
                bracketsToShow.push({ fromIndex: i, toIndex: i + 1 });
            }
        } else {
            // Automatische Auswahl: Nur strategische Brackets
            // 1. Erster → Letzter IST-Wert
            // 2. Letzter IST → Erster Forecast (falls vorhanden)
            const istIndices = [];
            const forecastIndices = [];

            config.periods.forEach((p, idx) => {
                const type = (p.type || '').toUpperCase();
                if (['PLAN', 'BUD', 'BUDGET', 'FORECAST', 'FC', 'PROJ'].includes(type)) {
                    forecastIndices.push(idx);
                } else {
                    istIndices.push(idx);
                }
            });

            // Bracket vom ersten zum letzten IST-Wert
            if (istIndices.length >= 2) {
                bracketsToShow.push({ fromIndex: istIndices[0], toIndex: istIndices[istIndices.length - 1] });
            }

            // Bracket vom letzten IST zum ersten Forecast
            if (istIndices.length > 0 && forecastIndices.length > 0) {
                bracketsToShow.push({ fromIndex: istIndices[istIndices.length - 1], toIndex: forecastIndices[0] });
            }

            // Falls nur Forecasts: Erster → Letzter
            if (istIndices.length === 0 && forecastIndices.length >= 2) {
                bracketsToShow.push({ fromIndex: forecastIndices[0], toIndex: forecastIndices[forecastIndices.length - 1] });
            }
        }

        // Brackets rendern
        bracketsToShow.forEach(bracket => {
            const fromIdx = bracket.fromIndex;
            const toIdx = bracket.toIndex;

            if (fromIdx < 0 || toIdx >= barPositions.length || fromIdx >= toIdx) return;

            const bar1 = barPositions[fromIdx];
            const bar2 = barPositions[toIdx];

            const change = ((bar2.value - bar1.value) / bar1.value * 100).toFixed(0);
            const changeText = change >= 0 ? `+${change}%` : `${change}%`;

            const labelHeight = 15;
            const labelGap = 8;
            const labelTop1 = bar1.y - labelGap - labelHeight;
            const labelTop2 = bar2.y - labelGap - labelHeight;
            const higherLabelTop = Math.min(labelTop1, labelTop2);

            const bubbleHeight = 18;
            const bubbleY = higherLabelTop - 8 - bubbleHeight;
            const bubbleCenterY = bubbleY + bubbleHeight / 2;

            if (bubbleY < highestBracketY) {
                highestBracketY = bubbleY;
            }

            const x1 = bar1.x + bar1.width / 2;
            const x2 = bar2.x + bar2.width / 2;
            const bubbleCenterX = (x1 + x2) / 2;

            // Dynamische Bubble-Breite basierend auf Text
            const bubbleWidth = Math.max(38, changeText.length * 7 + 16);

            // Linke vertikale Linie (von Label1 zur Bubble-Höhe)
            svgContent += `<line class="bracket-line" x1="${x1}" y1="${labelTop1}" x2="${x1}" y2="${bubbleCenterY}" stroke="#333"/>`;
            // Horizontale Linie links zur Bubble
            svgContent += `<line class="bracket-line" x1="${x1}" y1="${bubbleCenterY}" x2="${bubbleCenterX - bubbleWidth/2}" y2="${bubbleCenterY}" stroke="#333"/>`;
            // Bubble
            svgContent += `<rect class="bracket-bubble" x="${bubbleCenterX - bubbleWidth/2}" y="${bubbleY}" width="${bubbleWidth}" height="${bubbleHeight}" rx="9" stroke="#333"/>`;
            svgContent += `<text x="${bubbleCenterX}" y="${bubbleCenterY}" class="change-label">${changeText}</text>`;
            // Horizontale Linie rechts von Bubble
            svgContent += `<line class="bracket-line" x1="${bubbleCenterX + bubbleWidth/2}" y1="${bubbleCenterY}" x2="${x2}" y2="${bubbleCenterY}" stroke="#333"/>`;

            // Rechte vertikale Linie + Pfeil
            // labelTop2 ist die Oberkante des Ziel-Labels
            // bubbleCenterY ist die horizontale Bracket-Linie

            // Bestimme ob Pfeil nach oben oder unten zeigt
            const goingDown = bubbleCenterY < labelTop2;  // Bubble ist höher → Pfeil geht nach unten

            if (goingDown) {
                // Pfeil zeigt nach UNTEN (Bubble ist oberhalb des Ziels)
                const lineEndY = labelTop2 - 6;
                const arrowTipY = labelTop2 - 2;
                svgContent += `<line class="bracket-line" x1="${x2}" y1="${bubbleCenterY}" x2="${x2}" y2="${lineEndY}" stroke="#333"/>`;
                // Dreieck: Basis oben, Spitze unten
                svgContent += `<polygon class="arrow-head" points="${x2-4},${lineEndY} ${x2+4},${lineEndY} ${x2},${arrowTipY}"/>`;
            } else {
                // Pfeil zeigt nach OBEN (Zielbalken ist höher, Label ist oberhalb der Bubble)
                const lineEndY = labelTop2 + 6;
                const arrowTipY = labelTop2 + 2;
                svgContent += `<line class="bracket-line" x1="${x2}" y1="${bubbleCenterY}" x2="${x2}" y2="${lineEndY}" stroke="#333"/>`;
                // Dreieck: Basis unten, Spitze oben
                svgContent += `<polygon class="arrow-head" points="${x2-4},${lineEndY} ${x2+4},${lineEndY} ${x2},${arrowTipY}"/>`;
            }
        });

        // KATEGORIE-ÜBERSCHRIFT (bei mehreren Kategorien)
        if (numCategories > 1 && category.name) {
            // Position: OBERHALB der Brackets mit Abstand
            const categoryTitleY = Math.min(highestBracketY - 15, margin.top - 25);

            svgContent += `<text x="${groupCenterX}" y="${categoryTitleY}"
                text-anchor="middle" font-weight="bold" font-size="14px" fill="#1a1a1a">${category.name}</text>`;

            // Optional: Untertitel
            if (category.subtitle) {
                svgContent += `<text x="${groupCenterX}" y="${categoryTitleY + 14}"
                    text-anchor="middle" font-size="11px" fill="#666">${category.subtitle}</text>`;
            }
        }
    });

    // Legende - NUR anzeigen wenn es unterschiedliche Typen gibt (IST, PLAN, BUD, etc.)
    // NICHT die gleichen Labels wie unter den Balken wiederholen!
    const periodTypes = [...new Set(config.periods.map(p => p.type || 'default'))];
    const hasDistinctTypes = periodTypes.length > 1 || (periodTypes.length === 1 && periodTypes[0] !== 'default');

    if (hasDistinctTypes) {
        // Gruppiere Perioden nach Typ für kompakte Legende
        const typeGroups = {};
        config.periods.forEach(period => {
            const type = period.type || 'Werte';
            if (!typeGroups[type]) {
                typeGroups[type] = { color: period.color, label: type };
            }
        });

        const legendY = height - 30;
        const legendItems = Object.values(typeGroups);
        const legendStartX = width / 2 - (legendItems.length * 90) / 2;

        legendItems.forEach((item, index) => {
            const x = legendStartX + index * 90;
            svgContent += `<rect x="${x}" y="${legendY}" width="16" height="16" fill="${item.color}" rx="2"/>`;
            svgContent += `<text x="${x + 22}" y="${legendY + 12}" class="legend-text">${item.label}</text>`;
        });
    }
    // Wenn alle Perioden den gleichen Typ haben oder kein Typ definiert ist,
    // zeigen wir KEINE Legende an - die X-Achsen-Labels reichen aus!

    svg.innerHTML = svgContent;
    renderedCharts[svgId] = svgContent;
    setupTooltip(svgId);
}
