import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_for_diplom';

// AuthRequest interface-g Request-s urgeljluuleh
export interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: 'JOB_SEEKER' | 'EMPLOYER';
    userName: string;
  };
}

// token shalgah middleware
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Token байхгүй' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthRequest['user'];
    req.user = decoded;
    next();
    return;
  } catch {
    res.status(401).json({ message: 'Token хүчингүй' });
    return;
  }
};
