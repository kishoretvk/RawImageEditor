// PluginRegistry.js
// Registry for plugins and hooks
export class PluginRegistry {
  constructor() {
    this.plugins = [];
  }
  register(plugin) {
    if (typeof plugin === 'object' && plugin.name) {
      this.plugins.push(plugin);
    }
  }
  getPlugins() {
    return this.plugins;
  }
  runHook(hook, ...args) {
    this.plugins.forEach(plugin => {
      if (typeof plugin[hook] === 'function') {
        plugin[hook](...args);
      }
    });
  }
}
