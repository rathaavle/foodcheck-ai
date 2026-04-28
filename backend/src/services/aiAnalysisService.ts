import axios from "axios";
import { AnalysisResult } from "../types";
import { validateRiskLevel } from "./riskClassifier";

/**
 * Custom error for Azure OpenAI failures → HTTP 502
 */
export class AiAnalysisError extends Error {
  readonly statusCode = 502;
  constructor(
    message = "Analisis AI tidak tersedia saat ini. Silakan coba beberapa saat lagi.",
  ) {
    super(message);
    this.name = "AiAnalysisError";
  }
}

const SYSTEM_PROMPT = `Anda adalah analis kandungan makanan yang ahli. Tugas Anda adalah menganalisis teks label makanan dan mengidentifikasi bahan-bahan serta risiko kesehatannya.

Ikuti aturan klasifikasi risiko berikut:
- HIGH: Terdeteksi kadar gula tinggi, kadar sodium tinggi, atau pengawet berbahaya
- MEDIUM: Terdeteksi aditif ringan atau flavor enhancer
- LOW: Tidak ditemukan kandungan berbahaya atau berisiko

Kembalikan HANYA JSON valid dengan struktur berikut (tanpa teks tambahan apapun):
{
  "ingredients": ["daftar", "semua", "bahan"],
  "risk_level": "HIGH" | "MEDIUM" | "LOW",
  "flagged_items": ["subset", "bahan", "berisiko"],
  "explanation": "Penjelasan dalam bahasa Indonesia yang mudah dipahami pengguna awam"
}

Aturan penting:
- flagged_items harus merupakan subset dari ingredients
- Jika risk_level adalah LOW, flagged_items harus berupa array kosong []
- Jika risk_level adalah HIGH atau MEDIUM, flagged_items tidak boleh kosong
- Penjelasan harus dalam bahasa Indonesia dan mudah dipahami`;

/**
 * Sends food label text to Azure OpenAI for analysis and returns structured AnalysisResult.
 *
 * @param text - Food label text (in Indonesian or original language)
 * @returns AnalysisResult with ingredients, risk_level, flagged_items, and explanation
 * @throws AiAnalysisError when Azure OpenAI is unavailable or returns an invalid response
 */
export async function analyzeText(text: string): Promise<AnalysisResult> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION ?? "2024-02-01";

  if (!endpoint || !apiKey || !deploymentName) {
    throw new AiAnalysisError();
  }

  const url = `${endpoint.replace(/\/$/, "")}/openai/deployments/${deploymentName}/chat/completions?api-version=${apiVersion}`;
  console.log("[OpenAI] url:", url);

  let rawContent: string;

  try {
    const response = await axios.post(
      url,
      {
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Analisis teks label makanan berikut:\n\n${text}`,
          },
        ],
        temperature: 0,
        max_tokens: 1000,
      },
      {
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json",
        },
      },
    );

    rawContent = response.data?.choices?.[0]?.message?.content;
    console.log("[OpenAI] raw response:", rawContent);

    if (!rawContent) {
      throw new AiAnalysisError();
    }
  } catch (err) {
    if (err instanceof AiAnalysisError) throw err;
    console.error("[OpenAI] error:", (err as Error).message);
    if (axios.isAxiosError(err)) {
      console.error("[OpenAI] status:", err.response?.status);
      console.error("[OpenAI] data:", JSON.stringify(err.response?.data));
    }
    throw new AiAnalysisError();
  }

  return parseAnalysisResponse(rawContent);
}

/**
 * Parses the raw JSON string from Azure OpenAI into a validated AnalysisResult.
 */
function parseAnalysisResponse(rawContent: string): AnalysisResult {
  let parsed: unknown;

  try {
    // Strip markdown code fences if present (e.g. ```json ... ```)
    const cleaned = rawContent
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    throw new AiAnalysisError();
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as Record<string, unknown>).ingredients) ||
    !Array.isArray((parsed as Record<string, unknown>).flagged_items) ||
    typeof (parsed as Record<string, unknown>).risk_level !== "string" ||
    typeof (parsed as Record<string, unknown>).explanation !== "string"
  ) {
    throw new AiAnalysisError();
  }

  const raw = parsed as {
    ingredients: unknown[];
    risk_level: string;
    flagged_items: unknown[];
    explanation: string;
  };

  let risk_level: AnalysisResult["risk_level"];
  try {
    risk_level = validateRiskLevel(raw.risk_level);
  } catch {
    throw new AiAnalysisError();
  }

  const ingredients = raw.ingredients.filter(
    (item): item is string => typeof item === "string",
  );
  const flagged_items = raw.flagged_items.filter(
    (item): item is string => typeof item === "string",
  );

  return {
    ingredients,
    risk_level,
    flagged_items,
    explanation: raw.explanation,
  };
}

// Keep backward-compatible export alias used by existing route code (if any)
export { analyzeText as analyzeIngredients };
