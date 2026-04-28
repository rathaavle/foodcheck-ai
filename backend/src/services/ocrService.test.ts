import axios from "axios";
import {
  extractTextFromImage,
  OcrFailureError,
  OcrEmptyTextError,
} from "./ocrService";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const FAKE_ENDPOINT = "https://fake.cognitiveservices.azure.com";
const FAKE_KEY = "fake-api-key";
const OPERATION_URL = "https://fake.cognitiveservices.azure.com/operations/123";

const SUCCEEDED_RESPONSE = {
  data: {
    status: "succeeded",
    analyzeResult: {
      pages: [{ lines: [{ content: "Gula" }, { content: "Tepung Terigu" }] }],
      languages: [{ locale: "id" }],
    },
  },
};

beforeEach(() => {
  jest.useFakeTimers();
  process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT = FAKE_ENDPOINT;
  process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY = FAKE_KEY;
  jest.clearAllMocks();
});

afterEach(() => {
  jest.useRealTimers();
  delete process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;
  delete process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;
});

// Helper: run the async function while advancing fake timers for each poll tick
async function runWithFakeTimers<T>(promise: Promise<T>): Promise<T> {
  const result = promise;
  // Advance timers enough to cover all polling intervals (10 attempts × 1000 ms)
  await jest.runAllTimersAsync();
  return result;
}

// ── 1. OCR success ────────────────────────────────────────────────────────────

test("OCR success — returns correct OcrResult", async () => {
  mockedAxios.post.mockResolvedValueOnce({
    headers: { "operation-location": OPERATION_URL },
  });
  mockedAxios.get.mockResolvedValueOnce(SUCCEEDED_RESPONSE);

  let result: Awaited<ReturnType<typeof extractTextFromImage>> | undefined;
  const p = extractTextFromImage(Buffer.from("img"), "image/jpeg").then((r) => {
    result = r;
  });
  await jest.runAllTimersAsync();
  await p;

  expect(result).toEqual({ raw_text: "Gula\nTepung Terigu", language: "id" });
});

// ── 2. Missing env vars ───────────────────────────────────────────────────────

test("OCR failure — missing AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT throws OcrFailureError", async () => {
  delete process.env.AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT;

  await expect(
    extractTextFromImage(Buffer.from("img"), "image/jpeg"),
  ).rejects.toBeInstanceOf(OcrFailureError);
});

test("OCR failure — missing AZURE_DOCUMENT_INTELLIGENCE_KEY throws OcrFailureError", async () => {
  delete process.env.AZURE_DOCUMENT_INTELLIGENCE_KEY;

  await expect(
    extractTextFromImage(Buffer.from("img"), "image/jpeg"),
  ).rejects.toBeInstanceOf(OcrFailureError);
});

// ── 3. Azure POST error ───────────────────────────────────────────────────────

test("OCR failure — axios.post throws → OcrFailureError", async () => {
  mockedAxios.post.mockRejectedValueOnce(new Error("Network error"));

  await expect(
    extractTextFromImage(Buffer.from("img"), "image/jpeg"),
  ).rejects.toBeInstanceOf(OcrFailureError);
});

// ── 4. No operation-location header ──────────────────────────────────────────

test("OCR failure — no operation-location header → OcrFailureError", async () => {
  mockedAxios.post.mockResolvedValueOnce({ headers: {} });

  await expect(
    extractTextFromImage(Buffer.from("img"), "image/jpeg"),
  ).rejects.toBeInstanceOf(OcrFailureError);
});

// ── 5. Poll returns status "failed" ──────────────────────────────────────────

test("OCR failure — poll returns status 'failed' → OcrFailureError", async () => {
  mockedAxios.post.mockResolvedValueOnce({
    headers: { "operation-location": OPERATION_URL },
  });
  mockedAxios.get.mockResolvedValueOnce({ data: { status: "failed" } });

  const assertion = expect(
    extractTextFromImage(Buffer.from("img"), "image/jpeg"),
  ).rejects.toBeInstanceOf(OcrFailureError);
  await jest.runAllTimersAsync();
  await assertion;
});

// ── 6. Poll GET throws ────────────────────────────────────────────────────────

test("OCR failure — poll axios.get throws → OcrFailureError", async () => {
  mockedAxios.post.mockResolvedValueOnce({
    headers: { "operation-location": OPERATION_URL },
  });
  mockedAxios.get.mockRejectedValueOnce(new Error("Timeout"));

  const assertion = expect(
    extractTextFromImage(Buffer.from("img"), "image/jpeg"),
  ).rejects.toBeInstanceOf(OcrFailureError);
  await jest.runAllTimersAsync();
  await assertion;
});

// ── 7. Empty text ─────────────────────────────────────────────────────────────

test("Empty text — pages with no lines → OcrEmptyTextError", async () => {
  mockedAxios.post.mockResolvedValueOnce({
    headers: { "operation-location": OPERATION_URL },
  });
  mockedAxios.get.mockResolvedValueOnce({
    data: {
      status: "succeeded",
      analyzeResult: { pages: [{ lines: [] }], languages: [{ locale: "id" }] },
    },
  });

  const assertion = expect(
    extractTextFromImage(Buffer.from("img"), "image/jpeg"),
  ).rejects.toBeInstanceOf(OcrEmptyTextError);
  await jest.runAllTimersAsync();
  await assertion;
});

test("Empty text — no pages at all → OcrEmptyTextError", async () => {
  mockedAxios.post.mockResolvedValueOnce({
    headers: { "operation-location": OPERATION_URL },
  });
  mockedAxios.get.mockResolvedValueOnce({
    data: { status: "succeeded", analyzeResult: { pages: [] } },
  });

  const assertion = expect(
    extractTextFromImage(Buffer.from("img"), "image/jpeg"),
  ).rejects.toBeInstanceOf(OcrEmptyTextError);
  await jest.runAllTimersAsync();
  await assertion;
});

// ── 8. Language fallback ──────────────────────────────────────────────────────

test("Language fallback — no languages array → language defaults to 'unknown'", async () => {
  mockedAxios.post.mockResolvedValueOnce({
    headers: { "operation-location": OPERATION_URL },
  });
  mockedAxios.get.mockResolvedValueOnce({
    data: {
      status: "succeeded",
      analyzeResult: {
        pages: [{ lines: [{ content: "Some text" }] }],
        // no languages field
      },
    },
  });

  let result: Awaited<ReturnType<typeof extractTextFromImage>> | undefined;
  const p = extractTextFromImage(Buffer.from("img"), "image/jpeg").then((r) => {
    result = r;
  });
  await jest.runAllTimersAsync();
  await p;

  expect(result?.language).toBe("unknown");
});
