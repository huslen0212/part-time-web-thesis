import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middleware/auth.middleware';

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
        select: { email: true, createdAt: true },
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
    phoneNumber: profile.phoneNumber,
    createdAt: profile.createdAt,
    email: profile.user.email,
    userCreatedAt: profile.user.createdAt,
    jobs: profile.jobs,
  });
};

// employer profile zasah
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
      // value bvl update hiigd, baihgui bol huucin heveer ni uldeene
      employerName: employerName ?? undefined,
      phoneNumber: phoneNumber ?? undefined,
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