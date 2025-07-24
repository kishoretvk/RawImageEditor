// UndoStack.js
// Utility for managing undo/redo stack
export class UndoStack {
  constructor() {
    this.stack = [];
    this.index = -1;
  }
  push(state) {
    this.stack = this.stack.slice(0, this.index + 1);
    this.stack.push(state);
    this.index = this.stack.length - 1;
  }
  undo() {
    if (this.index > 0) this.index--;
    return this.stack[this.index];
  }
  redo() {
    if (this.index < this.stack.length - 1) this.index++;
    return this.stack[this.index];
  }
  current() {
    return this.stack[this.index];
  }
  reset() {
    this.stack = [];
    this.index = -1;
  }
}
