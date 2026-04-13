import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middleware/auth.middleware';
import { sendToUser } from '../notifications/sse';

// POST /jobs
export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'EMPLOYER') {
      return res.status(403).json({ message: 'Зөвшөөрөлгүй' });
    }

    const {
      title,
      description,
      location,
      category,
      salary,
      startTime,
      endTime,
      isTemplate,
      latitude,
      longitude,
      numberOfWorker,
    } = req.body;

    if (
      !title ||
      !description ||
      !location ||
      !category ||
      !salary ||
      !startTime ||
      !endTime ||
      !numberOfWorker
    ) {
      return res.status(400).json({ message: 'Мэдээлэл дутуу' });
    }

    if (Number(salary) <= 0) {
      return res.status(400).json({ message: 'Цалин буруу утгатай' });
    }

    if (new Date(endTime) <= new Date(startTime)) {
      return res.status(400).json({
        message: 'Дуусах цаг эхлэх цагаас хойш байх ёстой',
      });
    }

    const job = await prisma.job.create({
      data: {
        title,
        description,
        location,
        category: {
          connectOrCreate: {
            where: { name: category },
            create: { name: category },
          },
        },
        employer: {
          connect: { employerId: req.user.userId },
        },
        salary: Number(salary),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        isTemplate: Boolean(isTemplate),
        latitude: latitude ? Number(latitude) : null,
        longitude: longitude ? Number(longitude) : null,
        numberOfWorker: Number(numberOfWorker),
      },
    });

    return res.status(201).json({ job });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /jobs
export const getJobs = async (_req: Request, res: Response) => {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        employer: { select: { employerName: true } },
        category: { select: { categoryId: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(jobs);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /jobs/:id
export const getJobById = async (req: Request, res: Response) => {
  try {
    const jobId = Number(req.params.id);

    if (isNaN(jobId)) {
      return res.status(400).json({ message: 'Job ID буруу' });
    }

    const job = await prisma.job.findUnique({
      where: { jobId },
      include: {
        employer: {
          select: {
            employerId: true,
            employerName: true,
            phoneNumber: true,
          },
        },
        category: { select: { categoryId: true, name: true } },
      },
    });

    if (!job) {
      return res.status(404).json({ message: 'Ажил олдсонгүй' });
    }

    return res.json(job);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /jobs/my
export const getMyJobs = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'EMPLOYER') {
      return res.status(403).json({ message: 'Зөвшөөрөлгүй' });
    }

    const jobs = await prisma.job.findMany({
      where: {
        employerId: req.user.userId,
        isTemplate: true,
      },
      select: {
        jobId: true,
        title: true,
        description: true,
        location: true,
        category: { select: { categoryId: true, name: true } },
        salary: true,
        startTime: true,
        endTime: true,
        numberOfWorker: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(jobs);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /jobs/template/:id
export const removeTemplate = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'EMPLOYER') {
      return res.status(403).json({ message: 'Зөвшөөрөлгүй' });
    }

    const jobId = Number(req.params.id);
    if (isNaN(jobId)) {
      return res.status(400).json({ message: 'Job ID буруу' });
    }

    const template = await prisma.job.findFirst({
      where: {
        jobId,
        employerId: req.user.userId,
        isTemplate: true,
      },
    });

    if (!template) {
      return res.status(404).json({ message: 'Template олдсонгүй' });
    }

    await prisma.job.update({
      where: { jobId },
      data: { isTemplate: false },
    });

    return res.json({ message: 'Template амжилттай устгагдлаа' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /jobs/nearby?lat=..&lng=..&radius=..
export const getNearbyJobs = async (req: Request, res: Response) => {
  try {
    const latParam = req.query.lat as string;
    const lngParam = req.query.lng as string;
    const radiusParam = req.query.radius as string;

    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);
    const radius = radiusParam ? parseFloat(radiusParam) : 500;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ message: 'lat/lng required' });
    }

    const rawJobs = await prisma.$queryRawUnsafe<{ jobId: number }[]>(`
      SELECT *
      FROM (
        SELECT *,
          (
            6371000 * acos(
              cos(radians(${lat}))
              * cos(radians("latitude"))
              * cos(radians("longitude") - radians(${lng}))
              + sin(radians(${lat}))
              * sin(radians("latitude"))
            )
          ) AS distance
        FROM "Job"
        WHERE "latitude" IS NOT NULL
        AND "longitude" IS NOT NULL
      ) AS sub
      WHERE distance <= ${radius}
      ORDER BY distance ASC
    `);

    const jobIds = rawJobs.map((j) => j.jobId);

    const jobs = await prisma.job.findMany({
      where: { jobId: { in: jobIds } },
      include: {
        category: true,
        employer: { select: { employerName: true } },
      },
    });

    const ordered = jobIds
      .map((id) => jobs.find((j) => j.jobId === id))
      .filter(Boolean);

    return res.json(ordered);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /jobs/:id/seekers?filterAvailability=true&filterCategory=true
export const getMatchingSeekers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'EMPLOYER') {
      return res.status(403).json({ message: 'Зөвшөөрөлгүй' });
    }

    const jobId = Number(req.params.id);
    if (isNaN(jobId)) {
      return res.status(400).json({ message: 'Job ID буруу' });
    }

    const filterAvailability = req.query.filterAvailability === 'true';
    const filterCategory = req.query.filterCategory === 'true';

    const job = await prisma.job.findUnique({
      where: { jobId },
      include: { category: true },
    });

    if (!job) return res.status(404).json({ message: 'Ажил олдсонгүй' });

    const where: Record<string, unknown> = {};
    if (filterCategory) {
      where.interestedCategoryId = job.categoryId;
    }

    let seekers = await prisma.jobSeeker.findMany({
      where,
      include: {
        interestedCategory: true,
        availabilities: true,
        user: {
          include: { ratingsReceived: { select: { score: true } } },
        },
      },
    });

    if (filterAvailability) {
      const jobStart = new Date(job.startTime);
      const jobEnd = new Date(job.endTime);

      // job span-д орох бүх weekday цуглуулна
      const jobDays = new Set<number>();
      const cursor = new Date(jobStart);
      while (cursor <= jobEnd) {
        jobDays.add(cursor.getDay()); // 0=Sun..6=Sat
        cursor.setDate(cursor.getDate() + 1);
      }

      const toMinutes = (d: Date) => d.getHours() * 60 + d.getMinutes();
      const jobStartMin = toMinutes(jobStart);
      const jobEndMin = toMinutes(jobEnd);

      seekers = seekers.filter((s) =>
        s.availabilities.some((a) => {
          if (!jobDays.has(a.day)) return false;
          const aStart = toMinutes(new Date(a.startTime));
          const aEnd = toMinutes(new Date(a.endTime));
          return aStart < jobEndMin && aEnd > jobStartMin;
        }),
      );
    }

    const result = seekers.map((s) => {
      const scores = s.user.ratingsReceived.map((r) => r.score);
      return {
        jobseekerId: s.jobseekerId,
        userName: s.userName ?? 'Нэргүй',
        skills: s.skills ?? null,
        interestedCategory: s.interestedCategory?.name ?? null,
        avgRating:
          scores.length > 0
            ? Math.round(
                (scores.reduce((a, b) => a + b, 0) / scores.length) * 10,
              ) / 10
            : null,
        ratingCount: scores.length,
        availabilities: s.availabilities.map((a) => ({
          day: a.day,
          startTime: a.startTime,
          endTime: a.endTime,
        })),
      };
    });

    return res.json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /jobs/:id/my-status — current user-ийн энэ job-д request/invite байгаа эсэх
export const getMyJobStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const jobId = Number(req.params.id);
    if (isNaN(jobId)) return res.status(400).json({ message: 'ID буруу' });

    const request = await prisma.request.findUnique({
      where: { jobSeekerId_jobId: { jobSeekerId: req.user.userId, jobId } },
      select: { requestId: true, type: true, status: true },
    });

    if (!request) return res.json({ kind: null });

    return res.json({
      kind: request.type === 'JOB_INVITE' ? 'invite' : 'request',
      requestId: request.requestId,
      status: request.status,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// POST /jobs/:id/invite/:seekerId
export const inviteSeeker = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'EMPLOYER') {
      return res.status(403).json({ message: 'Зөвшөөрөлгүй' });
    }

    const jobId = Number(req.params.id);
    const seekerId = Number(req.params.seekerId);

    if (isNaN(jobId) || isNaN(seekerId)) {
      return res.status(400).json({ message: 'ID буруу' });
    }

    const job = await prisma.job.findFirst({
      where: { jobId, employerId: req.user.userId },
    });
    if (!job) return res.status(404).json({ message: 'Ажил олдсонгүй' });

    const seeker = await prisma.jobSeeker.findUnique({
      where: { jobseekerId: seekerId },
    });
    if (!seeker) return res.status(404).json({ message: 'Ажил хайгч олдсонгүй' });

    const existing = await prisma.request.findUnique({
      where: { jobSeekerId_jobId: { jobSeekerId: seekerId, jobId } },
    });
    if (existing) {
      return res.status(409).json({ message: 'Ажлын санал аль хэдийн илгээгдсэн' });
    }

    await prisma.request.create({
      data: { jobSeekerId: seekerId, jobId, type: 'JOB_INVITE', status: 'PENDING' },
    });

    const inviteNotif = await prisma.notification.create({
      data: {
        userId: seekerId,
        jobId,
        title: 'Ажлын санал ирлээ',
        message: `${job.title} ажлын байранд санал ирлээ`,
        type: 'JOB_INVITED',
      },
    });
    sendToUser(seekerId, inviteNotif);

    return res.json({ message: 'Ажлын санал амжилттай илгээгдлээ' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};