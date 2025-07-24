// Placeholder for image compression logic
export async function compressImage(file, quality = 80) {
  // TODO: Integrate with backend or WASM for actual compression
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ...file,
        compressed: true,
        quality,
      });
    }, 1000);
  });
}
