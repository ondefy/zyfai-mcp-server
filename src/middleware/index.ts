/**
 * Express Middleware
 */

import { Request, Response, NextFunction } from "express";

/**
 * Export x402 middleware
 */
export {
  x402Middleware,
  x402PaymentMiddleware,
  X402Middleware,
} from "./x402.middleware.js";

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
