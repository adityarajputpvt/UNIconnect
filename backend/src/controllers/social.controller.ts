import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { sendSuccess, sendError, getPaginationParams } from '../utils/apiResponse';
import { getIO } from '../socket/socketManager';

export const getFeed = async (req: Request, res: Response): Promise<void> => {
  const { page, limit, skip } = getPaginationParams(req.query as Record<string, unknown>);

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where: { isPublic: true },
      include: {
        user: {
          include: {
            profile: { select: { firstName: true, lastName: true, avatar: true, headline: true } },
          },
        },
        comments: {
          include: {
            user: {
              include: {
                profile: { select: { firstName: true, lastName: true, avatar: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
          take: 3,
        },
        _count: { select: { comments: true, likes: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.post.count({ where: { isPublic: true } }),
  ]);

  sendSuccess(res, posts, 'Feed fetched', 200, {
    page, limit, total, totalPages: Math.ceil(total / limit),
  });
};

export const createPost = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const { content, type = 'GENERAL', imageUrl, isPublic = true } = req.body;

  if (!content?.trim()) {
    sendError(res, 'Content is required', 400);
    return;
  }

  const post = await prisma.post.create({
    data: { userId, content, type, imageUrl, isPublic },
    include: {
      user: {
        include: {
          profile: { select: { firstName: true, lastName: true, avatar: true, headline: true } },
        },
      },
    },
  });

  // Emit to all connected clients
  const io = getIO();
  io.emit('new_post', post);

  sendSuccess(res, post, 'Post created', 201);
};

export const likePost = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;

  const existing = await prisma.postLike.findUnique({
    where: { postId_userId: { postId: id, userId } },
  });

  if (existing) {
    // Unlike
    await prisma.$transaction([
      prisma.postLike.delete({ where: { postId_userId: { postId: id, userId } } }),
      prisma.post.update({ where: { id }, data: { likesCount: { decrement: 1 } } }),
    ]);
    sendSuccess(res, { liked: false }, 'Post unliked');
  } else {
    // Like
    await prisma.$transaction([
      prisma.postLike.create({ data: { postId: id, userId } }),
      prisma.post.update({ where: { id }, data: { likesCount: { increment: 1 } } }),
    ]);
    sendSuccess(res, { liked: true }, 'Post liked');
  }
};

export const addComment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = req.user!.userId;
  const { content } = req.body;

  if (!content?.trim()) {
    sendError(res, 'Comment content is required', 400);
    return;
  }

  const comment = await prisma.comment.create({
    data: { postId: id, userId, content },
    include: {
      user: {
        include: {
          profile: { select: { firstName: true, lastName: true, avatar: true } },
        },
      },
    },
  });

  // Emit real-time comment
  const io = getIO();
  io.to(`post_${id}`).emit('new_comment', comment);

  sendSuccess(res, comment, 'Comment added', 201);
};

export const sendKudos = async (req: Request, res: Response): Promise<void> => {
  const giverId = req.user!.userId;
  const { receiverId, message, category } = req.body;

  if (giverId === receiverId) {
    sendError(res, 'Cannot send kudos to yourself', 400);
    return;
  }

  const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
  if (!receiver) {
    sendError(res, 'User not found', 404);
    return;
  }

  const kudos = await prisma.kudos.create({
    data: { giverId, receiverId, message, category },
    include: {
      giver: {
        include: { profile: { select: { firstName: true, lastName: true, avatar: true } } },
      },
    },
  });

  // Create notification
  await prisma.notification.create({
    data: {
      userId: receiverId,
      type: 'KUDOS_RECEIVED',
      title: 'You received Kudos!',
      message: `${kudos.giver.profile?.firstName} sent you kudos${category ? ` for ${category}` : ''}.`,
      data: { kudosId: kudos.id, giverId },
    },
  });

  // Emit real-time notification
  const io = getIO();
  io.to(`user_${receiverId}`).emit('kudos_received', kudos);

  sendSuccess(res, kudos, 'Kudos sent', 201);
};
