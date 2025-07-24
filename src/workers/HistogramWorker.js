// HistogramWorker.js
// WebWorker for calculating histogram bins from RAW image data
self.onmessage = function(e) {
  // e.data: { pixels: Uint16Array, channelCount: number }
  const { pixels, channelCount } = e.data;
  // Per-channel histogram calculation
  const bins = Array(channelCount).fill().map(() => Array(256).fill(0));
  for (let i = 0; i < pixels.length; i += channelCount) {
    for (let c = 0; c < channelCount; c++) {
      const value = Math.min(255, Math.floor(pixels[i + c] / 256));
      bins[c][value]++;
    }
  }
  // Normalize and log scale for better visual feedback
  const logBins = bins.map(channelBins => {
    const maxBin = Math.max(...channelBins);
    return channelBins.map(count => Math.log1p(count) / Math.log1p(maxBin));
  });
  self.postMessage({ bins: logBins });
};
