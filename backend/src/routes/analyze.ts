import { Router } from "express";

// TODO: Implementasi POST /analyze
// Validasi keberadaan field image, panggil ocrService, translationService, aiAnalysisService, responseBuilder
const analyzeRouter = Router();

analyzeRouter.post("/analyze", async (req, res, next) => {
  // TODO: Implementasi handler
});

export default analyzeRouter;
