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
      isTemplate, // ⭐ ЭНД АВНА
    } = req.body;

    if (
      !title ||
      !description ||
      !location ||
      !category ||
      !salary ||
      !startTime ||
      !endTime
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
