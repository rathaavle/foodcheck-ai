import { Request, Response, NextFunction } from "express";
import { OcrFailureError, OcrEmptyTextError } from "../services/ocrService";
import { AiAnalysisError } from "../services/aiAnalysisService";
import { buildError } from "../services/responseBuilder";

/**
 * Centralised Express error-handling middleware.
 *
 * Maps known custom error types (and generic network/timeout errors) to the
 * appropriate HTTP status code and user-facing message defined in the design doc.
 *
 * Must be registered AFTER all routes:
 *   app.use(errorHandler);
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // OCR failure (Azure error) → 502
  if (err instanceof OcrFailureError) {
    res.status(502).json(buildError(err.message));
    return;
  }

  // Empty / unreadable text → 422
  if (err instanceof OcrEmptyTextError) {
    res.status(422).json(buildError(err.message));
    return;
  }

  // OpenAI analysis failure → 502
  if (err instanceof AiAnalysisError) {
    res.status(502).json(buildError(err.message));
    return;
  }

  // Network / connection / timeout errors → 503
  if (isNetworkError(err)) {
    res
      .status(503)
      .json(
        buildError(
          "Gagal terhubung ke server. Periksa koneksi internet Anda dan coba lagi.",
        ),
      );
    return;
  }

  // Fallback for unexpected errors — do not leak internal details
  res
    .status(500)
    .json(
      buildError(
        "Terjadi kesalahan internal. Silakan coba beberapa saat lagi.",
      ),
    );
}

/**
 * Heuristic to detect network / connectivity / timeout errors from axios or Node.js.
 */
function isNetworkError(err: Error): boolean {
  const networkCodes = new Set([
    "ECONNREFUSED",
    "ECONNRESET",
    "ENOTFOUND",
    "ETIMEDOUT",
    "ECONNABORTED",
    "ERR_NETWORK",
  ]);

  // axios wraps network errors with a `code` property
  const code = (err as NodeJS.ErrnoException).code;
  if (code && networkCodes.has(code)) return true;

  // axios timeout / network error flag
  const axiosErr = err as { isAxiosError?: boolean; code?: string };
  if (axiosErr.isAxiosError && axiosErr.code === "ECONNABORTED") return true;

  return false;
}
