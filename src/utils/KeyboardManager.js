// KeyboardManager.js
// Manages global keyboard shortcuts
export function registerShortcuts(map) {
  // map: { key: callback }
  Object.entries(map).forEach(([key, callback]) => {
    window.addEventListener('keydown', e => {
      if (e.key.toLowerCase() === key.toLowerCase()) {
        callback(e);
      }
    });
  });
}
