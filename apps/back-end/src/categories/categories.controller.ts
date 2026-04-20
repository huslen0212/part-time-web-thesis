import { Request, Response } from 'express';
import { prisma } from '../prisma';

// GET /categories
// Buh category-iig nereer usuh daraallaar tatna
export const getCategories = async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
    return res.json(categories);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};
