import { addTraceJob, getJobStatus, getJobResult, cancelJob } from '../queues/traceQueue.js';
import { TracingService } from '../../infrastructure/blockchain/services/TracingService.js';
import { BlockchainService } from '../../infrastructure/blockchain/services/BlockchainService.js';

const tracingService = new TracingService();
const blockchainService = new BlockchainService();

/**
 * TraceController - Handles trace-related API requests
 */

/**
 * POST /api/trace
 * Start a new trace job
 */
export const startTrace = async (req, res, next) => {
  try {
    const { address, ...options } = req.body;

    console.log(`[API] Starting trace for ${address}`);

    // Add job to queue
    const result = await addTraceJob(address, options);

    res.status(202).json({
      success: true,
      message: 'Trace job started',
      data: {
        jobId: result.jobId,
        status: result.status,
        statusUrl: `/api/trace/${result.jobId}/status`,
        resultUrl: `/api/trace/${result.jobId}`
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/trace/:id/status
 * Get trace job status
 */
export const getTraceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const status = await getJobStatus(id);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'Trace not found'
      });
    }

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/trace/:id
 * Get trace results
 */
export const getTraceResult = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await getJobResult(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Trace not found'
      });
    }

    // If not completed yet, return status
    if (result.status && result.status !== 'completed') {
      return res.status(202).json({
        success: false,
        message: 'Trace still processing',
        data: {
          jobId: id,
          status: result.status,
          statusUrl: `/api/trace/${id}/status`
        }
      });
    }

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/trace/:id
 * Cancel/delete a trace job
 */
export const deleteTrace = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cancelled = await cancelJob(id);

    if (!cancelled) {
      return res.status(404).json({
        success: false,
        error: 'Trace not found or already completed'
      });
    }

    res.json({
      success: true,
      message: 'Trace cancelled'
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/quick-check/:address
 * Quick CEX check (synchronous)
 */
export const quickCheck = async (req, res, next) => {
  try {
    const { address } = req.params;

    console.log(`[API] Quick check for ${address}`);

    const result = await tracingService.quickCexCheck(address);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/classify/:address
 * Classify an address
 */
export const classifyAddress = async (req, res, next) => {
  try {
    const { address } = req.params;

    console.log(`[API] Classifying ${address}`);

    const classification = await blockchainService.classifyAddress(address);

    res.json({
      success: true,
      data: classification
    });

  } catch (error) {
    next(error);
  }
};

export default {
  startTrace,
  getTraceStatus,
  getTraceResult,
  deleteTrace,
  quickCheck,
  classifyAddress
};