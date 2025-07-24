// DecodeQueue.js
// Defer RAW decode until visible/on-edit
export class DecodeQueue {
  constructor() {
    this.queue = [];
  }
  enqueue(task) {
    this.queue.push(task);
  }
  process() {
    // Stub: process decode queue
  }
}
