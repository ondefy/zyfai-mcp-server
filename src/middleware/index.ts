/**
 * Express Middleware
 */

import { Request, Response, NextFunction } from "express";

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
}

/**
 * Global error handler
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
}

/**
 * 404 handler
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: "Not found",
    path: req.path,
  });
}
