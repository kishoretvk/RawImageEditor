/**
 * PresetStore (v1) - localStorage-backed
 * Supports two preset types initially: 'export' and 'watermark'
 * Schema:
 *  {
 *    version: 1,
 *    exportPresets: [{ id, name, settings }],
 *    watermarkPresets: [{ id, name, settings }]
 *  }
 */
const KEY = 'RIE_PRESET_STORE_V1';

function loadStore() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { version: 1, exportPresets: [], watermarkPresets: [] };
    const parsed = JSON.parse(raw);
    if (!parsed.version) return { version: 1, exportPresets: [], watermarkPresets: [] };
    // Basic shape guard
    return {
      version: 1,
      exportPresets: Array.isArray(parsed.exportPresets) ? parsed.exportPresets : [],
      watermarkPresets: Array.isArray(parsed.watermarkPresets) ? parsed.watermarkPresets : [],
    };
  } catch {
    return { version: 1, exportPresets: [], watermarkPresets: [] };
  }
}

function saveStore(store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {}
}

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const PresetStore = {
  // Generic helpers
  list(type) {
    const s = loadStore();
    if (type === 'export') return s.exportPresets;
    if (type === 'watermark') return s.watermarkPresets;
    return [];
  },

  get(type, id) {
    const all = this.list(type);
    return all.find((p) => p.id === id) || null;
  },

  save(type, preset) {
    const s = loadStore();
    const collection = type === 'export' ? s.exportPresets : type === 'watermark' ? s.watermarkPresets : null;
    if (!collection) return null;

    if (!preset.id) preset.id = genId();
    const idx = collection.findIndex((p) => p.id === preset.id);
    if (idx >= 0) {
      collection[idx] = preset;
    } else {
      collection.push(preset);
    }
    saveStore(s);
    return preset;
  },

  delete(type, id) {
    const s = loadStore();
    if (type === 'export') {
      s.exportPresets = s.exportPresets.filter((p) => p.id !== id);
    } else if (type === 'watermark') {
      s.watermarkPresets = s.watermarkPresets.filter((p) => p.id !== id);
    }
    saveStore(s);
  },
