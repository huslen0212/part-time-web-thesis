import { Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middleware/auth.middleware';

// GET /profile
export const getMyProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const user = req.user;

  if (!user || user.role !== 'JOB_SEEKER') {
    res.status(403).json({ message: 'Зөвхөн ажил хайгч' });
    return;
  }

  const profile = await prisma.jobSeeker.findUnique({
    where: { jobseekerId: user.userId },
    include: {
      user: { select: { email: true } },
      interestedCategories: {
        include: { category: { select: { categoryId: true, name: true } } },
      },
      availabilities: { orderBy: [{ day: 'asc' }, { startTime: 'asc' }] },
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
    skills: profile.skills,
    interestedCategories: profile.interestedCategories.map((jc) => jc.category),
    availabilities: profile.availabilities,
  });
};

// GET /profile/jobseeker/:id  →  public
export const getPublicJobSeekerProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ message: 'Invalid id' });
    return;
  }

  const seeker = await prisma.jobSeeker.findUnique({
    where: { jobseekerId: id },
    select: {
      userName: true,
      phoneNumber: true,
      gender: true,
      address: true,
      skills: true,
      createdAt: true,
      interestedCategories: {
        include: { category: { select: { categoryId: true, name: true } } },
      },
      availabilities: { orderBy: [{ day: 'asc' }, { startTime: 'asc' }] },
    },
  });

  if (!seeker) {
    res.status(404).json({ message: 'Олдсонгүй' });
    return;
  }

  const requests = await prisma.request.findMany({
    where: { jobSeekerId: id, status: 'APPROVED' },
    include: {
      job: {
        select: {
          title: true,
          category: { select: { name: true } },
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

  const avg =
    ratings.length > 0
      ? ratings.reduce((s, r) => s + r.score, 0) / ratings.length
      : null;

  res.json({
    ...seeker,
    interestedCategories: seeker.interestedCategories.map((jc) => jc.category),
    workHistory: requests,
    rating: {
      average: avg ? Math.round(avg * 10) / 10 : null,
      count: ratings.length,
      items: ratings,
    },
  });
};

// PUT /profile
export const updateMyProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const user = req.user;
  const {
    email,
    userName,
    phoneNumber,
    birthDate,
    gender,
    address,
    skills,
    interestedCategoryNames,
  } = req.body;

  if (!user || user.role !== 'JOB_SEEKER') {
    res.status(403).json({ message: 'Зөвхөн ажил хайгч' });
    return;
  }

  let categoryIds: number[] = [];
  if (
    Array.isArray(interestedCategoryNames) &&
    interestedCategoryNames.length > 0
  ) {
    const cats = await Promise.all(
      interestedCategoryNames.map((name: string) =>
        prisma.category.upsert({
          where: { name },
          create: { name },
          update: {},
        }),
      ),
    );
    categoryIds = cats.map((c) => c.categoryId);
  }

  await prisma.jobSeeker.update({
    where: { jobseekerId: user.userId },
    data: {
      userName,
      phoneNumber,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      gender: gender || undefined,
      address: address || undefined,
      skills: skills !== undefined ? skills : undefined,
      interestedCategories: {
        deleteMany: {},
        create: categoryIds.map((categoryId) => ({ categoryId })),
      },
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

// POST /profile/availability
export const addAvailability = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const user = req.user;
  if (!user || user.role !== 'JOB_SEEKER') {
    res.status(403).json({ message: 'Зөвхөн ажил хайгч' });
    return;
  }

  const { day, startTime, endTime } = req.body;

  if (day === undefined || !startTime || !endTime) {
    res.status(400).json({ message: 'Мэдээлэл дутуу' });
    return;
  }

  if (new Date(endTime) <= new Date(startTime)) {
    res
      .status(400)
      .json({ message: 'Дуусах цаг эхлэх цагаас хойш байх ёстой' });
    return;
  }

  const availability = await prisma.availabilityTime.create({
    data: {
      jobSeekerId: user.userId,
      day: Number(day),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    },
  });

  res.status(201).json(availability);
};

// DELETE /profile/availability/:id
export const deleteAvailability = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  const user = req.user;
  if (!user || user.role !== 'JOB_SEEKER') {
    res.status(403).json({ message: 'Зөвхөн ажил хайгч' });
    return;
  }

  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ message: 'ID буруу' });
    return;
  }

  const existing = await prisma.availabilityTime.findFirst({
    where: { id, jobSeekerId: user.userId },
  });

  if (!existing) {
    res.status(404).json({ message: 'Олдсонгүй' });
    return;
  }

  await prisma.availabilityTime.delete({ where: { id } });
  res.json({ success: true });
};
