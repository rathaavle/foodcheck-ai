import { OcrResult } from "../types";

// TODO: Implementasi integrasi Azure Document Intelligence
// Kirim gambar ke Azure Document Intelligence, parse respons menjadi OcrResult
export async function extractText(imageBuffer: Buffer): Promise<OcrResult> {
  throw new Error("Not implemented");
}
