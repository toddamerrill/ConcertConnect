import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class ValidationError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string) {
    super(message);
    this.statusCode = 400;
    this.isOperational = true;
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(resource: string) {
    super(`${resource} not found`);
    this.statusCode = 404;
    this.isOperational = true;
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string = 'Unauthorized') {
    super(message);
    this.statusCode = 401;
    this.isOperational = true;
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string = 'Forbidden') {
    super(message);
    this.statusCode = 403;
    this.isOperational = true;
    this.name = 'ForbiddenError';
  }
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { statusCode = 500, message } = error;

  // Log error details
  logger.error({
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Send user-friendly response
  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal server error' : message,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack 
    })
  });
};