import axios from "axios";
import { OcrResult, TranslationResult } from "../types";

/**
 * Menerjemahkan teks ke bahasa Indonesia menggunakan Azure Translator.
 * Jika bahasa sudah Indonesia ("id"), kembalikan teks asli tanpa terjemahan.
 * Jika terjemahan gagal, lempar error agar caller dapat menanganinya sebagai non-fatal.
 */
export async function translateText(
  ocrResult: OcrResult,
): Promise<TranslationResult> {
  // Jika sudah bahasa Indonesia, skip terjemahan
  if (ocrResult.language === "id") {
    return { translated_text: ocrResult.raw_text };
  }

  const endpoint = process.env.AZURE_TRANSLATOR_ENDPOINT;
  const key = process.env.AZURE_TRANSLATOR_KEY;
  const region = process.env.AZURE_TRANSLATOR_REGION;

  if (!endpoint || !key || !region) {
    throw new Error(
      "Konfigurasi Azure Translator tidak lengkap. Periksa environment variables.",
    );
  }

  const url = `${endpoint}/translate?api-version=3.0&to=id`;

  const response = await axios.post(url, [{ Text: ocrResult.raw_text }], {
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Ocp-Apim-Subscription-Region": region,
      "Content-Type": "application/json",
    },
  });

  const translated = response.data?.[0]?.translations?.[0]?.text;

  if (!translated) {
    throw new Error(
      "Respons Azure Translator tidak mengandung hasil terjemahan.",
    );
  }

  return { translated_text: translated };
}
