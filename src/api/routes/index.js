import express from 'express';
import { validate } from '../../api/middleware/validators.js';
import {
  traceRequestSchema,
  quickCheckSchema,
  classifyAddressSchema,
  traceIdSchema
} from '../validators/schemas.js';
import {
  startTrace,
  getTraceStatus,
  getTraceResult,
  deleteTrace,
  quickCheck,
  classifyAddress
} from '../controllers/traceController.js';

const router = express.Router();
/**
 * @swagger
 * /api/trace:
 *   post:
 *     summary: Start a new trace job
 *     tags: [Trace]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *             properties:
 *               address:
 *                 type: string
 *                 example: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
 *               maxHops:
 *                 type: integer
 *                 default: 4
 *               startBlock:
 *                 type: integer
 *                 default: 0
 *               stopAtCex:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       202:
 *         description: Trace job started
 *       400:
 *         description: Invalid request
 */
router.post('/trace', validate(traceRequestSchema), startTrace);

/**
 * @swagger
 * /api/trace/{id}/status:
 *   get:
 *     summary: Get trace job status
 *     tags: [Trace]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job status
 *       404:
 *         description: Trace not found
 */
router.get('/trace/:id/status', validate(traceIdSchema, 'params'), getTraceStatus);

/**
 * @swagger
 * /api/trace/{id}:
 *   get:
 *     summary: Get trace results
 *     tags: [Trace]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trace results
 *       202:
 *         description: Trace still processing
 *       404:
 *         description: Trace not found
 */
router.get('/trace/:id', validate(traceIdSchema, 'params'), getTraceResult);

/**
 * @swagger
 * /api/trace/{id}:
 *   delete:
 *     summary: Cancel/delete a trace
 *     tags: [Trace]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trace cancelled
 *       404:
 *         description: Trace not found
 */
router.delete('/trace/:id', validate(traceIdSchema, 'params'), deleteTrace);

/**
 * @swagger
 * /api/quick-check/{address}:
 *   get:
 *     summary: Quick CEX check (synchronous)
 *     tags: [Check]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CEX check results
 *       400:
 *         description: Invalid address
 */
router.get('/quick-check/:address', validate(quickCheckSchema, 'params'), quickCheck);

/**
 * @swagger
 * /api/classify/{address}:
 *   get:
 *     summary: Classify an address
 *     tags: [Check]
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Address classification
 *       400:
 *         description: Invalid address
 */
router.get('/classify/:address', validate(classifyAddressSchema, 'params'), classifyAddress);

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;