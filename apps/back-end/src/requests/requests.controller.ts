import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const createRequest = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;
    const { jobId, workerCount = 1 } = req.body;

    if (!user) {
      res.status(401).json({ message: 'Нэвтрээгүй байна' });
      return;
    }

    if (user.role !== 'JOB_SEEKER') {
      res
        .status(403)
        .json({ message: 'Зөвхөн ажил хайгч хүсэлт илгээнэ' });
      return;
    }

    const jobSeekerId = user.userId;

    const exists = await prisma.request.findUnique({
      where: {
        jobSeekerId_jobId: {
          jobSeekerId,
          jobId: Number(jobId),
        },
      },
    });

    if (exists) {
      res
        .status(400)
        .json({ message: 'Та аль хэдийн хүсэлт илгээсэн байна' });
      return;
    }

    const request = await prisma.request.create({
      data: {
        jobSeekerId,
        jobId: Number(jobId),
        workerCount: Number(workerCount),
      },
    });

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Хүсэлт илгээхэд алдаа гарлаа' });
  }
};

export const getEmployerRequests = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;

    if (!user || user.role !== 'EMPLOYER') {
      res.status(403).json({ message: 'Зөвхөн ажил олгогч хандана' });
      return;
    }

    const employerId = user.userId;

    const requests = await prisma.request.findMany({
      where: {
        job: {
          employerId,
        },
      },
      include: {
        job: {
          select: {
            jobId: true,
            title: true,
            description: true,
          },
        },
        jobSeeker: {
          select: {
            userName: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Хүсэлтүүдийг авахад алдаа гарлаа' });
  }
};

export const getMyRequests = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const user = req.user;

  if (!user || user.role !== 'JOB_SEEKER') {
    res.status(403).json({ message: 'Зөвхөн ажил хайгч' });
    return;
  }

  const requests = await prisma.request.findMany({
    where: {
      jobSeekerId: user.userId,
    },
    include: {
      job: {
        select: {
          jobId: true,
          title: true,
          description: true,
          location: true,
          category: true,
          startTime: true,
          endTime: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json(requests);
};

export const updateRequestStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;
    const { requestId } = req.params;
    const { status } = req.body;

    if (!user || user.role !== 'EMPLOYER') {
      res.status(403).json({ message: 'Зөвхөн ажил олгогч' });
      return;
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({ message: 'Буруу статус' });
      return;
    }

    const request = await prisma.request.findFirst({
      where: {
        requestId: Number(requestId),
        job: {
          employerId: user.userId,
        },
      },
      include: {
        job: true,
      },
    });

    if (!request) {
      res.status(404).json({ message: 'Хүсэлт олдсонгүй' });
      return;
    }

    const result = await prisma.$transaction(async (tx) => {
      const approvedRequest = await tx.request.update({
        where: { requestId: request.requestId },
        data: { status },
      });

      if (status === 'APPROVED') {
        const start = request.job.startTime;
        const end = request.job.endTime;

        await tx.request.updateMany({
          where: {
            jobSeekerId: request.jobSeekerId,
            status: 'PENDING',
            requestId: {
              not: request.requestId,
            },
            job: {
              AND: [
                { startTime: { lte: end } },
                { endTime: { gte: start } },
              ],
            },
          },
          data: {
            status: 'CANCEL',
          },
        });
      }

      return approvedRequest;
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Статус өөрчлөхөд алдаа гарлаа' });
  }
};
