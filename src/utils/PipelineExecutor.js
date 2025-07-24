// PipelineExecutor.js
// Executes edit graph pipeline
export function executePipeline(graph, imageData) {
  // Run the edit graph's resolve method
  return graph.resolve(imageData);
}
