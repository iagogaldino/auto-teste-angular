import { Request, Response, NextFunction } from 'express';

export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    error: {
      message: `Rota não encontrada: ${req.method} ${req.url}`,
      status: 404,
      timestamp: new Date().toISOString(),
      path: req.url
    }
  });
};
