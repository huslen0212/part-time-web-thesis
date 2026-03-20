import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middleware/auth.middleware';

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

    // tuhain user-iin notification-uudiig avna
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

// PATCH /notifications/:id/read
export const markNotificationRead = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    // tuhain notification baigaa esehiig shalgana
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