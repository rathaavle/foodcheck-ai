import { OcrResult, TranslationResult } from "../types";

// TODO: Implementasi integrasi Azure Translator
// Deteksi bahasa dari OcrResult; jika bukan "id", terjemahkan ke bahasa Indonesia
export async function translateIfNeeded(
  ocrResult: OcrResult,
): Promise<TranslationResult | null> {
  throw new Error("Not implemented");
}
