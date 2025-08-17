import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';

const router = express.Router();

// Get user profile by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profileImageUrl: true,
        location: true,
        musicPreferences: true,
        createdAt: true
      }
    });

    if (!user) {
      throw new NotFoundError('User');
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});

// Search users
router.get('/', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q || typeof q !== 'string') {
      throw new ValidationError('Search query is required');
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: req.user!.id } }, // Exclude current user
          {
            OR: [
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } }
            ]
          }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profileImageUrl: true,
        location: true
      },
      take: Math.min(parseInt(limit as string), 50)
    });

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    next(error);
  }
});

// Get user's friends
router.get('/:id/friends', async (req, res, next) => {
  try {
    const { id } = req.params;

    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: id, status: 'accepted' },
          { addresseeId: id, status: 'accepted' }
        ]
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true
          }
        },
        addressee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true
          }
        }
      }
    });

    // Extract friends (the other person in each friendship)
    const friends = friendships.map(friendship => {
      return friendship.requesterId === id 
        ? friendship.addressee 
        : friendship.requester;
    });

    res.json({
      success: true,
      data: { friends }
    });
  } catch (error) {
    next(error);
  }
});

export { router as userRoutes };