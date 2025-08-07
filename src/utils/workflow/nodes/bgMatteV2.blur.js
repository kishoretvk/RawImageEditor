/**
 * Workflow node: Background Blur v2
 * node.data: { strength?: number }
 */
import { bgMatteV2 } from '../../ai/services/bgMatteV2';

export const type = 'bgBlurV2';
export const label = 'Background Blur v2';

export async function run(node, context) {
  const params = {
    strength: Number.isFinite(node?.data?.strength) ? node.data.strength : 50
  };

  const inputImage = context?.image || context?.getImage?.();
  const result = await bgMatteV2.blur(inputImage, params);

  return {
    editsDelta: result.editsDelta || {},
    masks: result.masks || null,
    meta: { ...(result.meta || {}), nodeId: node.id, type },
  };
}

export default { type, label, run };
