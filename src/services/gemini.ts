import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY || "";

export const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface IntentResult {
  intent: string;
  riskLevel: "Low" | "Medium" | "High";
  recommendedAction: string;
  helpfulResources: { title: string; url: string }[];
}

export const analyzeIntent = async (
  input: { text?: string; image?: string; audio?: string },
  mimeType?: string
): Promise<IntentResult> => {
  const model = "gemini-3-flash-preview";
  
  const parts: any[] = [];
  
  if (input.text) {
    parts.push({ text: input.text });
  }
  
  if (input.image) {
    parts.push({
      inlineData: {
        data: input.image.split(",")[1],
        mimeType: mimeType || "image/jpeg",
      },
    });
  }

  if (input.audio) {
    parts.push({
      inlineData: {
        data: input.audio.split(",")[1],
        mimeType: "audio/webm",
      },
    });
  }

  const response = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts }],
    config: {
      systemInstruction: `You are IntentBridge, an AI specialist in intent analysis and risk assessment. 
      Analyze the provided input (text, image, or audio) and determine the user's underlying intent.
      Assess the risk level (Low, Medium, High) based on potential safety, security, or ethical implications.
      Provide a clear recommended action and a list of helpful resources (titles and URLs).
      
      Return the result strictly in JSON format.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          intent: { type: Type.STRING, description: "The detected intent of the user." },
          riskLevel: { 
            type: Type.STRING, 
            enum: ["Low", "Medium", "High"],
            description: "The assessed risk level." 
          },
          recommendedAction: { type: Type.STRING, description: "The suggested next step for the user." },
          helpfulResources: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                url: { type: Type.STRING }
              },
              required: ["title", "url"]
            }
          }
        },
        required: ["intent", "riskLevel", "recommendedAction", "helpfulResources"]
      }
    },
  });

  try {
    return JSON.parse(response.text || "{}") as IntentResult;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Failed to analyze intent. Please try again.");
  }
};
