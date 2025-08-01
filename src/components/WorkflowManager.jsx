// A simple workflow manager that uses localStorage
class WorkflowManager {
  static getWorkflows() {
    try {
      const workflows = localStorage.getItem('raw-editor-workflows');
      return workflows ? JSON.parse(workflows) : [];
    } catch (error) {
      console.error("Could not retrieve workflows", error);
      return [];
    }
  }

  static saveWorkflow(workflow) {
    try {
      const workflows = WorkflowManager.getWorkflows();
      if (workflow.id) {
        const existingIndex = workflows.findIndex(w => w.id === workflow.id);
        if (existingIndex > -1) {
          workflows[existingIndex] = workflow;
        } else {
          workflows.push(workflow);
        }
      } else {
        workflow.id = Date.now();
        workflows.push(workflow);
      }
      localStorage.setItem('raw-editor-workflows', JSON.stringify(workflows));
    } catch (error) {
      console.error("Could not save workflow", error);
    }
  }

  static deleteWorkflow(workflowId) {
    try {
      let workflows = WorkflowManager.getWorkflows();
      workflows = workflows.filter(w => w.id !== workflowId);
      localStorage.setItem('raw-editor-workflows', JSON.stringify(workflows));
    } catch (error) {
      console.error("Could not delete workflow", error);
    }
  }
}

export default WorkflowManager;
