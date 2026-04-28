import { AnalysisResult, ApiResponse } from "../types";

// TODO: Bentuk ApiResponse final
// Tangani kasus: sukses normal, sukses dengan warning terjemahan, error
export function buildSuccess(
  data: AnalysisResult,
  warning?: string,
): ApiResponse {
  throw new Error("Not implemented");
}

export function buildError(message: string): ApiResponse {
  throw new Error("Not implemented");
}
