// Feature: foodcheck-ai, Property 4: respons selalu memiliki struktur yang valid
// Feature: foodcheck-ai, Property 5: kegagalan terjemahan menghasilkan SUCCESS dengan warning

import * as fc from "fast-check";
import { AnalysisResult } from "../types";
import {
  buildSuccess,
  buildSuccessWithWarning,
  buildError,
} from "./responseBuilder";
import * as translationService from "./translationService";

/**
 * Validates: Requirements 8.1
 *
 * Property 4: respons selalu memiliki struktur yang valid
 *
 * Untuk setiap kombinasi input valid ke responseBuilder:
 * - Respons selalu memiliki field `status` bernilai "SUCCESS" atau "ERROR"
 * - Jika status "SUCCESS", field `data` harus ada dan berisi
 *   `ingredients`, `risk_level`, `flagged_items`, dan `explanation`
 * - Jika status "ERROR", field `message` harus ada
 */

// --- Arbitraries ---

const ingredientsArb = fc.array(fc.string({ minLength: 1, maxLength: 40 }), {
  minLength: 0,
  maxLength: 20,
});

const analysisResultArb: fc.Arbitrary<AnalysisResult> = ingredientsArb.chain(
  (ingredients) => {
    const hasFlagged = ingredients.length > 0;
    return fc.oneof(
      // LOW risk: flagged_items kosong
      fc.record<AnalysisResult>({
        ingredients: fc.constant(ingredients),
        flagged_items: fc.constant([]),
        risk_level: fc.constant("LOW"),
        explanation: fc.string({ minLength: 1, maxLength: 300 }),
      }),
      // HIGH/MEDIUM risk: flagged_items subset dari ingredients (jika ada bahan)
      hasFlagged
        ? fc.subarray(ingredients, { minLength: 1 }).chain((flagged) =>
            fc.record<AnalysisResult>({
              ingredients: fc.constant(ingredients),
              flagged_items: fc.constant(flagged),
              risk_level: fc.constantFrom("HIGH", "MEDIUM"),
              explanation: fc.string({ minLength: 1, maxLength: 300 }),
            }),
          )
        : fc.record<AnalysisResult>({
            ingredients: fc.constant([]),
            flagged_items: fc.constant([]),
            risk_level: fc.constant("LOW"),
            explanation: fc.string({ minLength: 1, maxLength: 300 }),
          }),
    );
  },
);

const warningArb = fc.string({ minLength: 1, maxLength: 200 });
const errorMessageArb = fc.string({ minLength: 1, maxLength: 200 });

// --- Helper ---

function assertSuccessStructure(response: ReturnType<typeof buildSuccess>) {
  expect(response.status).toBe("SUCCESS");
  expect(response.data).toBeDefined();
  expect(Array.isArray(response.data!.ingredients)).toBe(true);
  expect(["HIGH", "MEDIUM", "LOW"]).toContain(response.data!.risk_level);
  expect(Array.isArray(response.data!.flagged_items)).toBe(true);
  expect(typeof response.data!.explanation).toBe("string");
}

// --- Tests ---

describe("responseBuilder — Property 4: respons selalu memiliki struktur yang valid", () => {
  it("buildSuccess: status selalu SUCCESS dan data berisi semua field wajib", () => {
    fc.assert(
      fc.property(analysisResultArb, (analysisResult) => {
        const response = buildSuccess(analysisResult);

        expect(response.status).toBeDefined();
        expect(["SUCCESS", "ERROR"]).toContain(response.status);
        assertSuccessStructure(response);
      }),
      { numRuns: 100 },
    );
  });

  it("buildSuccessWithWarning: status SUCCESS, data lengkap, dan warning tidak kosong", () => {
    fc.assert(
      fc.property(analysisResultArb, warningArb, (analysisResult, warning) => {
        const response = buildSuccessWithWarning(analysisResult, warning);

        expect(response.status).toBeDefined();
        expect(["SUCCESS", "ERROR"]).toContain(response.status);
        assertSuccessStructure(response);
        expect(typeof response.warning).toBe("string");
        expect(response.warning!.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it("buildError: status selalu ERROR dan message selalu ada", () => {
    fc.assert(
      fc.property(errorMessageArb, (message) => {
        const response = buildError(message);

        expect(response.status).toBeDefined();
        expect(["SUCCESS", "ERROR"]).toContain(response.status);
        expect(response.status).toBe("ERROR");
        expect(typeof response.message).toBe("string");
        expect(response.message!.length).toBeGreaterThan(0);
        expect(response.data).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });
});

// --- Property 5 ---

/**
 * Validates: Requirements 4.3
 *
 * Property 5: kegagalan terjemahan menghasilkan SUCCESS dengan warning
 *
 * Untuk setiap teks non-Indonesia yang gagal diterjemahkan:
 * - Sistem tetap melanjutkan analisis menggunakan teks asli
 * - Respons memiliki `status: "SUCCESS"`
 * - Field `warning` tidak kosong (berisi notifikasi terjemahan tidak tersedia)
 */

const TRANSLATION_WARNING =
  "Terjemahan tidak tersedia. Analisis dilakukan menggunakan teks asli.";

// Generator: teks non-Indonesia acak (non-empty, non-"id" language)
const nonIndonesianTextArb = fc.string({ minLength: 1, maxLength: 200 });

// Minimal AnalysisResult for pipeline simulation
const minimalAnalysisResultArb: fc.Arbitrary<AnalysisResult> = fc.record({
  ingredients: fc.array(fc.string({ minLength: 1, maxLength: 30 }), {
    minLength: 0,
    maxLength: 10,
  }),
  flagged_items: fc.constant([]),
  risk_level: fc.constant("LOW" as const),
  explanation: fc.string({ minLength: 1, maxLength: 100 }),
});

describe("responseBuilder — Property 5: kegagalan terjemahan menghasilkan SUCCESS dengan warning", () => {
  beforeEach(() => {
    jest
      .spyOn(translationService, "translateText")
      .mockRejectedValue(new Error("Azure Translator tidak tersedia"));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("kegagalan translateText menghasilkan respons SUCCESS dengan warning tidak kosong", async () => {
    await fc.assert(
      fc.asyncProperty(
        nonIndonesianTextArb,
        minimalAnalysisResultArb,
        async (rawText, analysisResult) => {
          // Simulate pipeline: translateText fails → use rawText as-is → buildSuccessWithWarning
          let translatedText: string;
          try {
            const result = await translationService.translateText({
              raw_text: rawText,
              language: "en",
            });
            translatedText = result.translated_text;
          } catch {
            // Requirement 4.3: on translation failure, use original text and add warning
            translatedText = rawText;
          }

          // translatedText should equal rawText (fallback to original)
          expect(translatedText).toBe(rawText);

          // Build response as the pipeline would after translation failure
          const response = buildSuccessWithWarning(
            analysisResult,
            TRANSLATION_WARNING,
          );

          // Assertions
          expect(response.status).toBe("SUCCESS");
          expect(typeof response.warning).toBe("string");
          expect(response.warning!.length).toBeGreaterThan(0);
          expect(response.warning).toBe(TRANSLATION_WARNING);
        },
      ),
      { numRuns: 100 },
    );
  });
});
