import { AnalysisResult } from "../types";

// TODO: Validasi dan format risk_level dari respons AI
// Pastikan nilai risk_level adalah "HIGH" | "MEDIUM" | "LOW"
export function validateRiskLevel(value: string): AnalysisResult["risk_level"] {
  throw new Error("Not implemented");
}
