import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middleware/auth.middleware';

export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user;

  if (!user || user.role !== 'JOB_SEEKER') {
    res.status(403).json({ message: 'Зөвхөн ажил хайгч' });
    return;
  }

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

  res.json({
    email: profile.user.email,
    userName: profile.userName,
    phoneNumber: profile.phoneNumber,
    birthDate: profile.birthDate,
    gender: profile.gender,
    address: profile.address,
  });
};

export const updateMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user;
  const { email, userName, phoneNumber, birthDate, gender, address } = req.body;

  if (!user || user.role !== 'JOB_SEEKER') {
    res.status(403).json({ message: 'Зөвхөн ажил хайгч' });
    return;
  }

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