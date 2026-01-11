import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { signToken } from './jwt';


/// REGISTER
export const register = async (req: Request, res: Response) => {
  try {
    const { user, jobSeeker, employer } = req.body;

    if (!user?.email || !user?.password || !user?.role) {
      return res.status(400).json({ message: 'Мэдээлэл дутуу' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'И-мэйл аль хэдийн бүртгэлтэй',
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: user.email,
          password: user.password,
          role: user.role,
        },
      });

      if (user.role === 'JOB_SEEKER') {
        await tx.jobSeeker.create({
          data: {
            jobseekerId: createdUser.userId,
            userName: jobSeeker?.userName ?? null,
            phoneNumber: jobSeeker?.phoneNumber ?? null,
          },
        });
      }

      if (user.role === 'EMPLOYER') {
        await tx.employer.create({
          data: {
            employerId: createdUser.userId,
            employerName: employer?.employerName ?? null,
            phoneNumber: employer?.phoneNumber ?? null,
          },
        });
      }

      return createdUser;
    });

    return res.status(201).json({
      message: 'Бүртгэл амжилттай',
      userId: result.userId,
      role: result.role,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// LOGIN
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email эсвэл password дутуу' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        jobSeeker: true,
        employer: true,
      },
    });

    if (!user) {
      return res.status(400).json({ message: 'Хэрэглэгч олдсонгүй' });
    }

    if (user.password !== password) {
      return res.status(400).json({ message: 'Имэйл эсвэл нууц үг буруу байна' });
    }

    const userName =
      user.jobSeeker?.userName ??
      user.employer?.employerName ??
      user.email;

    const token = signToken({
      userId: user.userId,
      role: user.role,
      userName,
    });

    return res.json({
      message: 'Амжилттай нэвтэрлээ',
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};

