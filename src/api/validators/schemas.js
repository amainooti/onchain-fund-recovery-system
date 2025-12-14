import Joi from 'joi';

/**
 * Validation schemas for API requests
 */

// Ethereum address validation
const ethereumAddress = Joi.string()
  .pattern(/^0x[a-fA-F0-9]{40}$/)
  .required()
  .messages({
    'string.pattern.base': 'Must be a valid Ethereum address (0x followed by 40 hex characters)',
    'any.required': 'Address is required'
  });

// Trace request schema
export const traceRequestSchema = Joi.object({
  address: ethereumAddress,
  maxHops: Joi.number().integer().min(1).max(4).default(4),
  startBlock: Joi.number().integer().min(0).default(0),
  endBlock: Joi.number().integer().min(0).default(99999999),
  includeZeroValue: Joi.boolean().default(false),
  stopAtCex: Joi.boolean().default(true),
  maxTransactionsPerHop: Joi.number().integer().min(5).max(100).default(20)
}).options({ stripUnknown: true });

// Quick check schema
export const quickCheckSchema = Joi.object({
  address: ethereumAddress
}).options({ stripUnknown: true });

// Classify address schema
export const classifyAddressSchema = Joi.object({
  address: ethereumAddress
}).options({ stripUnknown: true });

// Trace ID schema (UUID v4)
export const traceIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^trace_\d+_[a-z0-9]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Must be a valid trace ID (trace_1234567890_abc123)',
      'any.required': 'Trace ID is required'
    })
});

export default {
  traceRequestSchema,
  quickCheckSchema,
  classifyAddressSchema,
  traceIdSchema
};