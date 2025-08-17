import express from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { NotFoundError, ValidationError, ForbiddenError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const router = express.Router();

// Send friend request
router.post('/friends/request', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    if (userId === req.user!.id) {
      throw new ValidationError('Cannot send friend request to yourself');
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      throw new NotFoundError('User');
    }

    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: req.user!.id, addresseeId: userId },
          { requesterId: userId, addresseeId: req.user!.id }
        ]
      }
    });

    if (existingFriendship) {
      throw new ValidationError('Friendship request already exists or users are already friends');
    }

    // Create friend request
    const friendship = await prisma.friendship.create({
      data: {
        requesterId: req.user!.id,
        addresseeId: userId,
        status: 'pending'
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

    logger.info(`Friend request sent from ${req.user!.email} to user ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Friend request sent successfully',
      data: { friendship }
    });
  } catch (error) {
    next(error);
  }
});

// Respond to friend request
router.patch('/friends/request/:id', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'accept', 'decline', 'block'

    if (!['accept', 'decline', 'block'].includes(action)) {
      throw new ValidationError('Invalid action. Must be: accept, decline, or block');
    }

    // Find the friendship request
    const friendship = await prisma.friendship.findUnique({
      where: { id },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true
          }
        }
      }
    });

    if (!friendship) {
      throw new NotFoundError('Friend request');
    }

    // Only the addressee can respond to the request
    if (friendship.addresseeId !== req.user!.id) {
      throw new ForbiddenError('You can only respond to friend requests sent to you');
    }

    // Update friendship status
    const statusMap = {
      accept: 'accepted',
      decline: 'pending', // Will be deleted
      block: 'blocked'
    };

    if (action === 'decline') {
      // Delete the friendship request
      await prisma.friendship.delete({
        where: { id }
      });

      res.json({
        success: true,
        message: 'Friend request declined'
      });
    } else {
      // Update status
      const updatedFriendship = await prisma.friendship.update({
        where: { id },
        data: { status: statusMap[action] },
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

      logger.info(`Friend request ${action}ed by ${req.user!.email}`);

      res.json({
        success: true,
        message: `Friend request ${action}ed successfully`,
        data: { friendship: updatedFriendship }
      });
    }
  } catch (error) {
    next(error);
  }
});

// Get friend requests (received)
router.get('/friends/requests', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const requests = await prisma.friendship.findMany({
      where: {
        addresseeId: req.user!.id,
        status: 'pending'
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: { requests }
    });
  } catch (error) {
    next(error);
  }
});

// Get user's friends
router.get('/friends', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: req.user!.id, status: 'accepted' },
          { addresseeId: req.user!.id, status: 'accepted' }
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
      return friendship.requesterId === req.user!.id 
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

// Remove friend
router.delete('/friends/:userId', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { userId } = req.params;

    const deleted = await prisma.friendship.deleteMany({
      where: {
        OR: [
          { requesterId: req.user!.id, addresseeId: userId },
          { requesterId: userId, addresseeId: req.user!.id }
        ],
        status: 'accepted'
      }
    });

    if (deleted.count === 0) {
      throw new NotFoundError('Friendship');
    }

    logger.info(`Friendship removed between ${req.user!.email} and user ${userId}`);

    res.json({
      success: true,
      message: 'Friend removed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Create social post
router.post('/posts', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { content, eventId, imageUrl } = req.body;

    if (!content || content.trim().length === 0) {
      throw new ValidationError('Post content is required');
    }

    if (content.length > 1000) {
      throw new ValidationError('Post content cannot exceed 1000 characters');
    }

    // If eventId is provided, verify it exists
    if (eventId) {
      const event = await prisma.event.findUnique({
        where: { id: eventId }
      });

      if (!event) {
        throw new NotFoundError('Event');
      }
    }

    const post = await prisma.socialPost.create({
      data: {
        userId: req.user!.id,
        content: content.trim(),
        eventId: eventId || null,
        imageUrl: imageUrl || null
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            artistName: true,
            venueName: true,
            eventDate: true
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: { post }
    });
  } catch (error) {
    next(error);
  }
});

// Get social feed
router.get('/posts', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { page = 0, limit = 20 } = req.query;

    // Get user's friends to include their posts in feed
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: req.user!.id, status: 'accepted' },
          { addresseeId: req.user!.id, status: 'accepted' }
        ]
      }
    });

    const friendIds = friendships.map(friendship => {
      return friendship.requesterId === req.user!.id 
        ? friendship.addresseeId 
        : friendship.requesterId;
    });

    // Include user's own posts and friends' posts
    const userIds = [req.user!.id, ...friendIds];

    const posts = await prisma.socialPost.findMany({
      where: {
        userId: { in: userIds }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            artistName: true,
            venueName: true,
            eventDate: true
          }
        },
        likes: {
          where: {
            userId: req.user!.id
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: parseInt(page as string) * parseInt(limit as string),
      take: parseInt(limit as string)
    });

    // Add isLiked flag for current user
    const postsWithLikeStatus = posts.map(post => ({
      ...post,
      isLiked: post.likes.length > 0,
      likes: undefined // Remove the likes array, keep only the count
    }));

    res.json({
      success: true,
      data: { posts: postsWithLikeStatus }
    });
  } catch (error) {
    next(error);
  }
});

// Like/unlike post
router.post('/posts/:id/like', authenticateToken, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    // Check if post exists
    const post = await prisma.socialPost.findUnique({
      where: { id }
    });

    if (!post) {
      throw new NotFoundError('Post');
    }

    // Check if already liked
    const existingLike = await prisma.socialLike.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: req.user!.id
        }
      }
    });

    if (existingLike) {
      // Unlike
      await prisma.socialLike.delete({
        where: {
          postId_userId: {
            postId: id,
            userId: req.user!.id
          }
        }
      });

      res.json({
        success: true,
        message: 'Post unliked',
        data: { liked: false }
      });
    } else {
      // Like
      await prisma.socialLike.create({
        data: {
          postId: id,
          userId: req.user!.id
        }
      });

      res.json({
        success: true,
        message: 'Post liked',
        data: { liked: true }
      });
    }
  } catch (error) {
    next(error);
  }
});

export { router as socialRoutes };