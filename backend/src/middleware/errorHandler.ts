import { Request, Response, NextFunction } from 'express';
import { logger } from '@/services/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Erro interno do servidor';

  logger.error('unhandled_error', {
    message: error.message,
    url: req.url,
    method: req.method
  });

  res.status(statusCode).json({
    error: {
      message,
      status: statusCode,
      timestamp: new Date().toISOString(),
      path: req.url
    }
  });
};
