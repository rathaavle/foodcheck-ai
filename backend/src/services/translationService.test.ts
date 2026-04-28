import axios from "axios";
import { translateText } from "./translationService";
import { OcrResult } from "../types";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const FAKE_ENDPOINT = "https://fake.translator.azure.com";
const FAKE_KEY = "fake-translator-key";
const FAKE_REGION = "southeastasia";

beforeEach(() => {
  process.env.AZURE_TRANSLATOR_ENDPOINT = FAKE_ENDPOINT;
  process.env.AZURE_TRANSLATOR_KEY = FAKE_KEY;
  process.env.AZURE_TRANSLATOR_REGION = FAKE_REGION;
  jest.clearAllMocks();
});

afterEach(() => {
  delete process.env.AZURE_TRANSLATOR_ENDPOINT;
  delete process.env.AZURE_TRANSLATOR_KEY;
  delete process.env.AZURE_TRANSLATOR_REGION;
});

// ── 1. Teks bahasa Indonesia — skip terjemahan ────────────────────────────────

test("Teks bahasa Indonesia — langsung kembalikan teks asli tanpa memanggil Azure", async () => {
  const ocrResult: OcrResult = {
    raw_text: "Gula, Tepung Terigu",
    language: "id",
  };

  const result = await translateText(ocrResult);

  expect(result).toEqual({ translated_text: "Gula, Tepung Terigu" });
  expect(mockedAxios.post).not.toHaveBeenCalled();
});

test("Teks bahasa Indonesia — teks kosong pun dikembalikan apa adanya", async () => {
  const ocrResult: OcrResult = { raw_text: "", language: "id" };

  const result = await translateText(ocrResult);

  expect(result).toEqual({ translated_text: "" });
  expect(mockedAxios.post).not.toHaveBeenCalled();
});

// ── 2. Terjemahan berhasil ────────────────────────────────────────────────────

test("Terjemahan berhasil — teks bahasa Inggris diterjemahkan ke Indonesia", async () => {
  const ocrResult: OcrResult = {
    raw_text: "Sugar, Wheat Flour",
    language: "en",
  };

  mockedAxios.post.mockResolvedValueOnce({
    data: [{ translations: [{ text: "Gula, Tepung Terigu", to: "id" }] }],
  });

  const result = await translateText(ocrResult);

  expect(result).toEqual({ translated_text: "Gula, Tepung Terigu" });
});

test("Terjemahan berhasil — memanggil URL dan header Azure Translator yang benar", async () => {
  const ocrResult: OcrResult = { raw_text: "Salt", language: "en" };

  mockedAxios.post.mockResolvedValueOnce({
    data: [{ translations: [{ text: "Garam", to: "id" }] }],
  });

  await translateText(ocrResult);

  expect(mockedAxios.post).toHaveBeenCalledWith(
    `${FAKE_ENDPOINT}/translate?api-version=3.0&to=id`,
    [{ Text: "Salt" }],
    expect.objectContaining({
      headers: expect.objectContaining({
        "Ocp-Apim-Subscription-Key": FAKE_KEY,
        "Ocp-Apim-Subscription-Region": FAKE_REGION,
      }),
    }),
  );
});

test("Terjemahan berhasil — teks bahasa Mandarin diterjemahkan ke Indonesia", async () => {
  const ocrResult: OcrResult = { raw_text: "糖, 小麦粉", language: "zh" };

  mockedAxios.post.mockResolvedValueOnce({
    data: [{ translations: [{ text: "Gula, Tepung Terigu", to: "id" }] }],
  });

  const result = await translateText(ocrResult);

  expect(result).toEqual({ translated_text: "Gula, Tepung Terigu" });
});

// ── 3. Terjemahan gagal ───────────────────────────────────────────────────────

test("Terjemahan gagal — axios.post melempar error → fungsi melempar error", async () => {
  const ocrResult: OcrResult = { raw_text: "Sugar", language: "en" };

  mockedAxios.post.mockRejectedValueOnce(new Error("Network error"));

  await expect(translateText(ocrResult)).rejects.toThrow();
});

test("Terjemahan gagal — respons Azure tidak mengandung teks terjemahan → melempar error", async () => {
  const ocrResult: OcrResult = { raw_text: "Sugar", language: "en" };

  mockedAxios.post.mockResolvedValueOnce({ data: [] });

  await expect(translateText(ocrResult)).rejects.toThrow(
    "Respons Azure Translator tidak mengandung hasil terjemahan.",
  );
});

test("Terjemahan gagal — respons Azure dengan translations kosong → melempar error", async () => {
  const ocrResult: OcrResult = { raw_text: "Sugar", language: "en" };

  mockedAxios.post.mockResolvedValueOnce({
    data: [{ translations: [] }],
  });

  await expect(translateText(ocrResult)).rejects.toThrow(
    "Respons Azure Translator tidak mengandung hasil terjemahan.",
  );
});

test("Terjemahan gagal — env AZURE_TRANSLATOR_ENDPOINT tidak ada → melempar error konfigurasi", async () => {
  delete process.env.AZURE_TRANSLATOR_ENDPOINT;
  const ocrResult: OcrResult = { raw_text: "Sugar", language: "en" };

  await expect(translateText(ocrResult)).rejects.toThrow(
    "Konfigurasi Azure Translator tidak lengkap",
  );
  expect(mockedAxios.post).not.toHaveBeenCalled();
});

test("Terjemahan gagal — env AZURE_TRANSLATOR_KEY tidak ada → melempar error konfigurasi", async () => {
  delete process.env.AZURE_TRANSLATOR_KEY;
  const ocrResult: OcrResult = { raw_text: "Sugar", language: "en" };

  await expect(translateText(ocrResult)).rejects.toThrow(
    "Konfigurasi Azure Translator tidak lengkap",
  );
  expect(mockedAxios.post).not.toHaveBeenCalled();
});

test("Terjemahan gagal — env AZURE_TRANSLATOR_REGION tidak ada → melempar error konfigurasi", async () => {
  delete process.env.AZURE_TRANSLATOR_REGION;
  const ocrResult: OcrResult = { raw_text: "Sugar", language: "en" };

  await expect(translateText(ocrResult)).rejects.toThrow(
    "Konfigurasi Azure Translator tidak lengkap",
  );
  expect(mockedAxios.post).not.toHaveBeenCalled();
});
