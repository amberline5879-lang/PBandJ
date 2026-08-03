import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const resolvedFilename = typeof __filename !== "undefined"
  ? __filename
  : fileURLToPath(import.meta.url);
const resolvedDirname = typeof __dirname !== "undefined"
  ? __dirname
  : path.dirname(resolvedFilename);

// Detect production mode based on env or execution context (e.g., if compiled inside dist)
const isProduction = process.env.NODE_ENV === "production" || 
                     resolvedFilename.endsWith("server.cjs") || 
                     resolvedDirname.endsWith("dist");

// Shared lazy-loaded Gemini client setup matching official telemetry standards
const getGenAI = () => {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API key is not configured on the server.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set limits for larger image/file payload analysis (base64 uploads)
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Routes
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, userMessage, systemInstruction } = req.body;
      const ai = getGenAI();

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          ...(messages || []).map((m: any) => ({ role: m.role, parts: [{ text: m.text }] })),
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: systemInstruction || "You are a helpful assistant.",
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
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
          responseMimeType: "application/json",
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Workout generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate workout" });
    }
  });

  app.post("/api/analyze-workout", async (req, res) => {
    try {
      const { analyzeType, workoutLink, fileData, fileType } = req.body;
      const ai = getGenAI();
      let contents: any[] = [];
      
      if (analyzeType === 'link') {
        contents.push(`Analyze this link and extract a workout plan: ${workoutLink || ''}`);
      } else if (fileData && fileType) {
        contents.push({
          inlineData: {
            data: fileData,  // base64-encoded string
            mimeType: fileType
          }
        });
        contents.push(`Analyze this ${analyzeType || 'image/file'} and extract a workout plan.`);
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
        contents: contents,
        config: {
          responseMimeType: "application/json",
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Workout analysis error:", error);
      res.status(500).json({ error: error.message || "Failed to analyze workout" });
    }
  });

  // Vite middleware for development vs static asset serving for production
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = resolvedDirname.endsWith("dist")
      ? resolvedDirname
      : path.join(resolvedDirname, "dist");
    
    // Serve static compiled assets
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
