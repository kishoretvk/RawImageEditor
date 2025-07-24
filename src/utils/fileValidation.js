// Validate file type and size
export function validateFile(file) {
  const validExtensions = ['.arw', '.cr2', '.cr3', '.nef', '.dng', '.raw', '.jpg', '.jpeg', '.png'];
  const ext = file.name.toLowerCase();
  const isValid = validExtensions.some(e => ext.endsWith(e));
  const isSizeOk = file.size < 50 * 1024 * 1024; // 50MB limit
  return isValid && isSizeOk;
}
