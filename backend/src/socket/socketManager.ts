import { Server as SocketServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { verifyAccessToken } from '../utils/jwt';
import { logger } from '../utils/logger';

let io: SocketServer;

export const initSocket = (httpServer: HttpServer): SocketServer => {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication middleware for socket
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = verifyAccessToken(token);
      (socket as Socket & { userId?: string }).userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as Socket & { userId?: string }).userId;
    logger.info(`Socket connected: ${socket.id} (user: ${userId})`);

    // Join user's personal room for targeted notifications
    if (userId) {
      socket.join(`user_${userId}`);
    }

    // Join post rooms for real-time comments
    socket.on('join_post', (postId: string) => {
      socket.join(`post_${postId}`);
    });

    socket.on('leave_post', (postId: string) => {
      socket.leave(`post_${postId}`);
    });

    // Typing indicators
    socket.on('typing_start', (data: { postId: string }) => {
      socket.to(`post_${data.postId}`).emit('user_typing', { userId, postId: data.postId });
    });

    socket.on('typing_stop', (data: { postId: string }) => {
      socket.to(`post_${data.postId}`).emit('user_stopped_typing', { userId, postId: data.postId });
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = (): SocketServer => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
