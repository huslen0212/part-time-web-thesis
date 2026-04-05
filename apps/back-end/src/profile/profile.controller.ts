import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /profile
export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user;

  if (!user || user.role !== 'JOB_SEEKER') {
    res.status(403).json({ message: 'Зөвхөн ажил хайгч' });
    return;
  }

  // job seeker-iin profile-iig DB-s avna
  const profile = await prisma.jobSeeker.findUnique({
    where: { jobseekerId: user.userId },
    include: {
      user: { select: { email: true } },
    },
  });

  if (!profile) {
    res.status(404).json({ message: 'Profile олдсонгүй' });
    return;
  }

  // frontend ruu yvuulah data
  res.json({
    email: profile.user.email,
    userName: profile.userName,
    phoneNumber: profile.phoneNumber,
    birthDate: profile.birthDate,
    gender: profile.gender,
    address: profile.address,
  });
};

// GET /profile/jobseeker/:id  →  public
export const getPublicJobSeekerProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ message: 'Invalid id' }); return; }

  const seeker = await prisma.jobSeeker.findUnique({
    where: { jobseekerId: id },
    select: {
      userName: true,
      phoneNumber: true,
      gender: true,
      address: true,
      createdAt: true,
    },
  });

  if (!seeker) { res.status(404).json({ message: 'Олдсонгүй' }); return; }

  // Гүйцэтгэсэн ажлын түүх
  const requests = await prisma.request.findMany({
    where: { jobSeekerId: id, status: 'APPROVED' },
    include: {
      job: {
        select: {
          title: true,
          category: true,
          location: true,
          salary: true,
          startTime: true,
          endTime: true,
          employer: { select: { employerName: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Үнэлгээ
  const ratings = await prisma.rating.findMany({
    where: { toUserId: id },
    orderBy: { createdAt: 'desc' },
    include: {
      job: { select: { title: true } },
      fromUser: {
        include: {
          employer: { select: { employerName: true } },
          jobSeeker: { select: { userName: true } },
        },
      },
    },
  });

  const avg = ratings.length > 0
    ? ratings.reduce((s, r) => s + r.score, 0) / ratings.length
    : null;

  res.json({
    ...seeker,
    workHistory: requests,
    rating: {
      average: avg ? Math.round(avg * 10) / 10 : null,
      count: ratings.length,
      items: ratings,
    },
  });
};

// PATCH /profile
export const updateMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user;
  const { email, userName, phoneNumber, birthDate, gender, address } = req.body;

  if (!user || user.role !== 'JOB_SEEKER') {
    res.status(403).json({ message: 'Зөвхөн ажил хайгч' });
    return;
  }

  // job seeker-iin profile-iig shinechlene
  await prisma.jobSeeker.update({
    where: { jobseekerId: user.userId },
    data: {
      userName,
      phoneNumber,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      gender: gender || undefined,
      address: address || undefined,
    },
  });

  if (email) {
    await prisma.user.update({
      where: { userId: user.userId },
      data: { email },
    });
  }

  res.json({ success: true });
};