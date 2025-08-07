/**
 * Workflow node: Landscape Enhance v2
 * Segments sky/vegetation/ground and applies adaptive shaping.
 * node.data: { strength?: number, skyBoost?: boolean, textureBoost?: boolean }
 */
import { landscapeEnhanceV2 } from '../../ai/services/landscapeEnhanceV2';

export const type = 'landscapeEnhanceV2';
export const label = 'Landscape Enhance v2';

export async function run(node, context) {
  const params = {
    strength: Number.isFinite(node?.data?.strength) ? node.data.strength : 50,
    skyBoost: node?.data?.skyBoost !== false,
    textureBoost: node?.data?.textureBoost !== false,
  };

  const inputImage = context?.image || context?.getImage?.();
  const result = await landscapeEnhanceV2.run(inputImage, params);

  return {
    editsDelta: result.editsDelta || {},
    masks: result.masks || null,
    meta: { ...(result.meta || {}), nodeId: node.id, type },
  };
}

export default { type, label, run };
