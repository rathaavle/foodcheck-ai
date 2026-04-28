/**
 * Unit tests for responseBuilder
 * Validates: Requirements 8.1, 4.3
 */

import {
  buildSuccess,
  buildSuccessWithWarning,
  buildError,
} from "./responseBuilder";
import { AnalysisResult } from "../types";

const sampleResult: AnalysisResult = {
  ingredients: ["gula", "garam", "pengawet"],
  risk_level: "HIGH",
  flagged_items: ["gula", "pengawet"],
  explanation:
    "Produk ini mengandung kadar gula tinggi dan pengawet berbahaya.",
};

const lowRiskResult: AnalysisResult = {
  ingredients: ["tepung", "air"],
  risk_level: "LOW",
  flagged_items: [],
  explanation: "Tidak ditemukan kandungan berbahaya.",
};

describe("buildSuccess", () => {
  it("mengembalikan status SUCCESS", () => {
    const response = buildSuccess(sampleResult);
    expect(response.status).toBe("SUCCESS");
  });

  it("menyertakan data AnalysisResult", () => {
    const response = buildSuccess(sampleResult);
    expect(response.data).toEqual(sampleResult);
  });

  it("tidak menyertakan field message", () => {
    const response = buildSuccess(sampleResult);
    expect(response.message).toBeUndefined();
  });

  it("tidak menyertakan field warning", () => {
    const response = buildSuccess(sampleResult);
    expect(response.warning).toBeUndefined();
  });

  it("bekerja dengan risk_level LOW dan flagged_items kosong", () => {
    const response = buildSuccess(lowRiskResult);
    expect(response.status).toBe("SUCCESS");
    expect(response.data?.risk_level).toBe("LOW");
    expect(response.data?.flagged_items).toEqual([]);
  });

  it("mempertahankan semua field AnalysisResult", () => {
    const response = buildSuccess(sampleResult);
    expect(response.data?.ingredients).toEqual(sampleResult.ingredients);
    expect(response.data?.risk_level).toBe(sampleResult.risk_level);
    expect(response.data?.flagged_items).toEqual(sampleResult.flagged_items);
    expect(response.data?.explanation).toBe(sampleResult.explanation);
  });
});

describe("buildSuccessWithWarning", () => {
  const warningMsg =
    "Terjemahan tidak tersedia. Analisis dilakukan menggunakan teks asli.";

  it("mengembalikan status SUCCESS", () => {
    const response = buildSuccessWithWarning(sampleResult, warningMsg);
    expect(response.status).toBe("SUCCESS");
  });

  it("menyertakan data AnalysisResult", () => {
    const response = buildSuccessWithWarning(sampleResult, warningMsg);
    expect(response.data).toEqual(sampleResult);
  });

  it("menyertakan field warning dengan pesan yang benar", () => {
    const response = buildSuccessWithWarning(sampleResult, warningMsg);
    expect(response.warning).toBe(warningMsg);
  });

  it("tidak menyertakan field message", () => {
    const response = buildSuccessWithWarning(sampleResult, warningMsg);
    expect(response.message).toBeUndefined();
  });

  it("warning tidak kosong", () => {
    const response = buildSuccessWithWarning(sampleResult, warningMsg);
    expect(response.warning!.length).toBeGreaterThan(0);
  });

  it("bekerja dengan warning kustom", () => {
    const customWarning = "Peringatan kustom";
    const response = buildSuccessWithWarning(lowRiskResult, customWarning);
    expect(response.warning).toBe(customWarning);
    expect(response.data).toEqual(lowRiskResult);
  });
});

describe("buildError", () => {
  it("mengembalikan status ERROR", () => {
    const response = buildError("Terjadi kesalahan");
    expect(response.status).toBe("ERROR");
  });

  it("menyertakan field message dengan pesan yang benar", () => {
    const msg = "Gagal membaca teks dari gambar.";
    const response = buildError(msg);
    expect(response.message).toBe(msg);
  });

  it("tidak menyertakan field data", () => {
    const response = buildError("Error");
    expect(response.data).toBeUndefined();
  });

  it("tidak menyertakan field warning", () => {
    const response = buildError("Error");
    expect(response.warning).toBeUndefined();
  });

  it("bekerja dengan semua pesan error dari tabel error", () => {
    const errorMessages = [
      "Silakan pilih atau ambil gambar terlebih dahulu",
      "Gagal membaca teks dari gambar. Pastikan gambar cukup jelas dan coba lagi.",
      "Teks tidak dapat dikenali. Pastikan gambar label terlihat jelas dan coba unggah ulang.",
      "Analisis AI tidak tersedia saat ini. Silakan coba beberapa saat lagi.",
      "Gagal terhubung ke server. Periksa koneksi internet Anda dan coba lagi.",
    ];

    for (const msg of errorMessages) {
      const response = buildError(msg);
      expect(response.status).toBe("ERROR");
      expect(response.message).toBe(msg);
    }
  });
});
