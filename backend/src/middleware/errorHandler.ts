import { Request, Response, NextFunction } from "express";

// TODO: Middleware Express terpusat untuk semua error
// Petakan jenis error ke HTTP status dan pesan yang sesuai
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // TODO: Implementasi error mapping
}
