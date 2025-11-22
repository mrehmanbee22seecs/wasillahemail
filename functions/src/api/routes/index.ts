/**
 * Main Routes
 * Aggregates all API routes
 */

import { Router } from 'express';
import projectsRoutes from './projects.routes';
import eventsRoutes from './events.routes';
import ngosRoutes from './ngos.routes';
import usersRoutes from './users.routes';
import adminRoutes from './admin.routes';
import analyticsRoutes from './analytics.routes';
import webhooksRoutes from './webhooks.routes';

const router = Router();

// API health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date(),
    },
  });
});

// Mount resource routes
router.use('/projects', projectsRoutes);
router.use('/events', eventsRoutes);
router.use('/ngos', ngosRoutes);
router.use('/users', usersRoutes);
router.use('/admin', adminRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/webhooks', webhooksRoutes);

export default router;
