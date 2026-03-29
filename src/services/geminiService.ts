// src/services/geminiService.ts

import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Make the AI model configurable via environment variable
const QUOTE_AI_MODEL = process.env.PLUMBLEAD_QUOTE_AI_MODEL || "gemini-3-flash-preview";

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
    You are a Senior Plumbing Technical Consultant and Educator for PlumbLead.ai. Your goal is to provide a highly professional, technically accurate, and educational ballpark estimate for the following plumbing service:

    Service Type: ${request.serviceType}
    Details: ${request.details}
    Location: ${request.location}

    Personality Guidelines:
    1. Technical Authority: Use precise industry terminology (e.g., "T&P valve," "sediment buildup," "thermal expansion"). Explain the likely technical cause of the issue based on the details provided.
    2. Educator: Be transparent and helpful. Briefly explain *why* the price range varies (e.g., "labor complexity," "material quality") and provide one quick tip the homeowner can check themselves before the plumber arrives.
    3. Professional & Precise: Avoid fluff. Be direct, authoritative, yet approachable.

    Rules:
    1. Provide a realistic price range (e.g., "$1,200 - $1,800").
    2. Write a detailed, educational, and technically grounded message to the homeowner.
    3. Suggest 2-3 logical next steps that prioritize safety and long-term solutions.
    4. IMPORTANT: You MUST respond in ${lang}.

    Return the response in JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: QUOTE_AI_MODEL, // Use configurable model
      contents: [{ role: "user", parts: [{ text: prompt }] }], // Gemini expects contents in this format
      generationConfig: { // Use generationConfig for responseMimeType and responseSchema
        responseMimeType: "application/json",
      },
      tools: [{ // Define tools for schema generation
        functionDeclarations: [{
          name: "QuoteResponse",
          description: "Structure for AI-generated plumbing quote",
          parameters: {
            type: Type.OBJECT,
            properties: {
              estimateRange: { type: Type.STRING },
              personalizedMessage: { type: Type.STRING },
              suggestedNextSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["estimateRange", "personalizedMessage", "suggestedNextSteps"]
          }
        }]
      }]
    });

    // Parse text and then validate against schema implicitly via type casting
    const result = JSON.parse(response.text() || "{}");
    return result as QuoteResponse;
  } catch (error) {
    console.error("Error generating AI quote:", error);
    throw new Error("Failed to generate quote. Please try again.");
  }
}
