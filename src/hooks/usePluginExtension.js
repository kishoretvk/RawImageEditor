// usePluginExtension.js
// Hook for plugin extension points
import { useEffect } from 'react';
import { PluginRegistry } from '../plugins/PluginRegistry';

const registry = new PluginRegistry();

export function usePluginExtension(hook, ...args) {
  useEffect(() => {
    registry.runHook(hook, ...args);
  }, [hook, ...args]);
}
