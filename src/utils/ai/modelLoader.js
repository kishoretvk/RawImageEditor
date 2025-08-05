/**
 * modelLoader.js (stub)
 * Centralizes TF.js backend/init and model loading. Stubbed for PR2 wiring.
 * Later we will import '@tensorflow/tfjs', backends, and call tf.setBackend.
 */

let _init = false;
let _backend = 'stub';

export async function initTF({ prefer = 'webgl' } = {}) {
  // Real impl would import tfjs and select backend here.
  _init = true;
  _backend = prefer;
  return { ok: true, backend: _backend };
}

export function isInitialized() {
  return _init;
}

export function getBackend() {
  return _backend;
}

export async function loadModel(name) {
  // Real impl: use tf.loadGraphModel or saved model assets; cache via tf.io.
  return { name, loaded: true, source: 'stub' };
}
