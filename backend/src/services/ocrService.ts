import axios from "axios";
import { OcrResult } from "../types";

/**
 * Custom error for OCR failures (Azure error) → HTTP 502
 */
export class OcrFailureError extends Error {
  readonly statusCode = 502;
  constructor(
    message = "Gagal membaca teks dari gambar. Pastikan gambar cukup jelas dan coba lagi.",
  ) {
    super(message);
    this.name = "OcrFailureError";
  }
}

/**
 * Custom error for empty/unreadable text → HTTP 422
 */
export class OcrEmptyTextError extends Error {
  readonly statusCode = 422;
  constructor(
    message = "Teks tidak dapat dikenali. Pastikan gambar label terlihat jelas dan coba unggah ulang.",
  ) {
    super(message);
    this.name = "OcrEmptyTextError";
  }
}

/**
 * Send image buffer to Azure Document Intelligence and return extracted text + language.
 *
 * @param imageBuffer - Raw image bytes
 * @param mimeType    - MIME type of the image (e.g. "image/jpeg")
 * @returns OcrResult with raw_text and detected language
 * @throws OcrFailureError  when Azure returns an error
 * @throws OcrEmptyTextError when no text could be extracted
 */
export async function extractTextFromImage(
  imageBuffer: Buffer,
  mimeType: string,
): Promise<OcrResult> {
  const endpoint = process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  const apiKey = process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

  if (!endpoint || !apiKey) {
    throw new OcrFailureError();
  }

  // Azure Document Intelligence REST API — prebuilt-read model
  const analyzeUrl = `${endpoint.replace(/\/$/, "")}/documentintelligence/documentModels/prebuilt-read:analyze?api-version=2024-02-29-preview`;

  let operationLocation: string;

  try {
    const submitResponse = await axios.post(analyzeUrl, imageBuffer, {
      headers: {
        "Ocp-Apim-Subscription-Key": apiKey,
        "Content-Type": mimeType,
      },
    });

    operationLocation = submitResponse.headers["operation-location"] as string;

    if (!operationLocation) {
      throw new OcrFailureError();
    }
  } catch (err) {
    if (err instanceof OcrFailureError) throw err;
    throw new OcrFailureError();
  }

  // Poll until the operation completes
  const result = await pollForResult(operationLocation, apiKey);

  return result;
}

async function pollForResult(
  operationLocation: string,
  apiKey: string,
  maxAttempts = 10,
  intervalMs = 1000,
): Promise<OcrResult> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await sleep(intervalMs);

    let data: AzureAnalyzeResult;
    try {
      const pollResponse = await axios.get(operationLocation, {
        headers: { "Ocp-Apim-Subscription-Key": apiKey },
      });
      data = pollResponse.data as AzureAnalyzeResult;
    } catch {
      throw new OcrFailureError();
    }

    if (data.status === "failed") {
      throw new OcrFailureError();
    }

    if (data.status === "succeeded") {
      return parseAnalyzeResult(data);
    }
    // status === "running" | "notStarted" → keep polling
  }

  // Timed out waiting for Azure
  throw new OcrFailureError();
}

function parseAnalyzeResult(data: AzureAnalyzeResult): OcrResult {
  const pages = data.analyzeResult?.pages ?? [];
  const lines: string[] = [];

  for (const page of pages) {
    for (const line of page.lines ?? []) {
      if (line.content) lines.push(line.content);
    }
  }

  const raw_text = lines.join("\n").trim();

  if (!raw_text) {
    throw new OcrEmptyTextError();
  }

  // Language is reported at the document level; fall back to "unknown"
  const language = data.analyzeResult?.languages?.[0]?.locale ?? "unknown";

  return { raw_text, language };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Minimal Azure response shape ────────────────────────────────────────────

interface AzureAnalyzeResult {
  status: "notStarted" | "running" | "succeeded" | "failed";
  analyzeResult?: {
    pages?: Array<{
      lines?: Array<{ content: string }>;
    }>;
    languages?: Array<{ locale: string }>;
  };
}
