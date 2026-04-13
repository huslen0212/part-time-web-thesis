import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { addClient, removeClient } from './sse';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_for_diplom';

// GET /notifications
export const getMyNotifications = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Алдаа гарлаа' });
  }
};

// GET /notifications/stream?token=...  — SSE холболт
export const streamNotifications = (req: AuthRequest, res: Response): void => {
  const token = req.query.token as string | undefined;
  if (!token) {
    res.status(401).json({ message: 'Token байхгүй' });
    return;
  }

  let userId: number;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    userId = decoded.userId;
  } catch {
    res.status(401).json({ message: 'Token хүчингүй' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // холболт амьд байгааг мэдэгдэх
  res.write(': connected\n\n');

  addClient(userId, res);

  req.on('close', () => {
    removeClient(userId, res);
  });
};

// PATCH /notifications/:id/read
export const markNotificationRead = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    await prisma.notification.update({
      where: { notificationId: Number(id) },
      data: { isRead: true },
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Алдаа гарлаа' });
  }
};
