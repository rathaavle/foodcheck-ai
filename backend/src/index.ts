import "dotenv/config";
import express from "express";
import { analyzeRouter } from "./routes/analyze";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use(analyzeRouter);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`FoodCheck AI backend running on http://localhost:${PORT}`);
});

export default app;
