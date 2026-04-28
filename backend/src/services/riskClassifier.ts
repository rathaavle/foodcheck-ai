import { AnalysisResult } from "../types";

/**
 * Validates and normalizes the risk_level value from AI response.
 * Accepts case-insensitive input and returns the canonical uppercase form.
 * Throws if the value is not a valid risk level.
 */
export function validateRiskLevel(value: string): AnalysisResult["risk_level"] {
  const normalized = value?.trim().toUpperCase();
  if (
    normalized === "HIGH" ||
    normalized === "MEDIUM" ||
    normalized === "LOW"
  ) {
    return normalized;
  }
  throw new Error(
    `Nilai risk_level tidak valid: "${value}". Harus salah satu dari HIGH, MEDIUM, atau LOW.`,
  );
}
