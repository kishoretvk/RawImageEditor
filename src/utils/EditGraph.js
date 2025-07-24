// EditGraph.js
// Non-destructive edit graph system
export class EditGraph {
  constructor() {
    this.nodes = [];
  }
  addNode(node) {
    this.nodes.push(node);
  }
  resolve(imageData) {
    // Apply each node in sequence to imageData
    let result = imageData;
    for (const node of this.nodes) {
      result = node.apply(result);
    }
    return result;
  }
}

// Example node classes
export class WhiteBalanceNode {
  constructor(temp, tint) {
    this.temp = temp;
    this.tint = tint;
  }
  apply(imageData) {
    // Example: apply temp/tint adjustment (stub)
    // Real implementation would use WebGL shader or pixel math
    return imageData;
  }
}

export class CropNode {
  constructor(rect) {
    this.rect = rect;
  }
  apply(imageData) {
    // Example: crop image to rect (stub)
    // Real implementation would slice buffer or use canvas
    return imageData;
  }
}

export class ExposureNode {
  constructor(exposure) {
    this.exposure = exposure;
  }
  apply(imageData) {
    // Example: apply exposure adjustment (stub)
    // Real implementation would scale pixel values
    return imageData;
  }
}
