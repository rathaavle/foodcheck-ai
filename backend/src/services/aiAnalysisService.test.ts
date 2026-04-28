import axios from "axios";
import { analyzeText, AiAnalysisError } from "./aiAnalysisService";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const ENV_VARS = {
  AZURE_OPENAI_ENDPOINT: "https://test.openai.azure.com",
  AZURE_OPENAI_API_KEY: "test-api-key",
  AZURE_OPENAI_DEPLOYMENT_NAME: "gpt-4o",
  AZURE_OPENAI_API_VERSION: "2024-02-01",
};

function setEnv(overrides: Partial<typeof ENV_VARS> = {}) {
  const vars = { ...ENV_VARS, ...overrides };
  Object.entries(vars).forEach(([k, v]) => {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  });
}

function clearEnv() {
  Object.keys(ENV_VARS).forEach((k) => delete process.env[k]);
}

function makeAxiosResponse(content: string) {
  return {
    data: {
      choices: [{ message: { content } }],
    },
  };
}

const VALID_AI_RESPONSE = JSON.stringify({
  ingredients: ["gula", "garam", "tepung", "pengawet natrium benzoat"],
  risk_level: "HIGH",
  flagged_items: ["gula", "pengawet natrium benzoat"],
  explanation:
    "Produk ini mengandung kadar gula tinggi dan pengawet berbahaya yang berisiko bagi kesehatan.",
});

beforeEach(() => {
  setEnv();
  jest.clearAllMocks();
});

afterEach(() => {
  clearEnv();
});

// ─── 5.1 / 5.2: Parsing berhasil ─────────────────────────────────────────────

describe("analyzeText — parsing berhasil", () => {
  it("mengembalikan AnalysisResult yang valid ketika OpenAI merespons dengan JSON yang benar", async () => {
    mockedAxios.post.mockResolvedValueOnce(
      makeAxiosResponse(VALID_AI_RESPONSE),
    );

    const result = await analyzeText(
      "gula, garam, tepung, pengawet natrium benzoat",
    );

    expect(result.ingredients).toEqual([
      "gula",
      "garam",
      "tepung",
      "pengawet natrium benzoat",
    ]);
    expect(result.risk_level).toBe("HIGH");
    expect(result.flagged_items).toEqual(["gula", "pengawet natrium benzoat"]);
    expect(typeof result.explanation).toBe("string");
    expect(result.explanation.length).toBeGreaterThan(0);
  });

  it("menerima respons yang dibungkus markdown code fence (```json ... ```)", async () => {
    const wrapped = "```json\n" + VALID_AI_RESPONSE + "\n```";
    mockedAxios.post.mockResolvedValueOnce(makeAxiosResponse(wrapped));

    const result = await analyzeText("gula, garam");

    expect(result.risk_level).toBe("HIGH");
    expect(result.ingredients).toContain("gula");
  });

  it("mengembalikan flagged_items kosong dan risk_level LOW ketika tidak ada bahan berisiko", async () => {
    const lowRiskResponse = JSON.stringify({
      ingredients: ["air", "tepung beras"],
      risk_level: "LOW",
      flagged_items: [],
      explanation: "Produk ini aman dikonsumsi.",
    });
    mockedAxios.post.mockResolvedValueOnce(makeAxiosResponse(lowRiskResponse));

    const result = await analyzeText("air, tepung beras");

    expect(result.risk_level).toBe("LOW");
    expect(result.flagged_items).toHaveLength(0);
  });

  it("menerima risk_level huruf kecil dan menormalisasinya ke huruf besar", async () => {
    const mixedCaseResponse = JSON.stringify({
      ingredients: ["gula"],
      risk_level: "medium",
      flagged_items: ["gula"],
      explanation: "Mengandung gula.",
    });
    mockedAxios.post.mockResolvedValueOnce(
      makeAxiosResponse(mixedCaseResponse),
    );

    const result = await analyzeText("gula");

    expect(result.risk_level).toBe("MEDIUM");
  });
});

// ─── 5.3: OpenAI gagal ───────────────────────────────────────────────────────

describe("analyzeText — OpenAI gagal", () => {
  it("melempar AiAnalysisError ketika axios.post melempar error jaringan", async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error("Network Error"));

    await expect(analyzeText("teks label")).rejects.toThrow(AiAnalysisError);
  });

  it("melempar AiAnalysisError ketika Azure mengembalikan HTTP 500", async () => {
    const axiosError = Object.assign(
      new Error("Request failed with status code 500"),
      {
        response: { status: 500, data: { error: "Internal Server Error" } },
      },
    );
    mockedAxios.post.mockRejectedValueOnce(axiosError);

    await expect(analyzeText("teks label")).rejects.toThrow(AiAnalysisError);
  });

  it("melempar AiAnalysisError ketika choices kosong (tidak ada konten dari model)", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { choices: [] },
    });

    await expect(analyzeText("teks label")).rejects.toThrow(AiAnalysisError);
  });

  it("melempar AiAnalysisError ketika environment variable tidak dikonfigurasi", async () => {
    clearEnv();

    await expect(analyzeText("teks label")).rejects.toThrow(AiAnalysisError);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });
});

// ─── 5.4: Respons tidak valid ─────────────────────────────────────────────────

describe("analyzeText — respons tidak valid", () => {
  it("melempar AiAnalysisError ketika respons bukan JSON valid", async () => {
    mockedAxios.post.mockResolvedValueOnce(
      makeAxiosResponse("Ini bukan JSON sama sekali"),
    );

    await expect(analyzeText("teks label")).rejects.toThrow(AiAnalysisError);
  });

  it("melempar AiAnalysisError ketika field 'ingredients' tidak ada", async () => {
    const missing = JSON.stringify({
      risk_level: "HIGH",
      flagged_items: ["gula"],
      explanation: "Penjelasan.",
    });
    mockedAxios.post.mockResolvedValueOnce(makeAxiosResponse(missing));

    await expect(analyzeText("teks label")).rejects.toThrow(AiAnalysisError);
  });

  it("melempar AiAnalysisError ketika field 'risk_level' tidak ada", async () => {
    const missing = JSON.stringify({
      ingredients: ["gula"],
      flagged_items: ["gula"],
      explanation: "Penjelasan.",
    });
    mockedAxios.post.mockResolvedValueOnce(makeAxiosResponse(missing));

    await expect(analyzeText("teks label")).rejects.toThrow(AiAnalysisError);
  });

  it("melempar AiAnalysisError ketika field 'flagged_items' tidak ada", async () => {
    const missing = JSON.stringify({
      ingredients: ["gula"],
      risk_level: "HIGH",
      explanation: "Penjelasan.",
    });
    mockedAxios.post.mockResolvedValueOnce(makeAxiosResponse(missing));

    await expect(analyzeText("teks label")).rejects.toThrow(AiAnalysisError);
  });

  it("melempar AiAnalysisError ketika field 'explanation' tidak ada", async () => {
    const missing = JSON.stringify({
      ingredients: ["gula"],
      risk_level: "HIGH",
      flagged_items: ["gula"],
    });
    mockedAxios.post.mockResolvedValueOnce(makeAxiosResponse(missing));

    await expect(analyzeText("teks label")).rejects.toThrow(AiAnalysisError);
  });

  it("melempar AiAnalysisError ketika risk_level bukan nilai yang diizinkan", async () => {
    const invalid = JSON.stringify({
      ingredients: ["gula"],
      risk_level: "CRITICAL",
      flagged_items: ["gula"],
      explanation: "Penjelasan.",
    });
    mockedAxios.post.mockResolvedValueOnce(makeAxiosResponse(invalid));

    await expect(analyzeText("teks label")).rejects.toThrow(AiAnalysisError);
  });

  it("melempar AiAnalysisError ketika respons adalah JSON null", async () => {
    mockedAxios.post.mockResolvedValueOnce(makeAxiosResponse("null"));

    await expect(analyzeText("teks label")).rejects.toThrow(AiAnalysisError);
  });
});
