// apps/back-end/src/ratings/ratings.controller.ts

import { Request, Response } from 'express';
import { prisma } from '../prisma';

interface AuthRequest extends Request {
  user?: {
    userId: number;
  };
}

interface PendingItem {
  jobId: number;
  jobTitle: string;
  toUserId: number;
}

export const createRating = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const authReq = req as AuthRequest;
    const { jobId, toUserId, score, comment } = req.body;
    const fromUserId = authReq.user?.userId;

    if (!fromUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!jobId || !toUserId || !score) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    if (score < 1 || score > 5) {
      return res.status(400).json({ message: 'Score must be between 1-5' });
    }

    const job = await prisma.job.findUnique({
      where: { jobId },
    });

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (new Date(job.endTime) > new Date()) {
      return res.status(400).json({ message: 'Job not finished yet' });
    }

    const request = await prisma.request.findFirst({
      where: {
        jobId,
        status: 'APPROVED',
        OR: [
          { jobSeekerId: fromUserId },
          { job: { employerId: fromUserId } },
        ],
      },
    });

    if (!request) {
      return res.status(403).json({ message: 'Not allowed to rate' });
    }

    const existing = await prisma.rating.findUnique({
      where: {
        fromUserId_toUserId_jobId: {
          fromUserId,
          toUserId,
          jobId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ message: 'Already rated' });
    }

    const rating = await prisma.rating.create({
      data: {
        fromUserId,
        toUserId,
        jobId,
        score,
        comment,
      },
    });

    return res.json(rating);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getPendingRatings = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const requests = await prisma.request.findMany({
      where: {
        status: 'APPROVED',
        OR: [
          { jobSeekerId: userId },
          { job: { employerId: userId } },
        ],
      },
      include: {
        job: true,
      },
    });

    const now = new Date();
    const pending: PendingItem[] = [];

    for (const r of requests) {
      if (new Date(r.job.endTime) > now) continue;

      let toUserId: number;

      if (r.jobSeekerId === userId) {
        toUserId = r.job.employerId;
      } else {
        if (!r.jobSeekerId) continue;
        toUserId = r.jobSeekerId;
      }

      const exists = await prisma.rating.findUnique({
        where: {
          fromUserId_toUserId_jobId: {
            fromUserId: userId,
            toUserId,
            jobId: r.jobId,
          },
        },
      });

      if (!exists) {
        pending.push({
          jobId: r.jobId,
          jobTitle: r.job.title,
          toUserId,
        });
      }
    }

    res.json(pending);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserRating = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;

    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const ratings = await prisma.rating.findMany({
      where: { toUserId: userId },
      select: { score: true, comment: true, fromUserId: true },
    });

    const avg =
      ratings.length > 0
        ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
        : null;

    res.json({
      average: avg ? Math.round(avg * 10) / 10 : null,
      count: ratings.length,
      ratings,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};