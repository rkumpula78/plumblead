
import express from 'express';
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

// 2. Instant Quote Tool
app.post('/api/quote', async (req, res) => {
  try {
    const quoteRequest: QuoteRequest = req.body;
    const quoteResponse: QuoteResponse = await generateAIQuote(quoteRequest);
    res.json(quoteResponse);
  } catch (error) {
    console.error("Error in /api/quote:", error);
    res.status(500).json({ error: "Failed to generate instant quote." });
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
