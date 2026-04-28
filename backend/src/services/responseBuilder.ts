import { AnalysisResult, ApiResponse } from "../types";

/**
 * Build a successful ApiResponse with analysis data.
 */
export function buildSuccess(data: AnalysisResult): ApiResponse {
  return {
    status: "SUCCESS",
    data,
  };
}

/**
 * Build a successful ApiResponse with analysis data and a non-fatal warning
 * (e.g. translation was unavailable).
 */
export function buildSuccessWithWarning(
  data: AnalysisResult,
  warning: string,
): ApiResponse {
  return {
    status: "SUCCESS",
    warning,
    data,
  };
}

/**
 * Build an error ApiResponse with a user-facing message.
 */
export function buildError(message: string): ApiResponse {
  return {
    status: "ERROR",
    message,
  };
}
