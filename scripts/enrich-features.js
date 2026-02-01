#!/usr/bin/env node
/**
 * enrich-features.js
 *
 * Enriches Waterfall chart configs with feature blocks.
 * Reads test-results-phase3-multi-szenario.json (412 configs),
 * adds features:{} blocks to all 237 waterfall variants,
 * and writes the result to test-results-phase3-with-features.json.
 *
 * Usage: node scripts/enrich-features.js
 */

const fs = require('fs');
const path = require('path');

// ─── Paths ───────────────────────────────────────────────────────────────────

const PROJECT_ROOT = path.resolve(__dirname, '..');
const INPUT_FILE = path.join(PROJECT_ROOT, '6. Bibliotheken', 'Testprotokolle', 'test-results-phase3-multi-szenario.json');
const OUTPUT_FILE = path.join(PROJECT_ROOT, '6. Bibliotheken', 'Testprotokolle', 'test-results-phase3-with-features.json');

// ─── Template Metadata ──────────────────────────────────────────────────────

const TEMPLATE_CATEGORIES = {
  structure: ['WF-01', 'WF-02', 'WF-05', 'WF-06', 'WF-07', 'WF-10'],
  variance: ['WF-03', 'WF-04', 'WF-08', 'WF-09', 'WF-12'],
  trend: ['WF-11', 'WF-13'],
  compare_bars: ['WF-14', 'WF-15', 'WF-16', 'WF-17', 'WF-18', 'WF-19']
};

function getCategory(templateId) {
  for (const [cat, ids] of Object.entries(TEMPLATE_CATEGORIES)) {
    if (ids.includes(templateId)) return cat;
  }
  return 'unknown';
}

const AVAILABLE_FEATURES = {
  'WF-01': ['bracket', 'categoryBrackets', 'scaleBreak', 'grouping', 'negativeBridges', 'arrows'],
  'WF-02': ['bracket', 'categoryBrackets', 'scaleBreak', 'grouping', 'negativeBridges', 'arrows'],
  'WF-03': ['bracket', 'scaleBreak', 'negativeBridges', 'arrows'],
  'WF-04': ['bracket', 'scaleBreak', 'benchmarkLines', 'negativeBridges', 'arrows'],
  'WF-05': ['bracket', 'categoryBrackets', 'scaleBreak', 'grouping', 'negativeBridges', 'arrows'],
  'WF-06': ['bracket', 'categoryBrackets', 'scaleBreak', 'grouping', 'negativeBridges', 'arrows'],
  'WF-07': ['bracket', 'categoryBrackets', 'scaleBreak', 'negativeBridges', 'arrows'],
  'WF-08': ['bracket', 'scaleBreak', 'negativeBridges', 'arrows'],
  'WF-09': ['bracket', 'scaleBreak', 'negativeBridges', 'arrows'],
  'WF-10': ['bracket', 'categoryBrackets', 'scaleBreak', 'grouping', 'negativeBridges', 'arrows'],
  'WF-11': ['bracket', 'negativeBridges', 'arrows'],
  'WF-12': ['bracket', 'scaleBreak', 'benchmarkLines', 'negativeBridges', 'arrows'],
  'WF-13': ['bracket', 'negativeBridges', 'arrows'],
  'WF-14': ['bracket', 'benchmarkLines', 'negativeBridges', 'arrows'],
  'WF-15': ['bracket', 'benchmarkLines', 'negativeBridges', 'arrows'],
  'WF-16': ['bracket', 'benchmarkLines', 'negativeBridges', 'arrows'],
  'WF-17': ['bracket', 'benchmarkLines', 'negativeBridges', 'arrows'],
  'WF-18': ['bracket', 'benchmarkLines', 'negativeBridges', 'arrows'],
  'WF-19': ['bracket', 'benchmarkLines', 'negativeBridges', 'arrows']
};

const FEATURE_HINTS = {
  'WF-01': { bracket: { mode: 'standard' }, categoryBrackets: { recommended: true }, grouping: { style: 'bracket' } },
  'WF-02': { bracket: { mode: 'standard' }, categoryBrackets: { recommended: true }, grouping: { style: 'bracket', recommended: true } },
  'WF-03': { bracket: { mode: 'yoy' } },
  'WF-04': { bracket: { mode: 'budget' }, benchmarkLines: { recommended: true } },
  'WF-05': { bracket: { mode: 'standard' }, categoryBrackets: { recommended: true }, grouping: { style: 'bracket' } },
  'WF-06': { bracket: { mode: 'standard' }, categoryBrackets: { recommended: true }, grouping: { style: 'bracket', recommended: true } },
  'WF-07': { bracket: { mode: 'standard' } },
  'WF-08': { bracket: { mode: 'variance' } },
  'WF-09': { bracket: { mode: 'yoy' } },
  'WF-10': { bracket: { mode: 'standard' }, categoryBrackets: { recommended: true }, grouping: { style: 'bracket', recommended: true } },
  'WF-11': { bracket: { mode: 'cagr' } },
  'WF-12': { bracket: { mode: 'fc' }, benchmarkLines: { recommended: true } },
  'WF-13': { bracket: { mode: 'cagr' } },
  'WF-14': { bracket: { mode: 'multiple', modes: ['budget', 'fc'] }, benchmarkLines: { recommended: true } },
  'WF-15': { bracket: { mode: 'multiple', modes: ['budget', 'fc'] }, benchmarkLines: { recommended: true } },
  'WF-16': { bracket: { mode: 'multiple', modes: ['yoy', 'fc'] }, benchmarkLines: { recommended: true } },
  'WF-17': { bracket: { mode: 'multiple', modes: ['yoy', 'fc'] }, benchmarkLines: { recommended: true } },
  'WF-18': { bracket: { mode: 'multiple', modes: ['fc', 'budget'] }, benchmarkLines: { recommended: true } },
  'WF-19': { bracket: { mode: 'multiple', modes: ['fc', 'budget'] }, benchmarkLines: { recommended: true } }
};

// Item count ranges from templates.json (min, max bars)
const TEMPLATE_ITEM_COUNTS = {
  'WF-01': [5, 7],   'WF-02': [10, 18],  'WF-03': [4, 10],
  'WF-04': [4, 10],   'WF-05': [5, 8],    'WF-06': [4, 8],
  'WF-07': [3, 6],    'WF-08': [5, 12],   'WF-09': [4, 8],
  'WF-10': [4, 10],   'WF-11': [4, 6],    'WF-12': [4, 8],
  'WF-13': [4, 13],   'WF-14': [4, 10],   'WF-15': [4, 10],
  'WF-16': [4, 10],   'WF-17': [4, 10],   'WF-18': [4, 10],
  'WF-19': [4, 10]
};

// ─── Feature Generation: with chartConfig data ─────────────────────────────

/**
 * Analyze actual chartConfig data to generate feature decisions.
 */
function generateFeaturesFromData(variant) {
  const { templateId, chartConfig } = variant;
  const category = getCategory(templateId);
  const available = AVAILABLE_FEATURES[templateId] || [];
  const hints = FEATURE_HINTS[templateId] || {};
  const data = chartConfig.data;
  const barCount = data.length;

  // Find start and end bars
  const startBar = data.find(d => d.type === 'start');
  const endBar = data.find(d => d.type === 'end');
  const startValue = startBar ? startBar.value : 0;
  const endValue = endBar ? endBar.value : 0;

  // Calculate deltas (exclude start, end, subtotal)
  const deltaBars = data.filter(d => ['increase', 'decrease'].includes(d.type));
  const deltaValues = deltaBars.map(d => Math.abs(d.value));
  const avgDelta = deltaValues.length > 0
    ? deltaValues.reduce((a, b) => a + b, 0) / deltaValues.length
    : 0;
  const maxBar = Math.max(Math.abs(startValue), Math.abs(endValue), ...deltaValues);

  // Calculate change percentage
  const changePercent = startValue !== 0
    ? ((endValue - startValue) / Math.abs(startValue)) * 100
    : 0;

  // Check cumulative values for negative bridges
  let cumulativeValues = [];
  let cumulative = 0;
  for (const bar of data) {
    if (bar.type === 'start') {
      cumulative = bar.value;
    } else if (bar.type === 'subtotal' || bar.type === 'end') {
      cumulative = bar.value;
    } else {
      cumulative += bar.value;
    }
    cumulativeValues.push(cumulative);
  }
  const crossesZero = cumulativeValues.some(v => v < 0);
  const endNegative = endValue < 0;

  // Detect hierarchy/groups (subtotals indicate groups)
  const subtotals = data.filter(d => d.type === 'subtotal');
  const groupCount = subtotals.length + 1; // N subtotals create N+1 segments

  // Build features
  const features = {};

  // 1. BRACKET
  if (available.includes('bracket')) {
    const hasStart = !!startBar;
    const hasEnd = !!endBar;
    const significantChange = Math.abs(changePercent) > 5;

    if (barCount >= 4 && hasStart && hasEnd && significantChange) {
      const bracketHint = hints.bracket || {};
      const mode = bracketHint.mode || 'standard';
      const label = `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}% vs. Start`;

      features.bracket = {
        enabled: true,
        mode,
        fromIndex: 0,
        toIndex: barCount - 1,
        label,
        _reason: `${barCount} Balken, Start (${startValue}) \u2192 End (${endValue}), \u0394 = ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%`
      };

      if (mode === 'multiple' && bracketHint.modes) {
        features.bracket.modes = bracketHint.modes;
      }
    } else {
      const reasons = [];
      if (barCount < 4) reasons.push(`Nur ${barCount} Balken (min. 4)`);
      if (!hasStart) reasons.push('Kein Start-Balken');
      if (!hasEnd) reasons.push('Kein End-Balken');
      if (!significantChange) reasons.push(`\u0394 = ${changePercent.toFixed(1)}% < 5% Schwellenwert`);
      features.bracket = {
        enabled: false,
        _reason: reasons.join(', ')
      };
    }
  } else {
    features.bracket = {
      enabled: false,
      _reason: `Feature nicht verfuegbar fuer Template ${templateId}`
    };
  }

  const bracketEnabled = features.bracket && features.bracket.enabled;

  // 2. SCALE BREAK
  if (available.includes('scaleBreak')) {
    const categoryAllowed = ['structure', 'variance'].includes(category);
    const banned = ['trend', 'compare_bars'].includes(category);

    if (banned) {
      features.scaleBreak = {
        enabled: false,
        _reason: `Kategorie '${category}' verbietet scaleBreak`
      };
    } else if (categoryAllowed && avgDelta > 0 && (maxBar / avgDelta) > 3) {
      // Will be overridden later if negativeBridges is enabled
      features.scaleBreak = {
        enabled: true,
        breakAt: Math.round(avgDelta * 2),
        style: 'zigzag',
        _reason: `Start (${startValue}) vs \u00d8 Delta (${Math.round(avgDelta)}): Ratio ${(maxBar / avgDelta).toFixed(1)}x > 3x Schwellenwert`
      };
    } else {
      const reasons = [];
      if (!categoryAllowed) reasons.push(`Kategorie '${category}' nicht optimal`);
      if (avgDelta === 0) reasons.push('Keine Delta-Balken');
      if (avgDelta > 0 && (maxBar / avgDelta) <= 3) reasons.push(`Ratio ${(maxBar / avgDelta).toFixed(1)}x <= 3x Schwellenwert`);
      features.scaleBreak = {
        enabled: false,
        _reason: reasons.join(', ') || 'Verhaeltnis Start/Deltas nicht gross genug'
      };
    }
  } else {
    features.scaleBreak = {
      enabled: false,
      _reason: `Feature nicht verfuegbar fuer Template ${templateId}`
    };
  }

  // 3. CATEGORY BRACKETS
  if (available.includes('categoryBrackets')) {
    const categoryAllowed = category === 'structure';
    const banned = ['trend', 'variance', 'compare_bars'].includes(category);
    const hierarchyDetected = groupCount >= 2;

    if (banned) {
      features.categoryBrackets = {
        enabled: false,
        _reason: `Kategorie '${category}' verbietet categoryBrackets`
      };
    } else if (categoryAllowed && hierarchyDetected && subtotals.length >= 1) {
      // Build category items from subtotals
      const items = [];
      let prevSubtotalIdx = 0;
      for (let i = 0; i < data.length; i++) {
        if (data[i].type === 'subtotal') {
          const groupBars = data.slice(prevSubtotalIdx + 1, i).filter(d => ['increase', 'decrease'].includes(d.type));
          if (groupBars.length > 0) {
            const groupSum = groupBars.reduce((s, b) => s + b.value, 0);
            const pctOfStart = startValue !== 0 ? ((groupSum / Math.abs(startValue)) * 100).toFixed(1) : '0.0';
            items.push({
              barIndexStart: prevSubtotalIdx + 1,
              barIndexEnd: i - 1,
              label: `${pctOfStart}%`,
              description: data[i].label
            });
          }
          prevSubtotalIdx = i;
        }
      }

      if (items.length >= 2) {
        features.categoryBrackets = {
          enabled: true,
          items,
          _reason: `${items.length} Gruppen erkannt in Struktur-Template mit Hierarchie`
        };
      } else {
        features.categoryBrackets = {
          enabled: false,
          _reason: 'Zu wenige erkennbare Gruppen fuer Anteil-Annotationen'
        };
      }
    } else {
      features.categoryBrackets = {
        enabled: false,
        _reason: !categoryAllowed
          ? `Kategorie '${category}' nicht geeignet`
          : 'Zu wenige erkennbare Gruppen fuer Anteil-Annotationen'
      };
    }
  } else {
    features.categoryBrackets = {
      enabled: false,
      _reason: `Feature nicht verfuegbar fuer Template ${templateId}`
    };
  }

  // 4. ARROWS
  if (available.includes('arrows')) {
    if (bracketEnabled) {
      features.arrows = {
        enabled: false,
        _reason: 'Bracket hat Prioritaet'
      };
    } else {
      features.arrows = {
        enabled: false,
        _reason: 'Kein spezifischer Vergleich identifiziert'
      };
    }
  } else {
    features.arrows = {
      enabled: false,
      _reason: `Feature nicht verfuegbar fuer Template ${templateId}`
    };
  }

  // 5. BENCHMARK LINES
  if (available.includes('benchmarkLines')) {
    // Only for WF-04, WF-12, WF-14 to WF-19
    const hasTargetScenario = chartConfig.metadata &&
      (chartConfig.metadata.perspective || '').match(/budget|target|plan|fc|forecast/i);

    if (hints.benchmarkLines && hints.benchmarkLines.recommended && hasTargetScenario) {
      features.benchmarkLines = {
        enabled: true,
        _reason: `Template ${templateId} empfiehlt benchmarkLines, Szenario-Vergleich erkannt`
      };
    } else {
      features.benchmarkLines = {
        enabled: false,
        _reason: 'Keine expliziten Zielwerte in den Daten'
      };
    }
  } else {
    features.benchmarkLines = {
      enabled: false,
      _reason: `Feature nicht verfuegbar fuer Template ${templateId}`
    };
  }

  // 6. NEGATIVE BRIDGES
  if (available.includes('negativeBridges')) {
    if (crossesZero || endNegative) {
      features.negativeBridges = {
        enabled: true,
        _reason: crossesZero
          ? 'Kumulative Werte kreuzen die Nulllinie'
          : `Endwert negativ (${endValue})`
      };
      // CONFLICT: negativeBridges wins over scaleBreak
      if (features.scaleBreak && features.scaleBreak.enabled) {
        features.scaleBreak.enabled = false;
        features.scaleBreak._reason = 'Deaktiviert wegen Konflikt mit negativeBridges (negativeBridges hat Prioritaet)';
        delete features.scaleBreak.breakAt;
        delete features.scaleBreak.style;
      }
    } else {
      features.negativeBridges = {
        enabled: false,
        _reason: 'Alle kumulativen Werte positiv'
      };
    }
  } else {
    features.negativeBridges = {
      enabled: false,
      _reason: `Feature nicht verfuegbar fuer Template ${templateId}`
    };
  }

  // 7. GROUPING
  if (available.includes('grouping')) {
    const categoryAllowed = category === 'structure';
    const banned = ['trend', 'variance', 'compare_bars'].includes(category);
    const enoughBars = barCount >= 6;
    const hasGroups = groupCount >= 2;

    if (banned) {
      features.grouping = {
        enabled: false,
        _reason: `Kategorie '${category}' verbietet grouping`
      };
    } else if (categoryAllowed && enoughBars && hasGroups) {
      // Build groups from subtotals
      const groups = [];
      let groupStartIdx = 0;
      for (let i = 0; i < data.length; i++) {
        if (data[i].type === 'subtotal' || data[i].type === 'end') {
          if (i > groupStartIdx) {
            const groupLabel = data[i].type === 'subtotal' ? data[i].label : data[i].label;
            groups.push({
              label: groupLabel,
              fromIndex: groupStartIdx,
              toIndex: i
            });
          }
          groupStartIdx = i + 1;
        }
      }

      if (groups.length >= 2) {
        const style = (hints.grouping && hints.grouping.style) || 'bracket';
        features.grouping = {
          enabled: true,
          style,
          groups,
          _reason: `${groups.length} Gruppen, ${barCount} Balken, Hierarchie erkannt`
        };
      } else {
        features.grouping = {
          enabled: false,
          _reason: `Zu wenige Gruppen (${groups.length}) fuer Gruppierung`
        };
      }
    } else {
      const reasons = [];
      if (!categoryAllowed) reasons.push(`Kategorie '${category}' nicht geeignet`);
      if (!enoughBars) reasons.push(`Zu wenige Balken (${barCount}), Gruppierung hat keinen Mehrwert`);
      if (!hasGroups) reasons.push('Keine Hierarchie erkannt');
      features.grouping = {
        enabled: false,
        _reason: reasons.join(', ')
      };
    }
  } else {
    features.grouping = {
      enabled: false,
      _reason: `Feature nicht verfuegbar fuer Template ${templateId}`
    };
  }

  return features;
}

// ─── Feature Generation: heuristic (no chartConfig) ────────────────────────

/**
 * Generate features using heuristics when no chartConfig data is available.
 */
function generateFeaturesHeuristic(variant) {
  const { templateId, perspective } = variant;
  const category = getCategory(templateId);
  const available = AVAILABLE_FEATURES[templateId] || [];
  const hints = FEATURE_HINTS[templateId] || {};
  const itemCount = TEMPLATE_ITEM_COUNTS[templateId] || [4, 8];
  const avgItems = Math.round((itemCount[0] + itemCount[1]) / 2);

  const features = {};

  // 1. BRACKET - always enable for waterfall (all templates have start/end)
  if (available.includes('bracket')) {
    const bracketHint = hints.bracket || {};
    const mode = bracketHint.mode || 'standard';

    const featureObj = {
      enabled: true,
      mode,
      fromIndex: 0,
      toIndex: avgItems - 1,
      label: 'TBD (Daten nicht verfuegbar)',
      _reason: `Heuristik: Alle Waterfall-Templates haben Start/End, ${avgItems} Balken erwartet`
    };

    if (mode === 'multiple' && bracketHint.modes) {
      featureObj.modes = bracketHint.modes;
    }

    features.bracket = featureObj;
  } else {
    features.bracket = {
      enabled: false,
      _reason: `Feature nicht verfuegbar fuer Template ${templateId}`
    };
  }

  const bracketEnabled = features.bracket && features.bracket.enabled;

  // 2. SCALE BREAK
  if (available.includes('scaleBreak')) {
    const banned = ['trend', 'compare_bars'].includes(category);

    if (banned) {
      features.scaleBreak = {
        enabled: false,
        _reason: `Kategorie '${category}' verbietet scaleBreak`
      };
    } else if (category === 'structure' && itemCount[1] >= 10) {
      // High detail structure templates likely have large start values
      features.scaleBreak = {
        enabled: true,
        breakAt: null,
        style: 'zigzag',
        _reason: `Heuristik: Struktur-Template mit hohem Detail (bis zu ${itemCount[1]} Items) - grosse Startwerte wahrscheinlich`
      };
    } else if (category === 'variance') {
      features.scaleBreak = {
        enabled: false,
        _reason: 'Heuristik: Varianz-Bridges haben typischerweise aehnliche Start/End-Werte'
      };
    } else {
      features.scaleBreak = {
        enabled: false,
        _reason: `Heuristik: Template ${templateId} hat max. ${itemCount[1]} Items, kein Skalenbruch erwartet`
      };
    }
  } else {
    features.scaleBreak = {
      enabled: false,
      _reason: `Feature nicht verfuegbar fuer Template ${templateId}`
    };
  }

  // 3. CATEGORY BRACKETS
  if (available.includes('categoryBrackets')) {
    const banned = ['trend', 'variance', 'compare_bars'].includes(category);

    if (banned) {
      features.categoryBrackets = {
        enabled: false,
        _reason: `Kategorie '${category}' verbietet categoryBrackets`
      };
    } else if (category === 'structure' && hints.categoryBrackets && hints.categoryBrackets.recommended) {
      const perspectiveIsStructure = (perspective || '').startsWith('structure');
      if (perspectiveIsStructure) {
        features.categoryBrackets = {
          enabled: true,
          items: [],
          _reason: `Heuristik: featureHints empfehlen categoryBrackets, Perspektive '${perspective}' ist Struktur`
        };
      } else {
        features.categoryBrackets = {
          enabled: false,
          _reason: `Perspektive '${perspective}' ist keine Struktur-Perspektive`
        };
      }
    } else {
      features.categoryBrackets = {
        enabled: false,
        _reason: category !== 'structure'
          ? `Kategorie '${category}' nicht geeignet`
          : 'featureHints empfehlen categoryBrackets nicht fuer dieses Template'
      };
    }
  } else {
    features.categoryBrackets = {
      enabled: false,
      _reason: `Feature nicht verfuegbar fuer Template ${templateId}`
    };
  }

  // 4. ARROWS
  if (available.includes('arrows')) {
    if (bracketEnabled) {
      features.arrows = {
        enabled: false,
        _reason: 'Bracket hat Prioritaet'
      };
    } else {
      features.arrows = {
        enabled: false,
        _reason: 'Kein spezifischer Vergleich identifiziert'
      };
    }
  } else {
    features.arrows = {
      enabled: false,
      _reason: `Feature nicht verfuegbar fuer Template ${templateId}`
    };
  }

  // 5. BENCHMARK LINES
  if (available.includes('benchmarkLines')) {
    if (category === 'compare_bars' && hints.benchmarkLines && hints.benchmarkLines.recommended) {
      features.benchmarkLines = {
        enabled: true,
        _reason: `Heuristik: Compare-Bars Template ${templateId} mit Multi-Szenario-Daten, benchmarkLines empfohlen`
      };
    } else if (hints.benchmarkLines && hints.benchmarkLines.recommended) {
      features.benchmarkLines = {
        enabled: false,
        _reason: 'Keine expliziten Zielwerte in den Daten (heuristisch nicht bestimmbar)'
      };
    } else {
      features.benchmarkLines = {
        enabled: false,
        _reason: 'Keine expliziten Zielwerte in den Daten'
      };
    }
  } else {
    features.benchmarkLines = {
      enabled: false,
      _reason: `Feature nicht verfuegbar fuer Template ${templateId}`
    };
  }

  // 6. NEGATIVE BRIDGES
  if (available.includes('negativeBridges')) {
    // Without data, most financial data is positive
    features.negativeBridges = {
      enabled: false,
      _reason: 'Heuristik: Finanzdaten sind typischerweise positiv (keine Daten zur Validierung)'
    };
  } else {
    features.negativeBridges = {
      enabled: false,
      _reason: `Feature nicht verfuegbar fuer Template ${templateId}`
    };
  }

  // Note: no conflict resolution needed for negativeBridges here since it is disabled

  // 7. GROUPING
  if (available.includes('grouping')) {
    const banned = ['trend', 'variance', 'compare_bars'].includes(category);

    if (banned) {
      features.grouping = {
        enabled: false,
        _reason: `Kategorie '${category}' verbietet grouping`
      };
    } else if (category === 'structure' && hints.grouping && hints.grouping.recommended) {
      // WF-02 (detail, 10-18 items), WF-06 (cashflow, categories), WF-10 (segment)
      const style = hints.grouping.style || 'bracket';
      features.grouping = {
        enabled: true,
        style,
        groups: [],
        _reason: `Heuristik: featureHints empfehlen Gruppierung, Template ${templateId} ist Struktur mit vielen Items`
      };
    } else if (category === 'structure' && itemCount[1] >= 8) {
      features.grouping = {
        enabled: false,
        _reason: `Gruppierung moeglich aber nicht explizit empfohlen fuer Template ${templateId}`
      };
    } else {
      const reasons = [];
      if (category !== 'structure') reasons.push(`Kategorie '${category}' nicht optimal`);
      if (itemCount[1] < 6) reasons.push(`Max. ${itemCount[1]} Items, zu wenige fuer Gruppierung`);
      features.grouping = {
        enabled: false,
        _reason: reasons.join(', ') || `Gruppierung hat keinen Mehrwert fuer Template ${templateId}`
      };
    }
  } else {
    features.grouping = {
      enabled: false,
      _reason: `Feature nicht verfuegbar fuer Template ${templateId}`
    };
  }

  return features;
}

// ─── Main Processing ────────────────────────────────────────────────────────

function main() {
  console.log('=== Waterfall Feature Enrichment ===\n');

  // Read input
  console.log(`Reading: ${path.basename(INPUT_FILE)}`);
  const raw = fs.readFileSync(INPUT_FILE, 'utf8');
  const data = JSON.parse(raw);

  if (!data.results || !Array.isArray(data.results)) {
    console.error('ERROR: No results[] array found in input file.');
    process.exit(1);
  }

  console.log(`Found ${data.results.length} result entries.\n`);

  // Stats
  const stats = {
    totalResults: data.results.length,
    waterfallResults: 0,
    nonWaterfallResults: 0,
    totalVariants: 0,
    waterfallVariants: 0,
    withChartConfig: 0,
    withoutChartConfig: 0,
    nonWaterfallVariantsInWfResult: 0,
    featuresGenerated: 0,
    featuresSkipped: 0,
    featureStats: {
      bracket: { enabled: 0, disabled: 0 },
      scaleBreak: { enabled: 0, disabled: 0 },
      categoryBrackets: { enabled: 0, disabled: 0 },
      arrows: { enabled: 0, disabled: 0 },
      benchmarkLines: { enabled: 0, disabled: 0 },
      negativeBridges: { enabled: 0, disabled: 0 },
      grouping: { enabled: 0, disabled: 0 }
    },
    templateCoverage: {},
    categoryCoverage: { structure: 0, variance: 0, trend: 0, compare_bars: 0 }
  };

  // Process each result
  for (const result of data.results) {
    // Check if this result contains any waterfall variants
    // Note: result.chartType is the PRIMARY type, but mixed results can have WF variants too
    const hasWaterfallVariants = result.variants.some(v => {
      const tid = v.templateId || '';
      return tid.startsWith('WF-');
    });

    if (!hasWaterfallVariants) {
      stats.nonWaterfallResults++;
      stats.totalVariants += result.variants.length;
      continue;
    }

    stats.waterfallResults++;

    for (const variant of result.variants) {
      stats.totalVariants++;
      const templateId = variant.templateId || '';

      // Only process WF-* templates
      if (!templateId.startsWith('WF-')) {
        stats.nonWaterfallVariantsInWfResult++;
        continue;
      }

      stats.waterfallVariants++;

      // Track template and category coverage
      if (!stats.templateCoverage[templateId]) {
        stats.templateCoverage[templateId] = 0;
      }
      stats.templateCoverage[templateId]++;

      const cat = getCategory(templateId);
      if (stats.categoryCoverage[cat] !== undefined) {
        stats.categoryCoverage[cat]++;
      }

      let features;

      if (variant.chartConfig && variant.chartConfig.data && Array.isArray(variant.chartConfig.data)) {
        // Has full chartConfig data - analyze it
        stats.withChartConfig++;
        features = generateFeaturesFromData(variant);

        // Inject features into chartConfig
        variant.chartConfig.features = features;

        console.log(`  [DATA]      fileId:${result.fileId} variant:${variant.variantId} (${templateId}) - features injected into chartConfig`);
      } else {
        // No chartConfig data - use heuristics
        stats.withoutChartConfig++;
        features = generateFeaturesHeuristic(variant);

        // Add as a new field at variant level
        variant.generatedFeatures = features;

        console.log(`  [HEURISTIC] fileId:${result.fileId} variant:${variant.variantId} (${templateId}) - generatedFeatures added`);
      }

      stats.featuresGenerated++;

      // Tally per-feature stats
      for (const [featureName, featureObj] of Object.entries(features)) {
        if (stats.featureStats[featureName]) {
          if (featureObj.enabled) {
            stats.featureStats[featureName].enabled++;
          } else {
            stats.featureStats[featureName].disabled++;
          }
        }
      }
    }
  }

  // Add enrichment metadata
  data.enrichmentMetadata = {
    script: 'enrich-features.js',
    date: new Date().toISOString().split('T')[0],
    description: 'Waterfall-Varianten mit Feature-Blocks angereichert (7 Features, ohne Footnotes)',
    features: ['bracket', 'scaleBreak', 'categoryBrackets', 'arrows', 'benchmarkLines', 'negativeBridges', 'grouping'],
    stats: {
      waterfallVariantsProcessed: stats.waterfallVariants,
      withChartConfigData: stats.withChartConfig,
      withHeuristic: stats.withoutChartConfig,
      nonWaterfallSkipped: stats.nonWaterfallResults + stats.nonWaterfallVariantsInWfResult
    }
  };

  // Write output
  console.log(`\nWriting: ${path.basename(OUTPUT_FILE)}`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2), 'utf8');

  // Print summary
  console.log('\n=== Summary ===\n');
  console.log(`Total result entries:        ${stats.totalResults}`);
  console.log(`  Waterfall results:         ${stats.waterfallResults}`);
  console.log(`  Non-waterfall results:     ${stats.nonWaterfallResults}`);
  console.log(`Total variants scanned:      ${stats.totalVariants}`);
  console.log(`  Waterfall variants:        ${stats.waterfallVariants}`);
  console.log(`    With chartConfig data:   ${stats.withChartConfig}`);
  console.log(`    Heuristic (no data):     ${stats.withoutChartConfig}`);
  console.log(`  Non-WF in WF results:      ${stats.nonWaterfallVariantsInWfResult}`);
  console.log(`Features generated:          ${stats.featuresGenerated}`);

  console.log('\n--- Feature Activation Rates ---\n');
  const featureOrder = ['bracket', 'scaleBreak', 'categoryBrackets', 'arrows', 'benchmarkLines', 'negativeBridges', 'grouping'];
  for (const f of featureOrder) {
    const s = stats.featureStats[f];
    const total = s.enabled + s.disabled;
    const pct = total > 0 ? ((s.enabled / total) * 100).toFixed(1) : '0.0';
    console.log(`  ${f.padEnd(20)} enabled: ${String(s.enabled).padStart(4)}  disabled: ${String(s.disabled).padStart(4)}  rate: ${pct}%`);
  }

  console.log('\n--- Template Coverage ---\n');
  const sortedTemplates = Object.entries(stats.templateCoverage).sort((a, b) => a[0].localeCompare(b[0]));
  for (const [tid, count] of sortedTemplates) {
    console.log(`  ${tid}: ${count} variants`);
  }

  console.log('\n--- Category Distribution ---\n');
  for (const [cat, count] of Object.entries(stats.categoryCoverage)) {
    console.log(`  ${cat.padEnd(15)} ${count} variants`);
  }

  console.log(`\nOutput saved to: ${OUTPUT_FILE}`);
  console.log('\nDone.');
}

main();
