/**
 * Unit tests untuk validasi input endpoint POST /analyze
 * Validates: Requirements 1.4
 *
 * IF pengguna belum memilih atau mengambil gambar,
 * THEN THE Sistem SHALL menolak permintaan analisis
 * dan menampilkan pesan kesalahan "Silakan pilih atau ambil gambar terlebih dahulu".
 */

import express from "express";
import request from "supertest";
import { analyzeRouter } from "../analyze";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/", analyzeRouter);
  return app;
}

const app = buildApp();

describe("POST /analyze — validasi input gambar", () => {
  describe("Kasus 1: field image ada", () => {
    it("harus meneruskan request (tidak mengembalikan HTTP 400 dari validasi)", async () => {
      const res = await request(app)
        .post("/analyze")
        .attach("image", Buffer.from("fake-image-data"), {
          filename: "label.jpg",
          contentType: "image/jpeg",
        });

      // Validasi input lolos — tidak boleh 400
      expect(res.status).not.toBe(400);
      // Respons harus memiliki field status
      expect(res.body).toHaveProperty("status");
    });
  });

  describe("Kasus 2: field image tidak ada", () => {
    it("harus mengembalikan HTTP 400 jika tidak ada file yang dikirim", async () => {
      const res = await request(app).post("/analyze");

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("ERROR");
      expect(res.body.message).toBe(
        "Silakan pilih atau ambil gambar terlebih dahulu",
      );
    });

    it("harus mengembalikan HTTP 400 jika body JSON dikirim tanpa file", async () => {
      const res = await request(app)
        .post("/analyze")
        .send({ someData: "nilai" })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("ERROR");
      expect(res.body.message).toBe(
        "Silakan pilih atau ambil gambar terlebih dahulu",
      );
    });
  });

  describe("Kasus 3: field lain tidak relevan tanpa image", () => {
    it("harus tetap menolak request dengan HTTP 400 meski ada field lain", async () => {
      const res = await request(app)
        .post("/analyze")
        .field("nama", "produk susu")
        .field("kategori", "minuman");

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("ERROR");
      expect(res.body.message).toBe(
        "Silakan pilih atau ambil gambar terlebih dahulu",
      );
    });

    it("harus tetap menolak request dengan HTTP 400 meski field image berisi string bukan file", async () => {
      const res = await request(app)
        .post("/analyze")
        .field("image", "bukan-file-sungguhan");

      expect(res.status).toBe(400);
      expect(res.body.status).toBe("ERROR");
      expect(res.body.message).toBe(
        "Silakan pilih atau ambil gambar terlebih dahulu",
      );
    });
  });
});
