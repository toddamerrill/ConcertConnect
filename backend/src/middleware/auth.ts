import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from './errorHandler';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('Access token required');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      logger.error('JWT_SECRET not configured');
      throw new Error('Authentication configuration error');
    }

    try {
      // Try to verify as JWT token first
      const decoded = jwt.verify(token, secret) as any;
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
      next();
    } catch (jwtError) {
      // If JWT verification fails, try email-based auth for NextAuth integration
      if (token.includes('@')) {
        // This looks like an email, try to find user by email
        const { prisma } = await import('../lib/prisma');
        const user = await prisma.user.findUnique({
          where: { email: token },
          select: {
            id: true,
            email: true,
          }
        });

        if (user) {
          req.user = {
            id: user.id,
            email: user.email,
          };
          next();
          return;
        }
      }
      
      // If both JWT and email auth fail, throw error
      if (jwtError instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      } else if (jwtError instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      } else {
        throw jwtError;
      }
    }
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const secret = process.env.JWT_SECRET;
      if (secret) {
        const decoded = jwt.verify(token, secret) as any;
        req.user = {
          id: decoded.userId,
          email: decoded.email,
          role: decoded.role
        };
      }
    }

    next();
  } catch (error) {
    // For optional auth, we don't throw errors, just continue without user
    next();
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!req.user.role || !roles.includes(req.user.role)) {
      return next(new UnauthorizedError('Insufficient permissions'));
    }

    next();
  };
};