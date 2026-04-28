export interface OcrResult {
  raw_text: string; // Teks mentah hasil ekstraksi OCR
  language: string; // Kode bahasa terdeteksi, misal: "en", "id", "zh"
}

export interface TranslationResult {
  translated_text: string; // Teks hasil terjemahan ke bahasa Indonesia
}

export interface AnalysisResult {
  ingredients: string[]; // Daftar semua bahan yang teridentifikasi
  risk_level: "HIGH" | "MEDIUM" | "LOW"; // Tingkat risiko kesehatan
  flagged_items: string[]; // Subset ingredients yang teridentifikasi berisiko
  explanation: string; // Penjelasan dalam bahasa Indonesia untuk pengguna awam
}

export interface ApiResponse {
  status: "SUCCESS" | "ERROR";
  warning?: string; // Opsional: notifikasi non-fatal (misal: terjemahan gagal)
  data?: AnalysisResult; // Ada jika status SUCCESS
  message?: string; // Ada jika status ERROR
}
