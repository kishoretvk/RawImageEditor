/**
 * ApplyPreset node (MVP)
 * Merges a preset (edits) into an item record coming from EXIF node.
 * Input: array of { item, exif, edits? }
 * Params: { preset: Object } - a flat map of edit keys/values to merge
 * Output: array of { item, exif, edits }
 */
export async function nodeApplyPreset({ inputs, params, context, onProgress }) {
  const list = Array.isArray(inputs?.[0]) ? inputs[0] : [];
  const preset = params?.preset || {};
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const rec = list[i] || {};
    const prevEdits = rec.edits || {};
    const next = { ...rec, edits: { ...prevEdits, ...preset } };
    out.push(next);
    onProgress((i + 1) / list.length, `Preset applied ${i + 1}/${list.length}`);
    await Promise.resolve();
  }
  return out;
}
