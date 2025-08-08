/**
 * segmentation.js
 * Person segmentation using ONNX Runtime Web
 * Loads and runs the person segmentation model
 */

let session = null;

export async function ensurePersonSegSession(preferredBackend = 'webgpu') {
  if (session) return session;
  
  try {
    const { createSession } = await import('./runtime.js');
    
    // Model configuration - using a lightweight person segmentation model
    const modelUrl = '/models/person-segmentation.onnx';
    
    // For now, we'll create a stub since we don't have the actual model
    // In production, this would load the actual ONNX model
    session = {
      run: async (input) => {
        // Stub implementation that returns a basic mask
        const { width, height } = input;
        const mask = new Float32Array(width * height);
        
        // Simple center-weighted mask for demonstration
        const centerX = width / 2;
        const centerY = height / 2;
        const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
            const idx = y * width + x;
            mask[idx] = Math.max(0, 1 - (dist / maxDist));
          }
        }
        
        return { output: mask };
      }
    };
    
    return session;
  } catch (error) {
    console.error('Failed to load person segmentation model:', error);
    throw error;
  }
}

export async function runPersonSeg(imageBitmap, options = {}) {
  const targetSize = options.targetSize || 384;
  
  try {
    const sess = await ensurePersonSegSession();
    
    // Create canvas for processing
    const canvas = new OffscreenCanvas(targetSize, targetSize);
    const ctx = canvas.getContext('2d');
    
    // Draw and resize image
    ctx.drawImage(imageBitmap, 0, 0, targetSize, targetSize);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
    
    // Convert to model input format (normalized RGB)
    const input = new Float32Array(targetSize * targetSize * 3);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const pixelIndex = Math.floor(i / 4);
      input[pixelIndex * 3] = imageData.data[i] / 255.0;     // R
      input[pixelIndex * 3 + 1] = imageData.data[i + 1] / 255.0; // G
      input[pixelIndex * 3 + 2] = imageData.data[i + 2] / 255.0; // B
    }
    
    // Run inference
    const startTime = performance.now();
    const result = await sess.run({ input: input });
    const inferenceTime = performance.now() - startTime;
    
    // Return mask
    return {
      mask: result.output,
      w: targetSize,
      h: targetSize,
      timeMs: inferenceTime
    };
    
  } catch (error) {
    console.error('Person segmentation failed:', error);
    throw error;
  }
}
