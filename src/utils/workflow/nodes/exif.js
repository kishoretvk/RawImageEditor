/**
 * ReadEXIF node (MVP)
 * In browsers without native EXIF write, we read minimal metadata using Image API as a placeholder.
 * Extend later with a lightweight EXIF reader or sidecar ingestion if needed.
 */
export async function nodeReadEXIF({ inputs, params, context, onProgress }) {
  const items = Array.isArray(inputs?.[0]) ? inputs[0] : [];
  const results = [];
  let i = 0;
  for (const it of items) {
    // Placeholder EXIF: name/size/type if File, else pass-through
    const meta = {
      name: it?.name || it?.filename || 'unknown',
      size: typeof it?.size === 'number' ? it.size : undefined,
      type: it?.type || undefined,
    };
    results.push({ item: it, exif: meta });
    i++;
    onProgress(i / items.length, `EXIF read ${i}/${items.length}`);
    await Promise.resolve(); // yield
  }
  return results;
}
