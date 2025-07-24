// WebGL/canvas fallback utility
export function getRenderingContext(canvas) {
  let gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (gl) return gl;
  // Fallback to 2D canvas
  return canvas.getContext('2d');
}
