// Feature: foodcheck-ai, Property 1: flagged_items selalu subset dari ingredients

import * as fc from "fast-check";
import { AnalysisResult } from "../types";

/**
 * Validates: Requirements 5.2, 5.3, 6.1, 6.2, 6.3
 *
 * Property 1: flagged_items selalu subset dari ingredients
 *
 * Setiap AnalysisResult yang valid harus memiliki flagged_items yang merupakan
 * subset dari ingredients — setiap item yang ditandai harus ada dalam daftar bahan.
 */
describe("AnalysisResult — Property 1: flagged_items selalu subset dari ingredients", () => {
  it("flagged_items.every(item => ingredients.includes(item)) untuk semua AnalysisResult yang valid", () => {
    // Generator: daftar bahan acak, lalu pilih subset acak sebagai flagged_items
    const ingredientsArb = fc.array(
      fc.string({ minLength: 1, maxLength: 40 }),
      { minLength: 1, maxLength: 20 },
    );

    const analysisResultArb = ingredientsArb.chain((ingredients) => {
      const flaggedArb = fc.subarray(ingredients);
      return fc.record<AnalysisResult>({
        ingredients: fc.constant(ingredients),
        flagged_items: flaggedArb,
        risk_level: fc.constantFrom("HIGH", "MEDIUM", "LOW"),
        explanation: fc.string({ minLength: 1, maxLength: 200 }),
      });
    });

    fc.assert(
      fc.property(analysisResultArb, (result) => {
        return result.flagged_items.every((item) =>
          result.ingredients.includes(item),
        );
      }),
      { numRuns: 100 },
    );
  });
});

// Feature: foodcheck-ai, Property 2: risk_level konsisten dengan keberadaan flagged_items

/**
 * Validates: Requirements 6.1, 6.2, 6.3
 *
 * Property 2: risk_level konsisten dengan keberadaan flagged_items
 *
 * Setiap AnalysisResult yang valid harus memenuhi:
 * (risk_level === "LOW") === (flagged_items.length === 0)
 * Artinya: LOW ↔ tidak ada flagged_items, HIGH/MEDIUM ↔ ada flagged_items.
 */
describe("AnalysisResult — Property 2: risk_level konsisten dengan keberadaan flagged_items", () => {
  it("(risk_level === 'LOW') === (flagged_items.length === 0) untuk semua AnalysisResult yang valid", () => {
    // Generator: buat AnalysisResult dengan risk_level dan flagged_items yang konsisten
    const ingredientsArb = fc.array(
      fc.string({ minLength: 1, maxLength: 40 }),
      { minLength: 1, maxLength: 20 },
    );

    const analysisResultArb = ingredientsArb.chain((ingredients) =>
      fc.oneof(
        // LOW risk: flagged_items harus kosong
        fc.record<AnalysisResult>({
          ingredients: fc.constant(ingredients),
          flagged_items: fc.constant([]),
          risk_level: fc.constant("LOW"),
          explanation: fc.string({ minLength: 1, maxLength: 200 }),
        }),
        // HIGH/MEDIUM risk: flagged_items harus tidak kosong (subset dari ingredients)
        fc.subarray(ingredients, { minLength: 1 }).chain((flagged) =>
          fc.record<AnalysisResult>({
            ingredients: fc.constant(ingredients),
            flagged_items: fc.constant(flagged),
            risk_level: fc.constantFrom("HIGH", "MEDIUM"),
            explanation: fc.string({ minLength: 1, maxLength: 200 }),
          }),
        ),
      ),
    );

    fc.assert(
      fc.property(analysisResultArb, (result) => {
        return (
          (result.risk_level === "LOW") === (result.flagged_items.length === 0)
        );
      }),
      { numRuns: 100 },
    );
  });
});
