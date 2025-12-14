import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { apiConfig } from './config/api.config.js';
import apiRoutes from './api/routes/index.js';
import { errorHandler } from './api/middleware/errorHandler.js';

/**
 * Crypto Recovery Platform API Server
 * 
 * Provides REST API endpoints for blockchain fund tracing
 */

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(apiConfig.cors));

// Rate limiting
const limiter = rateLimit(apiConfig.rateLimit);
app.use('/api/', limiter);

// Swagger documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: apiConfig.swagger.title,
      version: apiConfig.swagger.version,
      description: apiConfig.swagger.description,
      contact: {
        name: 'API Support',
        email: 'support@example.com' // placeholder email
      }
    },
    servers: [
      {
        url: `http://localhost:${apiConfig.port}`,
        description: 'Development server'
      }
    ],
    tags: [
      {
        name: 'Trace',
        description: 'Fund tracing operations'
      },
      {
        name: 'Check',
        description: 'Quick checks and classification'
      }
    ]
  },
  apis: ['./src/api/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Crypto Recovery Platform API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      docs: '/api-docs',
      health: '/api/health',
      trace: '/api/trace',
      quickCheck: '/api/quick-check/:address',
      classify: '/api/classify/:address'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = apiConfig.port;
const HOST = apiConfig.host;

app.listen(PORT, HOST, () => {
  console.log('='.repeat(70));
  console.log('🚀 Crypto Recovery Platform API Server');
  console.log('='.repeat(70));
  console.log(`Environment: ${apiConfig.env}`);
  console.log(`Server: http://${HOST}:${PORT}`);
  console.log(`API Docs: http://${HOST}:${PORT}/api-docs`);
  console.log(`Health Check: http://${HOST}:${PORT}/api/health`);
  console.log('='.repeat(70));
  console.log('');
  console.log('Available endpoints:');
  console.log('  POST   /api/trace');
  console.log('  GET    /api/trace/:id');
  console.log('  GET    /api/trace/:id/status');
  console.log('  DELETE /api/trace/:id');
  console.log('  GET    /api/quick-check/:address');
  console.log('  GET    /api/classify/:address');
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});

export default app;