import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendToUser } from '../notifications/sse';

// POST /requests
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
    
    const jobSeekerUserId = user.userId;

    //ali hediin huselt ilgeesen esehiig shalgana
    const exists = await prisma.request.findUnique({
      where: {
        jobSeekerUserId_jobId: {
          jobSeekerUserId,
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

  // request-iig DB-s hadgalna
  const request = await prisma.request.create({
    data: {
      jobSeekerUserId,
      jobId: Number(jobId),
      workerCount: Number(workerCount),
    },
    include: {
      job: true,
    },
  });

  // Employer-d notification
  const notif = await prisma.notification.create({
    data: {
      userId: request.job.employerUserId,
      jobId: request.job.jobId,
      title: 'Шинэ хүсэлт ирлээ',
      message: `${request.job.title} ажилд шинэ хүсэлт ирлээ`,
      type: 'REQUEST_CREATED',
    },
  });
  sendToUser(request.job.employerUserId, notif);

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Хүсэлт илгээхэд алдаа гарлаа' });
  }
};

// GET /requests/employer
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

    const employerUserId = user.userId;

    // tuhain employer-iin ajluudiin request-uudiig avna
    const requests = await prisma.request.findMany({
      where: {
        job: {
          employerUserId,
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
            jobseekerId: true,
            userName: true,
            user: { select: { phoneNumber: true } },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const mapped = requests.map((r) => ({
      ...r,
      jobSeeker: {
        jobseekerId: r.jobSeeker.jobseekerId,
        userName: r.jobSeeker.userName,
        phoneNumber: r.jobSeeker.user?.phoneNumber ?? null,
      },
    }));

    res.json(mapped);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Хүсэлтүүдийг авахад алдаа гарлаа' });
  }
};

// GET /requests/me
//ajil haigchiin ooriin ilgeesen huseltiin jagsaalt avah
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
      jobSeekerUserId: user.userId,
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

// PATCH /requests/:requestId
//ajil olgogch huselt batalgaajuulah esvel tatgalzah (APPROVED/REJECTED)
//APPROVED bol davhardsan hugatsaatai oher huseltüüdiig CANCEL bolgono
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
          employerUserId: user.userId,
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
            jobSeekerUserId: request.jobSeekerUserId,
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

  const statusNotif = await tx.notification.create({
    data: {
      userId: request.jobSeekerUserId,
      jobId: request.job.jobId,
      title:
        status === 'APPROVED'
          ? 'Таны хүсэлт батлагдлаа'
          : 'Таны хүсэлт татгалзлаа',
      message:
        status === 'APPROVED'
          ? `${request.job.title} ажилд таны хүсэлтийг зөвшөөрлөө`
          : `${request.job.title} ажилд таны хүсэлтийг татгалзлаа`,
      type:
        status === 'APPROVED'
          ? 'REQUEST_APPROVED'
          : 'REQUEST_REJECTED',
    },
  });
  sendToUser(request.jobSeekerUserId, statusNotif);

      return approvedRequest;
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Статус өөрчлөхөд алдаа гарлаа' });
  }
};

// GET /requests/me/invites — JOB_INVITE type-тэй request-уудыг job мэдээлэлтэй буцаана
export const getMyInviteRequests = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const user = req.user;
  if (!user || user.role !== 'JOB_SEEKER') {
    res.status(403).json({ message: 'Зөвхөн ажил хайгч' });
    return;
  }

  const invites = await prisma.request.findMany({
    where: { jobSeekerUserId: user.userId, type: 'JOB_INVITE' },
    include: {
      job: {
        select: {
          jobId: true,
          title: true,
          location: true,
          salary: true,
          startTime: true,
          endTime: true,
          category: { select: { name: true } },
          employer: { select: { employerName: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(invites);
};

// PATCH /requests/:requestId/invite-response — JOB_SEEKER invite зөвшөөрөх/татгалзах
export const respondToInvite = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;
    if (!user || user.role !== 'JOB_SEEKER') {
      res.status(403).json({ message: 'Зөвхөн ажил хайгч' });
      return;
    }

    const { action } = req.body as { action: 'accept' | 'reject' };
    if (!['accept', 'reject'].includes(action)) {
      res.status(400).json({ message: 'Буруу action' });
      return;
    }

    const requestId = Number(req.params.requestId);
    const invite = await prisma.request.findFirst({
      where: { requestId, jobSeekerUserId: user.userId, type: 'JOB_INVITE' },
      include: { job: true },
    });

    if (!invite) {
      res.status(404).json({ message: 'Ажлын санал олдсонгүй' });
      return;
    }

    if (action === 'accept') {
      await prisma.$transaction(async (tx) => {
        await tx.request.update({
          where: { requestId },
          data: { status: 'APPROVED' },
        });
        // Давхардсан хүлээгдэж буй хүсэлтүүд цуцлах
        await tx.request.updateMany({
          where: {
            jobSeekerUserId: user.userId,
            status: 'PENDING',
            requestId: { not: requestId },
            job: {
              AND: [
                { startTime: { lte: invite.job.endTime } },
                { endTime: { gte: invite.job.startTime } },
              ],
            },
          },
          data: { status: 'CANCEL' },
        });
      });
      res.json({ message: 'Зөвшөөрлөө' });
    } else {
      await prisma.request.update({
        where: { requestId },
        data: { status: 'REJECTED' },
      });
      res.json({ message: 'Татгалзлаа' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Алдаа гарлаа' });
  }
};

