import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { prisma } from '../utils/prisma';

export const validateWebsiteExists = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const website = await prisma.website.findFirst({
      where: {
        id: req.params.websiteId,
        userId: req.userId!,
      },
    });
    if (!website) {
      return res.status(404).json({ error: 'Website not found or not authorized' });
    }
    req.website = website;
    next();
  } catch (error: any) {
    console.error('Website validation error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};
