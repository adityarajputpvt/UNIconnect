import 'express-async-errors';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { config } from './config/env';
import { initialisePrisma } from './config/prisma';
import { initSocket } from './socket/socketManager';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Routes
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import achievementRoutes from './routes/achievement.routes';
import verificationRoutes from './routes/verification.routes';
import aiRoutes from './routes/ai.routes';
import socialRoutes from './routes/social.routes';
import notificationRoutes from './routes/notification.routes';
import analyticsRoutes from './routes/analytics.routes';

const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.io
initSocket(httpServer);

// ============================================
// MIDDLEWARE
// ============================================

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});

app.use('/api', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ============================================
// ROUTES
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// API docs placeholder
app.get('/api', (_req, res) => {
  res.json({
    name: 'Uni-Connect API',
    version: '1.0.0',
    description: 'AI-powered student achievement and university engagement ecosystem',
    endpoints: {
      auth: '/api/auth',
      profiles: '/api/profiles',
      achievements: '/api/achievements',
      verifications: '/api/verifications',
      ai: '/api/ai',
      social: '/api/social',
      notifications: '/api/notifications',
      analytics: '/api/analytics',
    },
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// ============================================
// START SERVER
// ============================================

async function main() {
  // 1. Boot embedded PostgreSQL (PGlite WASM) + apply schema + init Prisma
  logger.info('🐘 Starting embedded PostgreSQL (PGlite)...');
  await initialisePrisma();
  logger.info('✅ Database ready — no system PostgreSQL required');

  // 2. Start HTTP + Socket.io
  httpServer.listen(config.port, () => {
    logger.info(`🚀 Uni-Connect API  →  http://localhost:${config.port}`);
    logger.info(`📡 Socket.io ready`);
    logger.info(`🌍 Environment: ${config.nodeEnv}`);
    logger.info(`📖 API docs      →  http://localhost:${config.port}/api`);
    logger.info(`❤️  Health check  →  http://localhost:${config.port}/health`);
  });
}

main().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
