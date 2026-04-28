import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { ApiResponse } from "../types";
import { extractTextFromImage } from "../services/ocrService";
import { translateText } from "../services/translationService";
import { analyzeText } from "../services/aiAnalysisService";
import {
  buildSuccess,
  buildSuccessWithWarning,
} from "../services/responseBuilder";

const upload = multer({ storage: multer.memoryStorage() });

export const analyzeRouter = Router();

analyzeRouter.post(
  "/analyze",
  upload.single("image"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // 1. Validate image presence
    if (!req.file) {
      const response: ApiResponse = {
        status: "ERROR",
        message: "Silakan pilih atau ambil gambar terlebih dahulu",
      };
      res.status(400).json(response);
      return;
    }

    try {
      // 2. OCR — extract text from image
      const ocrResult = await extractTextFromImage(
        req.file.buffer,
        req.file.mimetype,
      );

      // 3. Translation — translate to Indonesian if needed
      let textForAnalysis: string;
      let translationWarning: string | undefined;

      try {
        const translationResult = await translateText(ocrResult);
        textForAnalysis = translationResult.translated_text;
      } catch {
        // Non-fatal: use original text and attach warning
        textForAnalysis = ocrResult.raw_text;
        translationWarning =
          "Terjemahan tidak tersedia. Analisis dilakukan menggunakan teks asli.";
      }

      // 4. AI Analysis
      const analysisResult = await analyzeText(textForAnalysis);

      // 5. Build response
      const response = translationWarning
        ? buildSuccessWithWarning(analysisResult, translationWarning)
        : buildSuccess(analysisResult);

      res.status(200).json(response);
    } catch (err) {
      console.error("[analyze route] error:", err);
      next(err);
    }
  },
);
