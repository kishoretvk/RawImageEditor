// Utility to detect and handle RAW files
export function isRawFile(filename) {
  if (!filename) return false;
  
  const ext = filename.toLowerCase();
  const rawExtensions = ['.arw', '.cr2', '.cr3', '.nef', '.dng', '.raw'];
  
  return rawExtensions.some(rawExt => ext.includes(rawExt));
}

export function getRawFileInfo(filename) {
  if (!filename) return null;
  
  const ext = filename.toLowerCase();
  
  if (ext.includes('.cr2') || ext.includes('.cr3')) {
    return {
      type: 'Canon RAW',
      manufacturer: 'Canon',
      extension: ext.includes('.cr3') ? 'CR3' : 'CR2',
      needsConversion: true
    };
  }
  
  if (ext.includes('.nef')) {
    return {
      type: 'Nikon RAW',
      manufacturer: 'Nikon', 
      extension: 'NEF',
      needsConversion: true
    };
  }
  
  if (ext.includes('.arw')) {
    return {
      type: 'Sony RAW',
      manufacturer: 'Sony',
      extension: 'ARW', 
      needsConversion: true
    };
  }
  
  if (ext.includes('.dng')) {
    return {
      type: 'Adobe Digital Negative',
      manufacturer: 'Adobe',
      extension: 'DNG',
      needsConversion: true
    };
  }
  
  if (ext.includes('.raw')) {
    return {
      type: 'Generic RAW',
      manufacturer: 'Unknown',
      extension: 'RAW',
      needsConversion: true
    };
  }
  
  return null;
}

export function extractFileInfoFromUrl(url) {
  if (!url) return null;
  
  // For blob URLs, we need to get the filename from somewhere else
  // This is a limitation of blob URLs - they don't contain filename info
  if (url.startsWith('blob:')) {
    return {
      isBlobUrl: true,
      needsFilename: true
    };
  }
  
  // For regular URLs, extract from the path
  const parts = url.split('/');
  const filename = parts[parts.length - 1];
  return {
    filename,
    isBlobUrl: false,
    rawInfo: getRawFileInfo(filename)
  };
}
