// Placeholder for EXIF metadata extraction
export function extractMetadata(file) {
  // TODO: Use exif-js or similar for real metadata
  return {
    filename: file.name,
    size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
    type: file.type,
    // Add more fields as needed
  };
}
