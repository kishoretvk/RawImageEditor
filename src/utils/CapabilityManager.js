// CapabilityManager: Detects browser features and configures app
export function getCapabilities() {
  return {
    wasm: typeof WebAssembly !== 'undefined',
    webgl: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
      } catch { return false; }
    })(),
    indexedDB: typeof indexedDB !== 'undefined',
    fileSystemAPI: 'showSaveFilePicker' in window,
    touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    pointer: 'onpointerdown' in window,
    memory: navigator.deviceMemory || 'unknown',
    threads: typeof Worker !== 'undefined',
  };
}
