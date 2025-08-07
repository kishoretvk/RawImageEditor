/**
 * Workflow node: Portrait Enhance v2
 * Uses AI service to produce editsDelta and optional masks for composition.
 * node.data: { strength?: number, preserveSkinTone?: boolean }
 */
import { portraitEnhanceV2 } from '../../ai/services/portraitEnhanceV2';

export const type = 'portraitEnhanceV2';
export const label = 'Portrait Enhance v2';

export async function run(node, context) {
  const params = {
    strength: Number.isFinite(node?.data?.strength) ? node.data.strength : 50,
    preserveSkinTone: node?.data?.preserveSkinTone !== false,
  };

  const inputImage = context?.image || context?.getImage?.(); // allow runner to provide helper
  const result = await portraitEnhanceV2.run(inputImage, params);

  // Return standard workflow node result
  return {
    editsDelta: result.editsDelta || {},
    masks: result.masks || null,
    meta: { ...(result.meta || {}), nodeId: node.id, type },
  };
}

export default { type, label, run };
