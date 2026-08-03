var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_genai = require("@google/genai");
var import_meta = {};
var resolvedFilename = typeof __filename !== "undefined" ? __filename : (0, import_url.fileURLToPath)(import_meta.url);
var resolvedDirname = typeof __dirname !== "undefined" ? __dirname : import_path.default.dirname(resolvedFilename);
var isProduction = process.env.NODE_ENV === "production" || resolvedFilename.endsWith("server.cjs") || resolvedDirname.endsWith("dist");
var getGenAI = () => {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured on the server.");
  }
  return new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
};
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "50mb" }));
  app.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, userMessage, systemInstruction } = req.body;
      const ai = getGenAI();
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          ...(messages || []).map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
          { role: "user", parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: systemInstruction || "You are a helpful assistant."
        }
      });
      res.json({ text: response.text });
    } catch (error) {
      console.error("Server API Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate content" });
    }
  });
  app.post("/api/generate-workout", async (req, res) => {
    try {
      const { goals } = req.body;
      if (!goals) {
        return res.status(400).json({ error: "Workout goals are required." });
      }
      const ai = getGenAI();
      const prompt = `Generate a structured workout based on these goals: ${goals}. 
      Return a JSON object with: 
      "name": string, 
      "duration": string (e.g. "30 min"), 
      "type": string (strength, cardio, yoga, hiit), 
      "exercises": array of { "name": string, "sets": string, "reps": string, "weight": string }, 
      "instructions": string.
      Return ONLY the JSON.`;
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });
      res.json({ text: response.text });
    } catch (error) {
      console.error("Workout generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate workout" });
    }
  });
  app.post("/api/analyze-workout", async (req, res) => {
    try {
      const { analyzeType, workoutLink, fileData, fileType } = req.body;
      const ai = getGenAI();
      let contents = [];
      if (analyzeType === "link") {
        contents.push(`Analyze this link and extract a workout plan: ${workoutLink || ""}`);
      } else if (fileData && fileType) {
        contents.push({
          inlineData: {
            data: fileData,
            // base64-encoded string
            mimeType: fileType
          }
        });
        contents.push(`Analyze this ${analyzeType || "image/file"} and extract a workout plan.`);
      } else {
        return res.status(400).json({ error: "Either link or upload file data is required." });
      }
      contents.push(`Format your response as a JSON object with:
      "name": string, 
      "duration": string (e.g. "30 min"), 
      "type": string (strength, cardio, yoga, hiit), 
      "exercises": array of { "name": string, "sets": string, "reps": string, "weight": string }, 
      "instructions": string.
      Return ONLY the JSON.`);
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          responseMimeType: "application/json"
        }
      });
      res.json({ text: response.text });
    } catch (error) {
      console.error("Workout analysis error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze workout" });
    }
  });
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = resolvedDirname.endsWith("dist") ? resolvedDirname : import_path.default.join(resolvedDirname, "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
