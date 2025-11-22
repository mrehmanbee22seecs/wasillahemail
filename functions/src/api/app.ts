/**
 * Express API Application
 * Main Express app configuration for the REST API
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { API_CONFIG } from './config/api.config';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors(API_CONFIG.cors));

// Body parsers with explicit limits to prevent oversized payloads
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Mount API routes
app.use(API_CONFIG.basePath, routes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
