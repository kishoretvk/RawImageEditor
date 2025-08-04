/**
 * Node definitions for the visual workflow UI.
 * Describes available node types, display names, categories, default params,
 * and a light schema for the inspector to render controls.
 */
export const NodeCategories = {
  input: 'Inputs',
  analysis: 'Analysis',
  adjustments: 'Adjustments',
  output: 'Output',
};

export const NodeTypes = {
  IngestList: {
    type: 'IngestList',
    name: 'Ingest Files',
    category: NodeCategories.input,
    defaults: () => ({
      items: [], // populated at run-time from UI file picker
    }),
    inspector: [],
  },

  ReadEXIF: {
    type: 'ReadEXIF',
    name: 'Read EXIF',
    category: NodeCategories.analysis,
    defaults: () => ({}),
    inspector: [],
  },

  ApplyPreset: {
    type: 'ApplyPreset',
    name: 'Apply Preset',
    category: NodeCategories.adjustments,
    defaults: () => ({ preset: {} }),
    inspector: [
      { key: 'preset', label: 'Preset (JSON)', type: 'json' },
    ],
  },

  AutoWB: {
    type: 'AutoWB',
    name: 'Auto White Balance',
    category: NodeCategories.adjustments,
    defaults: () => ({
      mode: 'set', // 'set' | 'region'
      leaderIndex: 0,
      rect: { x: 0.4, y: 0.4, w: 0.2, h: 0.2 },
    }),
    inspector: [
      { key: 'mode', label: 'Mode', type: 'select', options: ['set', 'region'] },
      { key: 'leaderIndex', label: 'Leader Index', type: 'number', min: 0, step: 1 },
      { key: 'rect', label: 'Region (Normalized)', type: 'region' },
    ],
  },

  SplitRGB: {
    type: 'SplitRGB',
    name: 'Split Channels (RGB)',
    category: NodeCategories.adjustments,
    defaults: () => ({
      useAdjusted: true,
      exportAll: true,
    }),
    inspector: [
      { key: 'useAdjusted', label: 'Use Adjusted Image', type: 'boolean' },
      { key: 'exportAll', label: 'Export All Channels', type: 'boolean' },
    ],
  },

  Watermark: {
    type: 'Watermark',
    name: 'Watermark',
    category: NodeCategories.output,
    defaults: () => ({
      // By default, use text watermark; can be replaced by preset-based flow
      type: 'text',
      text: '© RawImageEditor',
      fontFamily: 'Arial, sans-serif',
      fontSize: 24,
      opacity: 0.3,
      position: 'br',
      offsetX: 16,
      offsetY: 16,
      pngSrc: '',
      scale: 1.0,
      // presetId optional: when set, UI resolves it to params on run
      presetId: '',
    }),
    inspector: [
      { key: 'presetId', label: 'Watermark Preset', type: 'preset', presetType: 'watermark' },
      { key: 'type', label: 'Type', type: 'select', options: ['text', 'png'] },
      { key: 'text', label: 'Text', type: 'text' },
      { key: 'fontFamily', label: 'Font Family', type: 'text' },
      { key: 'fontSize', label: 'Font Size', type: 'number', min: 6, step: 1 },
      { key: 'opacity', label: 'Opacity', type: 'number', min: 0, max: 1, step: 0.05 },
      { key: 'position', label: 'Position', type: 'select', options: ['tl', 'tr', 'bl', 'br'] },
      { key: 'offsetX', label: 'Offset X', type: 'number', step: 1 },
      { key: 'offsetY', label: 'Offset Y', type: 'number', step: 1 },
      { key: 'pngSrc', label: 'PNG Source', type: 'text' },
      { key: 'scale', label: 'Scale', type: 'number', min: 0.1, step: 0.1 },
    ],
  },

  Export: {
    type: 'Export',
    name: 'Export',
    category: NodeCategories.output,
    defaults: () => ({
      format: 'jpeg',
      mode: 'target', // 'target' | 'quality' (UI helper only; resolved at run)
      quality: 0.9,
      targetSizeMB: 2,
      tolerancePct: 5,
      filenamePattern: '{name}_edit',
      download: true,
      presetId: '',
    }),
    inspector: [
      { key: 'presetId', label: 'Export Preset', type: 'preset', presetType: 'export' },
      { key: 'format', label: 'Format', type: 'select', options: ['jpeg', 'png', 'webp'] },
      { key: 'mode', label: 'Mode', type: 'select', options: ['target', 'quality'] },
      { key: 'quality', label: 'Quality', type: 'number', min: 0, max: 1, step: 0.01 },
      { key: 'targetSizeMB', label: 'Target Size (MB)', type: 'number', min: 0.1, step: 0.1 },
      { key: 'tolerancePct', label: 'Tolerance (%)', type: 'number', min: 1, max: 20, step: 1 },
      { key: 'filenamePattern', label: 'Filename Pattern', type: 'text' },
      { key: 'download', label: 'Download', type: 'boolean' },
    ],
  },
};

/**
 * Get a flat list for palettes grouped by category if needed.
 */
export function listNodeTypes() {
  return Object.values(NodeTypes);
}

/**
 * Utility: clone default params for a node type.
 */
export function defaultParamsFor(type) {
  const def = NodeTypes[type];
  return def ? def.defaults() : {};
}
