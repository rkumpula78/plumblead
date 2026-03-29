
import express from 'express';
import { GoogleGenAI } from "@google/genai"; // Keep for /api/quote if still using Gemini
import dotenv from 'dotenv';
import cors from 'cors';
import { generateAIQuote, QuoteRequest, QuoteResponse } from './src/services/geminiService'; // Assuming geminiService.ts
import fetch from 'node-fetch'; // For webhook forwarding

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// OpenClaw Integration Configuration
const openClawApiEndpoint = process.env.OPENCLAW_API_ENDPOINT;
const openClawApiKey = process.env.OPENCLAW_API_KEY;

// Initialize Gemini API (for /api/quote and potentially other future uses)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// --- API Endpoints ---

// 1. Chatbot "Brain" (Now powered by OpenClaw)
app.post('/api/chat', async (req, res) => {
  const { message, lang = 'en', sessionId = 'plumblead-user' } = req.body; // Added sessionId
  const systemInstruction = `You are a Senior Plumbing Technical Consultant and Educator for PlumbLead.ai. Personality Traits: - Technical Authority: Use precise plumbing terminology (e.g., "T&P valve," "sediment buildup"). Explain the "how" and "why" behind plumbing issues. - Educator: Be transparent and helpful. Offer DIY troubleshooting tips when safe, but always emphasize when a professional is required for safety or code compliance. - Professional & Precise: Avoid fluff. Get straight to the point with high-value information. Goals: 1. Answer technical plumbing questions with authority. 2. Educate the user on the complexity of their issue. 3. Encourage users to use the Instant Quote tool for a detailed price estimate. 4. IMPORTANT: You MUST respond in ${lang}.`;

  if (!openClawApiEndpoint || !openClawApiKey) {
    console.error("OpenClaw API endpoint or key not configured.");
    return res.status(500).json({ error: "Chatbot not configured." });
  }

  try {
    const response = await fetch(openClawApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openClawApiKey}`
      },
      body: JSON.stringify({
        model: 'openclaw:plumblead', // Target the specific OpenClaw agent
        messages: [{ role: 'user', content: systemInstruction + "\n\n" + message }], // Combine system instruction with user message
        user: sessionId // Pass the session ID for OpenClaw to manage context
      })
    });

    const openClawResult = await response.json();

    // OpenClaw API returns content in messages[0].content or similar, or directly as 'output'
    // This assumes OpenClaw's OpenAI-compatible endpoint returns an array of messages
    // with content in the first message's 'content' field.
    const chatbotResponse = openClawResult.choices?.[0]?.message?.content || openClawResult.output || "I'm sorry, I couldn't process that right now.";
    res.json({ response: chatbotResponse });

  } catch (error) {
    console.error("Error in /api/chat (OpenClaw):", error);
    res.status(500).json({ error: "Failed to get chatbot response from OpenClaw." });
  }
});

// 2. Instant Quote Tool (Now pre-qualified by OpenClaw)
app.post('/api/quote', async (req, res) => {
  const { serviceType, details, location, language = 'en', sessionId = 'plumblead-quote-user' } = req.body;
  const quoteRequest: QuoteRequest = { serviceType, details, location, language };

  if (!openClawApiEndpoint || !openClawApiKey) {
    console.error("OpenClaw API endpoint or key not configured for quote pre-qualification.");
    // Fallback to direct Gemini call if OpenClaw is not configured
    try {
      const quoteResponse: QuoteResponse = await generateAIQuote(quoteRequest);
      return res.json(quoteResponse);
    } catch (error) {
      console.error("Error in /api/quote (Gemini Fallback):", error);
      return res.status(500).json({ error: "Failed to generate instant quote (Gemini fallback)." });
    }
  }

  try {
    // Phase 1: OpenClaw Pre-qualification
    const qualificationPrompt = `You are a PlumbLead.ai Lead Qualifier. Analyze the following plumbing quote request. Your goal is to score the lead (e.g., 'High Urgency', 'Routine'), identify any specific keywords or potential cross-sell opportunities (e.g., 'water treatment' if hard water is implied by location), and suggest any refinements to the prompt for the main AI (Gemini) to generate a better quote.

    Quote Request Details:
    Service Type: ${serviceType}
    Details: ${details}
    Location: ${location}
    Language: ${language}

    Return a JSON object with 'leadScore' (string), 'crossSellOpportunities' (array of strings), and 'geminiPromptRefinement' (string, optional) for Gemini to use.`;

    const openClawResponse = await fetch(openClawApiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openClawApiKey}`
      },
      body: JSON.stringify({
        model: 'openclaw:plumblead',
        messages: [{ role: 'user', content: qualificationPrompt }],
        user: sessionId
      })
    });

    const openClawResult = await openClawResponse.json();
    const openClawData = JSON.parse(openClawResult.choices?.[0]?.message?.content || openClawResult.output || '{}');

    // Phase 2: Refine Gemini's prompt based on OpenClaw's insights
    let refinedDetails = details;
    if (openClawData.geminiPromptRefinement) {
      refinedDetails += `\n\nOpenClaw Insights for Gemini: ${openClawData.geminiPromptRefinement}`;
    }

    const finalQuoteRequest: QuoteRequest = {
      ...quoteRequest,
      details: refinedDetails,
    };

    // Phase 3: Call Gemini's generateAIQuote function
    const quoteResponse: QuoteResponse = await generateAIQuote(finalQuoteRequest);

    // Optionally, add OpenClaw's lead score to the response
    if (openClawData.leadScore) {
      (quoteResponse as any).leadScore = openClawData.leadScore;
    }
    if (openClawData.crossSellOpportunities) {
      (quoteResponse as any).crossSellOpportunities = openClawData.crossSellOpportunities;
    }

    res.json(quoteResponse);
  } catch (error) {
    console.error("Error in /api/quote (OpenClaw pre-qualification or Gemini call):", error);
    res.status(500).json({ error: "Failed to generate instant quote with OpenClaw pre-qualification." });
  }
});

// 3. Webhook Forwarding for Leads
app.post('/api/leads', async (req, res) => {
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!n8nWebhookUrl) {
    console.error("N8N_WEBHOOK_URL is not configured.");
    return res.status(500).json({ error: "Lead forwarding not configured." });
  }

  try {
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body) // Forward the entire lead payload
    });

    if (response.ok) {
      res.json({ message: "Lead successfully forwarded to n8n." });
    } else {
      console.error(`Error forwarding lead to n8n: ${response.status} ${response.statusText}`);
      res.status(response.status).json({ error: "Failed to forward lead to n8n." });
    }
  } catch (error) {
    console.error("Error forwarding lead:", error);
    res.status(500).json({ error: "Failed to forward lead." });
  }
});


app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
