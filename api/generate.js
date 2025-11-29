var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// api-src/generate.js
var generate_exports = {};
__export(generate_exports, {
  default: () => handler
});
module.exports = __toCommonJS(generate_exports);
var import_generative_ai = require("@google/generative-ai");
var apiKey = process.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
  console.error("ERROR: VITE_GEMINI_API_KEY is not set in .env file.");
}
var genAI = new import_generative_ai.GoogleGenerativeAI(apiKey);
var model = genAI.getGenerativeModel({ model: "nano-banana-pro-preview" });
async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { word, feeling } = req.body;
    if (!word || !feeling) {
      return res.status(400).json({ error: "Word and feeling are required" });
    }
    const prompt = `generate a high-quality, artistic image of ${word}. The image should strongly embody the feeling of "${feeling}". It should be designed to delight and surprise, with vivid colors, 8k resolution, and a professional composition.`;
    console.log(`Generating image for: ${word} (${feeling})`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const parts = response.candidates?.[0]?.content?.parts;
    const imagePart = parts?.find((part) => part.inlineData);
    if (imagePart && imagePart.inlineData) {
      const base64Image = imagePart.inlineData.data;
      const mimeType = imagePart.inlineData.mimeType || "image/png";
      res.json({ image: `data:${mimeType};base64,${base64Image}` });
    } else {
      const textPart = parts?.find((part) => part.text);
      if (textPart) {
        console.log("Model returned text:", textPart.text);
        return res.status(500).json({ error: "Model returned text instead of image", details: textPart.text });
      }
      res.status(500).json({ error: "No image data received from model" });
    }
  } catch (error) {
    console.error("Error generating image:", error);
    res.status(500).json({ error: error.message || "Failed to generate image" });
  }
}
if (module.exports.default) module.exports = module.exports.default;
