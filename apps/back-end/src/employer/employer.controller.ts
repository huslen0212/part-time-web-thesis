import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /employer
//ajil olgogchiin medeelel avah
export const getEmployerProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const user = req.user;

  if (!user || user.role !== 'EMPLOYER') {
    res.status(403).json({ message: 'Зөвхөн ажил олгогч' });
    return;
  }

  // employer profile-iig  DB tatna
  const profile = await prisma.employer.findUnique({
    where: { employerId: user.userId },
    include: {
      user: {
        select: { email: true, phoneNumber: true, createdAt: true },
      },
      // tuhain employeriin oruulsan ajiluud
      jobs: {
        orderBy: { createdAt: 'desc' },
        select: {
          jobId: true,
          title: true,
          location: true,
          category: true,
          salary: true,
          startTime: true,
          endTime: true,
          createdAt: true,
          // ajil buriin request-iin toog avna
          _count: { select: { requests: true } },
        },
      },
    },
  });

  if (!profile) {
    res.status(404).json({ message: 'Профайл олдсонгүй' });
    return;
  }

  //frontend ruu yvuulah data
  res.json({
    employerName: profile.employerName,
    phoneNumber: profile.user.phoneNumber,
    createdAt: profile.createdAt,
    email: profile.user.email,
    userCreatedAt: profile.user.createdAt,
    jobs: profile.jobs,
  });
};

// GET /employer/:id  →  public
//ajil haigchid ajil olgogchiin medeelel + ajluud + rating-iig butsaana
export const getPublicEmployerProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ message: 'Invalid id' });
    return;
  }

  const profile = await prisma.employer.findUnique({
    where: { employerId: id },
    include: {
      user: { select: { phoneNumber: true } },
      jobs: {
        orderBy: { createdAt: 'desc' },
        select: {
          jobId: true,
          title: true,
          location: true,
          category: true,
          salary: true,
          startTime: true,
          endTime: true,
          createdAt: true,
          _count: { select: { requests: true } },
        },
      },
    },
  });

  if (!profile) {
    res.status(404).json({ message: 'Олдсонгүй' });
    return;
  }

  const ratings = await prisma.rating.findMany({
    where: { toUserId: id },
    orderBy: { createdAt: 'desc' },
    include: {
      job: { select: { title: true } },
      fromUser: {
        include: {
          jobSeeker: { select: { userName: true } },
        },
      },
    },
  });

  const avg =
    ratings.length > 0
      ? ratings.reduce((s, r) => s + r.score, 0) / ratings.length
      : null;

  res.json({
    employerName: profile.employerName,
    phoneNumber: profile.user.phoneNumber,
    createdAt: profile.createdAt,
    jobs: profile.jobs,
    rating: {
      average: avg ? Math.round(avg * 10) / 10 : null,
      count: ratings.length,
      items: ratings,
    },
  });
};

// PUT /employer
//ajil olgogchiin medeelel shinchleh
export const updateEmployerProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const user = req.user;
  const { email, employerName, phoneNumber } = req.body;

  if (!user || user.role !== 'EMPLOYER') {
    res.status(403).json({ message: 'Зөвхөн ажил олгогч засах боломжтой' });
    return;
  }

  // employer table update
  await prisma.employer.update({
    where: { employerId: user.userId },
    data: {
      employerName: employerName ?? undefined,
    },
  });

  if (email || phoneNumber) {
    await prisma.user.update({
      where: { userId: user.userId },
      data: {
        email: email ?? undefined,
        phoneNumber: phoneNumber ?? undefined,
      },
    });
  }

  res.json({ success: true });
};
