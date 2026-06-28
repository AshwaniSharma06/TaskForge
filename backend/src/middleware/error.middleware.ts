import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Unhandled Error]:', err.stack || err.message || err);
  
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'An unexpected error occurred';
  
  res.status(statusCode).json({
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};
