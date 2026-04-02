// src/services/geminiService.ts

import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Make the AI model configurable via environment variable
const QUOTE_AI_MODEL = process.env.PLUMBLEAD_QUOTE_AI_MODEL || "gemini-2.0-flash";

export interface QuoteRequest {
  serviceType: string;
  details: string;
  location: string;
  language?: string;
}

export interface QuoteResponse {
  estimateRange: string;
  personalizedMessage: string;
  suggestedNextSteps: string[];
}

export async function generateAIQuote(request: QuoteRequest): Promise<QuoteResponse> {
  const lang = request.language === "es" ? "Spanish" : "English";

  const prompt = `
You are a Senior Plumbing Technical Consultant for PlumbLead.ai.
Provide a professional, technically accurate ballpark estimate for this plumbing service request.

Service Type: ${request.serviceType}
Details: ${request.details}
Location: ${request.location}

Guidelines:
1. Use precise plumbing terminology (T&P valve, sediment buildup, thermal expansion, etc.)
2. Explain why the price range varies (labor complexity, material quality, local rates)
3. Provide one quick tip the homeowner can check before the plumber arrives
4. Be direct, authoritative, and approachable — no fluff
5. IMPORTANT: Respond entirely in ${lang}

Return ONLY a valid JSON object with exactly these fields (no markdown, no extra text):
{
  "estimateRange": "$X,XXX - $X,XXX",
  "personalizedMessage": "2-4 sentence technical explanation for the homeowner",
  "suggestedNextSteps": ["step 1", "step 2", "step 3"]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: QUOTE_AI_MODEL,
      contents: prompt,
    });

    // response.text is a property in @google/genai v0.7, not a method
    const rawText = response.text ?? "";

    // Strip markdown code fences if present
    const clean = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    const result = JSON.parse(clean || "{}");

    // Validate shape — fall back to safe defaults if AI returns unexpected structure
    return {
      estimateRange: result.estimateRange || "Contact for estimate",
      personalizedMessage: result.personalizedMessage || "Please contact a licensed plumber for an accurate assessment.",
      suggestedNextSteps: Array.isArray(result.suggestedNextSteps) ? result.suggestedNextSteps : [],
    };
  } catch (error) {
    console.error("Error generating AI quote:", error);
    throw new Error("Failed to generate quote. Please try again.");
  }
}
