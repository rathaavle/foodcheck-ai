/**
 * Unit tests for errorHandler middleware
 * Validates: Requirements 10.1, 10.2
 *
 * Error table (from design.md):
 * | Skenario                       | HTTP Status | Pesan ke Pengguna                                                                        |
 * | ------------------------------ | ----------- | ---------------------------------------------------------------------------------------- |
 * | OCR gagal (Azure error)        | 502         | "Gagal membaca teks dari gambar. Pastikan gambar cukup jelas dan coba lagi."             |
 * | Teks tidak terbaca / kosong    | 422         | "Teks tidak dapat dikenali. Pastikan gambar label terlihat jelas dan coba unggah ulang." |
 * | OpenAI gagal                   | 502         | "Analisis AI tidak tersedia saat ini. Silakan coba beberapa saat lagi."                  |
 * | Koneksi terputus / timeout     | 503         | "Gagal terhubung ke server. Periksa koneksi internet Anda dan coba lagi."                |
 * | Error tidak dikenal            | 500         | "Terjadi kesalahan internal. Silakan coba beberapa saat lagi."                           |
 */

import { Request, Response, NextFunction } from "express";
import { errorHandler } from "./errorHandler";
import { OcrFailureError, OcrEmptyTextError } from "../services/ocrService";
import { AiAnalysisError } from "../services/aiAnalysisService";

// Helper to create a mock Express Response
function mockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

const mockReq = {} as Request;
const mockNext = jest.fn() as NextFunction;

describe("errorHandler — OcrFailureError (HTTP 502)", () => {
  it("mengembalikan status 502 untuk OcrFailureError", () => {
    const res = mockResponse();
    const err = new OcrFailureError();

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(502);
  });

  it("mengembalikan pesan error OCR yang sesuai", () => {
    const res = mockResponse();
    const err = new OcrFailureError();

    errorHandler(err, mockReq, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "ERROR",
        message:
          "Gagal membaca teks dari gambar. Pastikan gambar cukup jelas dan coba lagi.",
      }),
    );
  });

  it("menggunakan pesan kustom dari OcrFailureError jika ada", () => {
    const res = mockResponse();
    const customMsg = "Pesan OCR kustom";
    const err = new OcrFailureError(customMsg);

    errorHandler(err, mockReq, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "ERROR", message: customMsg }),
    );
  });
});

describe("errorHandler — OcrEmptyTextError (HTTP 422)", () => {
  it("mengembalikan status 422 untuk OcrEmptyTextError", () => {
    const res = mockResponse();
    const err = new OcrEmptyTextError();

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(422);
  });

  it("mengembalikan pesan teks kosong yang sesuai", () => {
    const res = mockResponse();
    const err = new OcrEmptyTextError();

    errorHandler(err, mockReq, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "ERROR",
        message:
          "Teks tidak dapat dikenali. Pastikan gambar label terlihat jelas dan coba unggah ulang.",
      }),
    );
  });

  it("menggunakan pesan kustom dari OcrEmptyTextError jika ada", () => {
    const res = mockResponse();
    const customMsg = "Teks kosong kustom";
    const err = new OcrEmptyTextError(customMsg);

    errorHandler(err, mockReq, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "ERROR", message: customMsg }),
    );
  });
});

describe("errorHandler — AiAnalysisError (HTTP 502)", () => {
  it("mengembalikan status 502 untuk AiAnalysisError", () => {
    const res = mockResponse();
    const err = new AiAnalysisError();

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(502);
  });

  it("mengembalikan pesan error AI yang sesuai", () => {
    const res = mockResponse();
    const err = new AiAnalysisError();

    errorHandler(err, mockReq, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "ERROR",
        message:
          "Analisis AI tidak tersedia saat ini. Silakan coba beberapa saat lagi.",
      }),
    );
  });

  it("menggunakan pesan kustom dari AiAnalysisError jika ada", () => {
    const res = mockResponse();
    const customMsg = "AI error kustom";
    const err = new AiAnalysisError(customMsg);

    errorHandler(err, mockReq, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "ERROR", message: customMsg }),
    );
  });
});

describe("errorHandler — Network/Timeout errors (HTTP 503)", () => {
  const networkErrorCodes = [
    "ECONNREFUSED",
    "ECONNRESET",
    "ENOTFOUND",
    "ETIMEDOUT",
    "ECONNABORTED",
    "ERR_NETWORK",
  ];

  for (const code of networkErrorCodes) {
    it(`mengembalikan status 503 untuk error dengan code ${code}`, () => {
      const res = mockResponse();
      const err = Object.assign(new Error("network error"), { code });

      errorHandler(err, mockReq, res, mockNext);

      expect(res.status).toHaveBeenCalledWith(503);
    });
  }

  it("mengembalikan pesan koneksi terputus yang sesuai", () => {
    const res = mockResponse();
    const err = Object.assign(new Error("connection refused"), {
      code: "ECONNREFUSED",
    });

    errorHandler(err, mockReq, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "ERROR",
        message:
          "Gagal terhubung ke server. Periksa koneksi internet Anda dan coba lagi.",
      }),
    );
  });

  it("mengembalikan 503 untuk axios timeout (isAxiosError + ECONNABORTED)", () => {
    const res = mockResponse();
    const err = Object.assign(new Error("timeout"), {
      isAxiosError: true,
      code: "ECONNABORTED",
    });

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: "ERROR" }),
    );
  });
});

describe("errorHandler — Unknown/Generic errors (HTTP 500)", () => {
  it("mengembalikan status 500 untuk error tidak dikenal", () => {
    const res = mockResponse();
    const err = new Error("Unexpected error");

    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("mengembalikan pesan internal yang aman (tidak bocorkan detail)", () => {
    const res = mockResponse();
    const err = new Error(
      "Database connection string: postgres://user:pass@host",
    );

    errorHandler(err, mockReq, res, mockNext);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "ERROR",
        message: "Terjadi kesalahan internal. Silakan coba beberapa saat lagi.",
      }),
    );
  });

  it("tidak menyertakan detail error internal dalam respons", () => {
    const res = mockResponse();
    const err = new Error("secret internal error");

    errorHandler(err, mockReq, res, mockNext);

    const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
    expect(jsonCall.message).not.toContain("secret internal error");
  });
});

describe("errorHandler — Struktur respons ApiResponse", () => {
  it("semua respons error memiliki field status bernilai ERROR", () => {
    const errors = [
      new OcrFailureError(),
      new OcrEmptyTextError(),
      new AiAnalysisError(),
      new Error("generic"),
    ];

    for (const err of errors) {
      const res = mockResponse();
      errorHandler(err, mockReq, res, mockNext);
      const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
      expect(jsonCall.status).toBe("ERROR");
    }
  });

  it("respons error tidak menyertakan field data", () => {
    const res = mockResponse();
    errorHandler(new OcrFailureError(), mockReq, res, mockNext);
    const jsonCall = (res.json as jest.Mock).mock.calls[0][0];
    expect(jsonCall.data).toBeUndefined();
  });
});
