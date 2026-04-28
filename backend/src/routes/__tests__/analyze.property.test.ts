// Feature: foodcheck-ai, Property 3: request tanpa gambar selalu ditolak

/**
 * Validates: Requirements 1.4
 *
 * IF pengguna belum memilih atau mengambil gambar,
 * THEN THE Sistem SHALL menolak permintaan analisis
 * dan menampilkan pesan kesalahan "Silakan pilih atau ambil gambar terlebih dahulu".
 */

import * as fc from "fast-check";
import express from "express";
import request from "supertest";
import { analyzeRouter } from "../analyze";

// Build a minimal Express app that mounts the analyzeRouter
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/", analyzeRouter);
  return app;
}

const app = buildApp();

describe("Property 3: request tanpa gambar selalu ditolak", () => {
  /**
   * Validates: Requirements 1.4
   *
   * Property: For ANY request body that does NOT include an `image` file field,
   * the server MUST respond with HTTP 400 and { status: "ERROR" }.
   */
  it("selalu mengembalikan HTTP 400 dan status ERROR untuk request tanpa field image", async () => {
    // Arbitrary for various body shapes without an image field
    const bodyArbitrary = fc.oneof(
      // Empty body
      fc.constant({}),
      // Body with random string fields (no image)
      fc.record({
        someField: fc.string(),
      }),
      // Body with multiple random fields
      fc.record({
        name: fc.string(),
        value: fc.string(),
        count: fc.integer(),
      }),
      // Body with null/undefined-like values
      fc.record({
        image: fc.constant(null),
      }),
      // Body with empty string for image
      fc.record({
        image: fc.constant(""),
      }),
      // Body with non-file image value (string, not a file upload)
      fc.record({
        image: fc.string({ minLength: 1 }),
      }),
      // Completely random key-value pairs
      fc.dictionary(
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s !== "image"),
        fc.string(),
      ),
    );

    await fc.assert(
      fc.asyncProperty(bodyArbitrary, async (body) => {
        const res = await request(app)
          .post("/analyze")
          .send(body)
          .set("Content-Type", "application/json");

        expect(res.status).toBe(400);
        expect(res.body.status).toBe("ERROR");
      }),
      { numRuns: 100 },
    );
  });
});
