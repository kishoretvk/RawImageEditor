// A simple preset manager that uses localStorage
class PresetManager {
  static getPresets() {
    try {
      const presets = localStorage.getItem('raw-editor-presets');
      return presets ? JSON.parse(presets) : [];
    } catch (error) {
      console.error("Could not retrieve presets", error);
      return [];
    }
  }

  static savePreset(preset) {
    try {
      const presets = PresetManager.getPresets();
      // Check if preset with same name exists, if so, update it
      const existingIndex = presets.findIndex(p => p.name === preset.name);
      if (existingIndex > -1) {
        presets[existingIndex] = preset;
      } else {
        presets.push(preset);
      }
      localStorage.setItem('raw-editor-presets', JSON.stringify(presets));
    } catch (error) {
      console.error("Could not save preset", error);
    }
  }

  static deletePreset(presetName) {
    try {
      let presets = PresetManager.getPresets();
      presets = presets.filter(p => p.name !== presetName);
      localStorage.setItem('raw-editor-presets', JSON.stringify(presets));
    } catch (error) {
      console.error("Could not delete preset", error);
    }
  }
}

export default PresetManager;
