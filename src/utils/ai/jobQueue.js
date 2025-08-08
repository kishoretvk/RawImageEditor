/**
 * jobQueue.js
 * AI job queue management with priority and concurrency control
 * Handles background AI processing with proper error handling and progress tracking
 */

class AIJobQueue {
  constructor(maxConcurrency = 2) {
    this.maxConcurrency = maxConcurrency;
    this.queue = [];
    this.running = new Map();
    this.id = 0;
    this.listeners = new Map();
  }

  /**
   * Add a job to the queue
   */
  add(job, priority = 0) {
    const id = ++this.id;
    const jobItem = {
      id,
      job,
      priority,
      status: 'queued',
      created: Date.now(),
      started: null,
      completed: null,
      error: null,
      progress: 0
    };

    // Insert based on priority (higher priority first)
    const insertIndex = this.queue.findIndex(item => item.priority < priority);
    if (insertIndex === -1) {
      this.queue.push(jobItem);
    } else {
      this.queue.splice(insertIndex, 0, jobItem);
    }

    this.emit('jobAdded', jobItem);
    this.processQueue();
    
    return id;
  }

  /**
   * Process the queue
   */
  async processQueue() {
    while (this.running.size < this.maxConcurrency && this.queue.length > 0) {
      const jobItem = this.queue.shift();
      this.running.set(jobItem.id, jobItem);
      
      jobItem.status = 'running';
      jobItem.started = Date.now();
      
      this.emit('jobStarted', jobItem);
      
      try {
        const result = await this.executeJob(jobItem);
        jobItem.status = 'completed';
        jobItem.completed = Date.now();
        jobItem.result = result;
        
        this.emit('jobCompleted', jobItem);
      } catch (error) {
        jobItem.status = 'failed';
        jobItem.completed = Date.now();
        jobItem.error = error.message || error.toString();
        
        this.emit('jobFailed', jobItem);
      } finally {
        this.running.delete(jobItem.id);
      }
    }
  }

  /**
   * Execute a single job
   */
  async executeJob(jobItem) {
    const { job } = jobItem;
    
    // Create progress callback
    const onProgress = (progress) => {
      jobItem.progress = Math.min(100, Math.max(0, progress));
      this.emit('jobProgress', jobItem);
    };

    try {
      // Execute the job with progress tracking
      const result = await job(onProgress);
      return result;
    } catch (error) {
      console.error('Job execution failed:', error);
      throw error;
    }
  }

  /**
   * Get job status
   */
  getStatus(jobId) {
    // Check running jobs
    const runningJob = this.running.get(jobId);
    if (runningJob) return runningJob;

    // Check if it's in the queue
    const queuedJob = this.queue.find(item => item.id === jobId);
    if (queuedJob) return queuedJob;

    return null;
  }

  /**
   * Cancel a job
   */
  cancel(jobId) {
    // Remove from queue
    const queueIndex = this.queue.findIndex(item => item.id === jobId);
    if (queueIndex !== -1) {
      const jobItem = this.queue.splice(queueIndex, 1)[0];
      jobItem.status = 'cancelled';
      jobItem.completed = Date.now();
      this.emit('jobCancelled', jobItem);
      return true;
    }

    // Can't cancel running jobs (would need abort controller)
    return false;
  }

  /**
   * Clear all queued jobs
   */
  clear() {
    const cancelledJobs = [...this.queue];
    this.queue = [];
    
    cancelledJobs.forEach(jobItem => {
      jobItem.status = 'cancelled';
      jobItem.completed = Date.now();
      this.emit('jobCancelled', jobItem);
    });
  }

  /**
   * Get queue statistics
   */
  getStats() {
    return {
      queued: this.queue.length,
      running: this.running.size,
      total: this.queue.length + this.running.size,
      maxConcurrency: this.maxConcurrency
    };
  }

  /**
   * Event handling
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Event callback error:', error);
        }
      });
    }
  }
}

// Global instance
const globalQueue = new AIJobQueue();

// Export both the class and global instance
export { AIJobQueue };
export default globalQueue;

// Convenience functions for global queue
export const addAIJob = (job, priority = 0) => globalQueue.add(job, priority);
export const getAIJobStatus = (jobId) => globalQueue.getStatus(jobId);
export const cancelAIJob = (jobId) => globalQueue.cancel(jobId);
export const clearAIJobs = () => globalQueue.clear();
export const getAIJobStats = () => globalQueue.getStats();
