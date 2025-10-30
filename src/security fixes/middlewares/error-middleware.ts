import { Request, Response, NextFunction } from 'express';

const notFound = async (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not Found ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err: any, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  const isProd = process.env.NODE_ENV === 'production';
  res.status(statusCode).json({
    success: false,
    message: isProd ? 'Something went wrong' : (err?.message || 'Error'),
  });
};

export { notFound, errorHandler };
