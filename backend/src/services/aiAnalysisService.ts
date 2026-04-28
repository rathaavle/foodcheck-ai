import { AnalysisResult } from "../types";

// TODO: Implementasi integrasi Azure OpenAI
// Kirim teks ke Azure OpenAI dengan system prompt panduan klasifikasi risiko
// Parse respons JSON menjadi AnalysisResult
export async function analyzeIngredients(
  text: string,
): Promise<AnalysisResult> {
  throw new Error("Not implemented");
}
