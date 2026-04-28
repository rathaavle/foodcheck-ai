import { Router, Request, Response } from "express";
import multer from "multer";
import { ApiResponse } from "../types";

const upload = multer({ storage: multer.memoryStorage() });

export const analyzeRouter = Router();

analyzeRouter.post(
  "/analyze",
  upload.single("image"),
  (req: Request, res: Response): void => {
    if (!req.file) {
      const response: ApiResponse = {
        status: "ERROR",
        message: "Silakan pilih atau ambil gambar terlebih dahulu",
      };
      res.status(400).json(response);
      return;
    }

    // Placeholder — actual service calls wired in later tasks
    const response: ApiResponse = {
      status: "SUCCESS",
    };
    res.status(200).json(response);
  },
);
