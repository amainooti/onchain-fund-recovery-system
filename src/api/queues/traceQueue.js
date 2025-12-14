import Queue from 'bull';
import { apiConfig } from '../../config/api.config.js';
import { TracingService } from '../../infrastructure/blockchain/services/TracingService.js';
import { EvidenceService } from '../../infrastructure/blockchain/services/EvidenceService.js';

/**
 * Bull queue for async trace processing
 * 
 * Jobs are processed in background to avoid blocking API requests
 */

// Create queue
export const traceQueue = new Queue('trace-jobs', {
  redis: apiConfig.redis,
  defaultJobOptions: apiConfig.jobs
});

// Initialize services
const tracingService = new TracingService();
const evidenceService = new EvidenceService();

/**
 * Process trace jobs
 */
traceQueue.process(async (job) => {
  const { address, options, jobId } = job.data;

  console.log(`[TraceQueue] Processing job ${jobId} for address ${address}`);

  try {
    // Update progress
    await job.progress(10);

    // Run trace
    const traceResult = await tracingService.traceAddress(address, options);
    await job.progress(80);

    // Generate evidence report
    const evidenceReport = evidenceService.generateEvidenceReport(traceResult);
    await job.progress(90);

    // Get graph data
    const graphData = tracingService.getGraph();
    await job.progress(95);

    console.log(`[TraceQueue] Job ${jobId} completed successfully`);

    return {
      jobId,
      trace: traceResult.toJSON(),
      evidence: evidenceReport,
      graph: graphData,
      completedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error(`[TraceQueue] Job ${jobId} failed:`, error.message);
    throw error;
  }
});

/**
 * Event handlers
 */
traceQueue.on('completed', (job, result) => {
  console.log(`[TraceQueue] Job ${job.id} completed`);
});

traceQueue.on('failed', (job, err) => {
  console.error(`[TraceQueue] Job ${job.id} failed:`, err.message);
});

traceQueue.on('stalled', (job) => {
  console.warn(`[TraceQueue] Job ${job.id} stalled`);
});

/**
 * Add trace job to queue
 */
export const addTraceJob = async (address, options = {}) => {
  const jobId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const job = await traceQueue.add(
    {
      address,
      options,
      jobId
    },
    {
      jobId,
      attempts: 2,
      removeOnComplete: true,
      removeOnFail: false
    }
  );

  return {
    jobId: job.id,
    status: 'queued'
  };
};

/**
 * Get job status
 */
export const getJobStatus = async (jobId) => {
  const job = await traceQueue.getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();
  const progress = job.progress();
  const reason = job.failedReason;

  return {
    jobId: job.id,
    status: state,
    progress,
    ...(reason && { error: reason }),
    createdAt: new Date(job.timestamp).toISOString(),
    ...(job.finishedOn && { completedAt: new Date(job.finishedOn).toISOString() })
  };
};

/**
 * Get job result
 */
export const getJobResult = async (jobId) => {
  const job = await traceQueue.getJob(jobId);

  if (!job) {
    return null;
  }

  const state = await job.getState();

  if (state !== 'completed') {
    return {
      jobId: job.id,
      status: state,
      error: state === 'failed' ? job.failedReason : null
    };
  }

  return job.returnvalue;
};

/**
 * Cancel job
 */
export const cancelJob = async (jobId) => {
  const job = await traceQueue.getJob(jobId);

  if (!job) {
    return false;
  }

  const state = await job.getState();

  if (state === 'active' || state === 'waiting' || state === 'delayed') {
    await job.remove();
    return true;
  }

  return false;
};

export default traceQueue;