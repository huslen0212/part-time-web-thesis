import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { AuthRequest } from '../middleware/auth.middleware';

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
        category,
        salary: Number(salary),
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        employerId: req.user.userId,
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
        employer: {
          select: { employerName: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
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
            employerName: true,
          },
        },
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
        category: true,
        salary: true,
        startTime: true,
        endTime: true,
        numberOfWorker: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.json(jobs);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PATCH /jobs/template/:id
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
      return res.status(404).json({
        message: 'Template олдсонгүй',
      });
    }

    await prisma.job.update({
      where: { jobId },
      data: {
        isTemplate: false,
      },
    });

    return res.json({
      message: 'Template амжилттай устгагдлаа (soft)',
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

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

    const jobs = await prisma.$queryRawUnsafe(`
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

    return res.json(jobs);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};