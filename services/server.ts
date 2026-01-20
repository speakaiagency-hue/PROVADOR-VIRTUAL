import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bodyParser from "body-parser";
import {
  generateModelImage,
  extractGarmentOnly,
  generateVirtualTryOnImage,
  generatePoseVariation
} from "./geminiService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "10mb" }));

// Endpoints da API
app.post("/api/generate-model", async (req, res) => {
  try {
    const { image } = req.body;
    const result = await generateModelImage(image);
    res.json({ image: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/extract-garment", async (req, res) => {
  try {
    const { image } = req.body;
    const result = await extractGarmentOnly(image);
    res.json({ image: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/virtual-tryon", async (req, res) => {
  try {
    const { modelImage, garmentImage } = req.body;
    const result = await generateVirtualTryOnImage(modelImage, garmentImage);
    res.json({ image: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/pose-variation", async (req, res) => {
  try {
    const { tryOnImage, pose } = req.body;
    const result = await generatePoseVariation(tryOnImage, pose);
    res.json({ image: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Servir frontend buildado
app.use(express.static(path.join(__dirname, "../dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
