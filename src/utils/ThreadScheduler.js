// ThreadScheduler.js
// Adaptive thread control based on system performance
export function getThreadCount() {
  return navigator.hardwareConcurrency || 4;
}
