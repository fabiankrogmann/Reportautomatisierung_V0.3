// =====================================================
// DOWNLOAD-FUNKTIONEN
// =====================================================

// Embedded CSS Styles für SVG-Export (damit Styles auch ohne Browser funktionieren)
function getEmbeddedSVGStyles() {
    return `
        <style>
            /* Schriftarten */
            text { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; }

            /* Bar Styles */
            .bar { transition: opacity 0.2s ease; }
            .stacked-bar { cursor: pointer; }

            /* Connector Lines */
            .connector-line { stroke-width: 1; }

            /* Labels */
            .value-label { font-size: 12px; font-weight: bold; text-anchor: middle; }
            .value-label-inside { font-size: 11px; font-weight: bold; fill: white; text-anchor: middle; dominant-baseline: middle; }
            .axis-label { font-size: 11px; text-anchor: middle; }
            .segment-label { font-size: 11px; font-weight: bold; text-anchor: middle; dominant-baseline: middle; }
            .total-label { font-size: 13px; font-weight: bold; fill: #1a1a1a; text-anchor: middle; }

            /* Brackets */
            .bracket-line { stroke-width: 1.5; fill: none; }
            .bracket-line-dashed { stroke-width: 1; fill: none; }
            .bracket-bubble { fill: white; stroke-width: 1.5; }
            .bracket-label { font-size: 12px; font-weight: bold; text-anchor: middle; dominant-baseline: middle; }
            .change-label { font-size: 10px; font-weight: bold; fill: #1a1a1a; text-anchor: middle; dominant-baseline: middle; }
            .arrow-head { fill: #333; }

            .data-point { cursor: pointer; }

            /* Legend */
            .legend-text { font-size: 11px; fill: #333; }
        </style>
    `;
}

function downloadSVG(index) {
    const svgId = `chart${index}`;
    const svg = document.getElementById(svgId);
    const viewBox = svg.getAttribute('viewBox') || '0 0 1280 720';

    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
${getEmbeddedSVGStyles()}
${svg.innerHTML}
</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    downloadBlob(blob, `chart-${index + 1}.svg`);
}

function downloadPNG(index) {
    const svgId = `chart${index}`;
    const svg = document.getElementById(svgId);
    const viewBox = svg.getAttribute('viewBox') || '0 0 1280 720';
    const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);

    // Erstelle SVG mit eingebetteten Styles für korrektes Rendering
    const svgWithStyles = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
${getEmbeddedSVGStyles()}
${svg.innerHTML}
</svg>`;

    const canvas = document.createElement('canvas');
    // Höhere Auflösung für bessere Qualität (2x)
    const scale = 2;
    canvas.width = vbWidth * scale;
    canvas.height = vbHeight * scale;
    const ctx = canvas.getContext('2d');

    const svgBlob = new Blob([svgWithStyles], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = function() {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        canvas.toBlob(function(blob) {
            downloadBlob(blob, `chart-${index + 1}.png`);
        }, 'image/png');
    };
    img.src = url;
}

function downloadHTML(index) {
    const config = chartConfigs[index];
    const svg = document.getElementById('chart' + index);
    const svgContent = svg.outerHTML;
    const title = config.title || 'Chart';
    const subtitle = config.subtitle || '';

    // String-Konkatenation statt Template-Literals um Browser-Parsing-Probleme zu vermeiden
    const parts = [];
    parts.push('<!DOCTYPE html>');
    parts.push('<html lang="de">');
    parts.push('<head>');
    parts.push('<meta charset="UTF-8">');
    parts.push('<title>' + title + '<\/title>');
    parts.push('<style>');
    // Page Styles
    parts.push('body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif; background: #f5f5f5; padding: 40px; margin: 0; }');
    parts.push('.chart-container { background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); padding: 30px; max-width: 1400px; margin: 0 auto; }');
    parts.push('.chart-title { font-size: 18px; font-weight: 600; margin-bottom: 5px; color: #1a1a1a; }');
    parts.push('.chart-subtitle { font-size: 13px; color: #666; margin-bottom: 20px; }');
    parts.push('svg { width: 100%; height: auto; display: block; }');
    // SVG Element Styles
    parts.push('text { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif; }');
    parts.push('.bar { transition: opacity 0.2s ease; }');
    parts.push('.bar:hover { opacity: 0.8; cursor: pointer; }');
    parts.push('.stacked-bar { cursor: pointer; transition: opacity 0.2s ease; }');
    parts.push('.stacked-bar:hover { opacity: 0.85; }');
    parts.push('.connector-line { stroke-width: 1; }');
    parts.push('.value-label { font-size: 12px; font-weight: bold; text-anchor: middle; }');
    parts.push('.value-label-inside { font-size: 11px; font-weight: bold; fill: white; text-anchor: middle; dominant-baseline: middle; }');
    parts.push('.axis-label { font-size: 11px; text-anchor: middle; }');
    parts.push('.segment-label { font-size: 11px; font-weight: bold; text-anchor: middle; dominant-baseline: middle; pointer-events: none; }');
    parts.push('.total-label { font-size: 13px; font-weight: bold; fill: #1a1a1a; text-anchor: middle; }');
    parts.push('.bracket-line { stroke-width: 1.5; fill: none; }');
    parts.push('.bracket-line-dashed { stroke-width: 1; fill: none; }');
    parts.push('.bracket-bubble { fill: white; stroke-width: 1.5; }');
    parts.push('.bracket-label { font-size: 12px; font-weight: bold; text-anchor: middle; dominant-baseline: middle; }');
    parts.push('.change-label { font-size: 10px; font-weight: bold; fill: #1a1a1a; text-anchor: middle; dominant-baseline: middle; }');
    parts.push('.arrow-head { fill: #333; }');
    parts.push('.data-point { cursor: pointer; transition: r 0.2s ease; }');
    parts.push('.data-point:hover { r: 10 !important; }');
    parts.push('.legend-text { font-size: 11px; fill: #333; }');
    parts.push('<\/style>');
    parts.push('<\/head>');
    parts.push('<body>');
    parts.push('<div class="chart-container">');
    parts.push('<div class="chart-title">' + title + '<\/div>');
    parts.push('<div class="chart-subtitle">' + subtitle + '<\/div>');
    parts.push(svgContent);
    parts.push('<\/div>');
    parts.push('<\/body>');
    parts.push('<\/html>');

    const htmlContent = parts.join('\n');
    const blob = new Blob([htmlContent], { type: 'text/html' });
    downloadBlob(blob, 'chart-' + (index + 1) + '.html');
}

async function downloadSelectedAsZIP() {
    if (selectedChartsForExport.size === 0) {
        alert('Bitte wählen Sie mindestens einen Chart für den Export aus.');
        return;
    }

    const zip = new JSZip();

    const selectedIndices = Array.from(selectedChartsForExport).sort((a, b) => a - b);
    selectedIndices.forEach(function(index, i) {
        const svg = document.getElementById('chart' + index);
        if (!svg) return;

        const viewBox = svg.getAttribute('viewBox') || '0 0 1280 720';
        const svgParts = [];
        svgParts.push('<?xml version="1.0" encoding="UTF-8"?>');
        svgParts.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + viewBox + '">');
        svgParts.push(getEmbeddedSVGStyles());
        svgParts.push(svg.innerHTML);
        svgParts.push('<\/svg>');
        zip.file('chart-' + (i + 1) + '.svg', svgParts.join('\n'));
    });

    const blob = await zip.generateAsync({ type: 'blob' });
    downloadBlob(blob, 'selected-charts.zip');
}

// Legacy-Funktion für Kompatibilität
async function downloadAllAsZIP() {
    // Alle Charts auswählen und dann exportieren
    chartConfigs.forEach((_, index) => selectedChartsForExport.add(index));
    await downloadSelectedAsZIP();
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// =====================================================
// POWERPOINT EXPORT (PPTX)
// =====================================================
async function downloadPPTX(index) {
    const config = chartConfigs[index];
    const svg = document.getElementById('chart' + index);
    const title = config.title || 'Chart';
    const subtitle = config.subtitle || '';

    // Hole das tatsächliche SVG-Seitenverhältnis
    const viewBox = svg.getAttribute('viewBox') || '0 0 1280 720';
    const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);
    const aspectRatio = vbWidth / vbHeight;

    // Konvertiere SVG zu Base64 PNG für PowerPoint
    const pngBase64 = await svgToPngBase64(svg, 4); // 4x Auflösung

    // Erstelle PowerPoint
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = title;
    pptx.author = 'Chart Generator';

    // Füge Folie hinzu
    const slide = pptx.addSlide();

    // Titel hinzufügen
    slide.addText(title, {
        x: 0.5,
        y: 0.3,
        w: '90%',
        fontSize: 24,
        bold: true,
        color: '1a1a1a'
    });

    // Untertitel hinzufügen
    if (subtitle) {
        slide.addText(subtitle, {
            x: 0.5,
            y: 0.7,
            w: '90%',
            fontSize: 14,
            color: '666666'
        });
    }

    // Berechne Bildgröße basierend auf SVG-Seitenverhältnis
    // Folie ist 10" x 5.625" (16:9), verfügbarer Bereich ca. 9" x 4.5"
    const maxWidth = 9;
    const maxHeight = 4.3;
    let imgWidth, imgHeight;

    if (aspectRatio > maxWidth / maxHeight) {
        // Breiter als verfügbarer Bereich - an Breite anpassen
        imgWidth = maxWidth;
        imgHeight = maxWidth / aspectRatio;
    } else {
        // Höher als verfügbarer Bereich - an Höhe anpassen
        imgHeight = maxHeight;
        imgWidth = maxHeight * aspectRatio;
    }

    // Zentriere das Bild horizontal
    const imgX = (10 - imgWidth) / 2;

    // Chart als Bild hinzufügen (mit korrektem Seitenverhältnis)
    slide.addImage({
        data: pngBase64,
        x: imgX,
        y: 1.2,
        w: imgWidth,
        h: imgHeight
    });

    // Download
    pptx.writeFile({ fileName: 'chart-' + (index + 1) + '.pptx' });
}

// Hilfsfunktion: SVG zu PNG Base64
function svgToPngBase64(svg, scale = 2) {
    return new Promise((resolve, reject) => {
        const viewBox = svg.getAttribute('viewBox') || '0 0 1280 720';
        const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);

        // SVG mit eingebetteten Styles
        const svgWithStyles = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
${getEmbeddedSVGStyles()}
${svg.innerHTML}
</svg>`;

        const canvas = document.createElement('canvas');
        canvas.width = vbWidth * scale;
        canvas.height = vbHeight * scale;
        const ctx = canvas.getContext('2d');

        const svgBlob = new Blob([svgWithStyles], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        const img = new Image();
        img.onload = function() {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);

            // Als Base64 zurückgeben
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = url;
    });
}

// PNG Export mit wählbarer Auflösung (für HD-Export)
function downloadPNGHD(index) {
    const svgId = `chart${index}`;
    const svg = document.getElementById(svgId);
    const viewBox = svg.getAttribute('viewBox') || '0 0 1280 720';
    const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);

    // SVG mit eingebetteten Styles
    const svgWithStyles = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
${getEmbeddedSVGStyles()}
${svg.innerHTML}
</svg>`;

    const canvas = document.createElement('canvas');
    // 4x Auflösung für HD-Qualität
    const scale = 4;
    canvas.width = vbWidth * scale;
    canvas.height = vbHeight * scale;
    const ctx = canvas.getContext('2d');

    const svgBlob = new Blob([svgWithStyles], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = function() {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);

        canvas.toBlob(function(blob) {
            downloadBlob(blob, `chart-${index + 1}-HD.png`);
        }, 'image/png');
    };
    img.src = url;
}

// Ausgewählte Charts als PPTX (eine Folie pro Chart)
async function downloadSelectedAsPPTX() {
    if (selectedChartsForExport.size === 0) {
        alert('Bitte wählen Sie mindestens einen Chart für den Export aus.');
        return;
    }

    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = 'Chart Collection';
    pptx.author = 'Chart Generator';

    const selectedIndices = Array.from(selectedChartsForExport).sort((a, b) => a - b);

    for (const index of selectedIndices) {
        const config = chartConfigs[index];
        const svg = document.getElementById('chart' + index);
        if (!svg || !config) continue;

        const title = config.title || 'Chart ' + (index + 1);
        const subtitle = config.subtitle || '';

        // Hole das tatsächliche SVG-Seitenverhältnis
        const viewBox = svg.getAttribute('viewBox') || '0 0 1280 720';
        const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);
        const aspectRatio = vbWidth / vbHeight;

        // Konvertiere zu PNG
        const pngBase64 = await svgToPngBase64(svg, 4);

        // Neue Folie
        const slide = pptx.addSlide();

        // Titel
        slide.addText(title, {
            x: 0.5,
            y: 0.3,
            w: '90%',
            fontSize: 24,
            bold: true,
            color: '1a1a1a'
        });

        // Untertitel
        if (subtitle) {
            slide.addText(subtitle, {
                x: 0.5,
                y: 0.7,
                w: '90%',
                fontSize: 14,
                color: '666666'
            });
        }

        // Berechne Bildgröße basierend auf SVG-Seitenverhältnis
        const maxWidth = 9;
        const maxHeight = 4.3;
        let imgWidth, imgHeight;

        if (aspectRatio > maxWidth / maxHeight) {
            imgWidth = maxWidth;
            imgHeight = maxWidth / aspectRatio;
        } else {
            imgHeight = maxHeight;
            imgWidth = maxHeight * aspectRatio;
        }

        // Zentriere das Bild horizontal
        const imgX = (10 - imgWidth) / 2;

        // Chart mit korrektem Seitenverhältnis
        slide.addImage({
            data: pngBase64,
            x: imgX,
            y: 1.2,
            w: imgWidth,
            h: imgHeight
        });
    }

    // Download
    pptx.writeFile({ fileName: 'selected-charts.pptx' });
}

// Legacy-Funktion für Kompatibilität
async function downloadAllAsPPTX() {
    // Alle Charts auswählen und dann exportieren
    chartConfigs.forEach((_, index) => selectedChartsForExport.add(index));
    await downloadSelectedAsPPTX();
}
