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

// POST /ratings
//ajil duussanii daraa neg negendee unelgee uguh (1-5 od), davhardahgui
export const createRating = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const authReq = req as AuthRequest;
    const { jobId, toUserId, score, comment } = req.body;
    const fromUserId = authReq.user?.userId;

    if (!fromUserId) return res.status(401).json({ message: 'Unauthorized' });
    if (!jobId || !toUserId || !score)
      return res.status(400).json({ message: 'Missing fields' });
    if (score < 1 || score > 5)
      return res.status(400).json({ message: 'Score must be between 1-5' });

    const job = await prisma.job.findUnique({ where: { jobId } });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (new Date(job.endTime) > new Date())
      return res.status(400).json({ message: 'Job not finished yet' });

    const request = await prisma.request.findFirst({
      where: {
        jobId,
        status: 'APPROVED',
        OR: [
          { jobSeekerUserId: fromUserId },
          { job: { employerUserId: fromUserId } },
        ],
      },
    });

    if (!request)
      return res.status(403).json({ message: 'Not allowed to rate' });

    const existing = await prisma.rating.findUnique({
      where: { fromUserId_toUserId_jobId: { fromUserId, toUserId, jobId } },
    });

    if (existing) return res.status(400).json({ message: 'Already rated' });

    const rating = await prisma.rating.create({
      data: { fromUserId, toUserId, jobId, score, comment },
    });

    return res.json(rating);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /ratings/pending
//unelgee uguugui, duussan ajluudiig olj pending jagsaalt butsaana
export const getPendingRatings = async (
  req: Request,
  res: Response,
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
        OR: [{ jobSeekerUserId: userId }, { job: { employerUserId: userId } }],
      },
      include: { job: true },
    });

    const now = new Date();
    const pending: PendingItem[] = [];

    for (const r of requests) {
      if (new Date(r.job.endTime) > now) continue;

      const toUserId =
        r.jobSeekerUserId === userId ? r.job.employerUserId : r.jobSeekerUserId;
      if (!toUserId) continue;

      const exists = await prisma.rating.findUnique({
        where: {
          fromUserId_toUserId_jobId: {
            fromUserId: userId,
            toUserId,
            jobId: r.jobId,
          },
        },
      });

      if (!exists)
        pending.push({ jobId: r.jobId, jobTitle: r.job.title, toUserId });
    }

    res.json(pending);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /ratings/me  →  дундаж + тоо
export const getUserRating = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const userId = authReq.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const m = 5; // threshold

    const [userStats, globalStats] = await Promise.all([
      prisma.rating.aggregate({
        where: { toUserId: userId },
        _avg: { score: true },
        _count: { score: true },
      }),
      prisma.rating.aggregate({
        _avg: { score: true },
      }),
    ]);

    const v = userStats._count.score;
    const R = userStats._avg.score ?? 0;
    const C = globalStats._avg.score ?? 3.8;

    const bayesian = v > 0 ? (R * v + C * m) / (v + m) : null;

    res.json({
      average: bayesian ? Math.round(bayesian * 10) / 10 : null,
      count: v,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /ratings/me/details  →  дэлгэрэнгүй жагсаалт (ямар ажил, хэн үнэлсэн, comment)
export const getMyRatingDetails = async (
  req: Request,
  res: Response,
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
      orderBy: { createdAt: 'desc' },
      include: {
        // ямар ажил дээр үнэлгээ авсан
        job: {
          select: { title: true },
        },
        // хэн үнэлсэн
        fromUser: {
          include: {
            employer: { select: { employerName: true } },
            jobSeeker: { select: { userName: true } },
          },
        },
      },
    });

    res.json(ratings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /ratings/user/:id  →  JobSeekerHome дахь employer-ийн үнэлгээ
export const getRatingsByUserId = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const targetUserId = Number(req.params.id);
    if (isNaN(targetUserId)) {
      res.status(400).json({ message: 'Invalid user id' });
      return;
    }

    const ratings = await prisma.rating.findMany({
      where: { toUserId: targetUserId },
      orderBy: { createdAt: 'desc' },
      include: {
        job: {
          select: { title: true },
        },
        fromUser: {
          include: {
            employer: { select: { employerName: true } },
            jobSeeker: { select: { userName: true } },
          },
        },
      },
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
