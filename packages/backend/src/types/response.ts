import type { Response } from "express";

export interface ApiSuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
  meta?: Record<string, any>;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  code?: string;
  details?: any;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  meta?: Record<string, any>,
  statusCode: number = 200
) {
  const payload: ApiSuccessResponse<T> = {
    success: true,
    data,
  };
  if (message) payload.message = message;
  if (meta) payload.meta = meta;
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  code?: string,
  details?: any
) {
  const payload: ApiErrorResponse = {
    success: false,
    message,
  };
  if (code) payload.code = code;
  if (details !== undefined) payload.details = details;
  return res.status(statusCode).json(payload);
}
