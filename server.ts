import express from 'express';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import cors from 'cors';
import { generateAIQuote, QuoteRequest, QuoteResponse } from './src/services/geminiService';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const openClawApiEndpoint = process.env.OPENCLAW_API_ENDPOINT;
const openClawApiKey = process.env.OPENCLAW_API_KEY;
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// ─── Health Check (required by Railway) ──────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 1. Chat (OpenClaw with Gemini fallback) ──────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { message, lang = 'en', sessionId = 'plumblead-user' } = req.body;
  const systemInstruction = `You are a Senior Plumbing Technical Consultant and Educator for PlumbLead.ai.
  - Use precise plumbing terminology (T&P valve, sediment buildup, thermal expansion, etc.)
  - Explain the how and why behind plumbing issues
  - Offer safe DIY troubleshooting tips, but always note when a professional is required
  - Be direct and authoritative — no fluff
  - Encourage users to use the Instant Quote tool for pricing
  - IMPORTANT: You MUST respond in ${lang === 'es' ? 'Spanish' : 'English'}.`;

  // Try OpenClaw first if configured
  if (openClawApiEndpoint && openClawApiKey) {
    try {
      const response = await fetch(openClawApiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openClawApiKey}`
        },
        body: JSON.stringify({
          model: 'openclaw:plumblead',
          messages: [{ role: 'user', content: systemInstruction + '\n\n' + message }],
          user: sessionId
        })
      });
      const result = await response.json() as any;
      const chatbotResponse = result.choices?.[0]?.message?.content || result.output;
      if (chatbotResponse) {
        return res.json({ response: chatbotResponse });
      }
    } catch (err) {
      console.error('OpenClaw error, falling back to Gemini:', err);
    }
  }

  // Gemini fallback for chat
  try {
    const geminiResponse = await ai.models.generateContent({
      model: process.env.PLUMBLEAD_QUOTE_AI_MODEL || 'gemini-2.0-flash',
      contents: `${systemInstruction}\n\nHomeowner question: ${message}`,
    });
    const text = geminiResponse.text ?? "I'm sorry, I couldn't process that right now.";
    return res.json({ response: text });
  } catch (error) {
    console.error('Gemini chat fallback error:', error);
    return res.status(500).json({ error: 'Failed to get chatbot response.' });
  }
});

// ─── 2. Quote Tool (OpenClaw pre-qual + Gemini) ───────────────────────────────
app.post('/api/quote', async (req, res) => {
  const { serviceType, details, location, language = 'en', sessionId = 'plumblead-quote-user' } = req.body;
  const quoteRequest: QuoteRequest = { serviceType, details, location, language };

  // Direct Gemini path if OpenClaw not configured
  if (!openClawApiEndpoint || !openClawApiKey) {
    try {
      const quoteResponse: QuoteResponse = await generateAIQuote(quoteRequest);
      return res.json(quoteResponse);
    } catch (error) {
      console.error('Gemini quote error:', error);
      return res.status(500).json({ error: 'Failed to generate quote.' });
    }
  }

  try {
    // OpenClaw pre-qualification
    const qualificationPrompt = `You are a PlumbLead.ai Lead Qualifier. Analyze this plumbing quote request and return ONLY a JSON object with:
- leadScore: string (e.g. "High Urgency", "Routine", "Emergency")
- crossSellOpportunities: string[] (e.g. ["water softener", "annual maintenance plan"])
- geminiPromptRefinement: string (optional — extra context for the quote AI)

Request: Service=${serviceType}, Details=${details}, Location=${location}`;

    const openClawResponse = await fetch(openClawApiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openClawApiKey}` },
      body: JSON.stringify({
        model: 'openclaw:plumblead',
        messages: [{ role: 'user', content: qualificationPrompt }],
        user: sessionId
      })
    });

    const openClawResult = await openClawResponse.json() as any;
    let openClawData: any = {};
    try {
      const raw = openClawResult.choices?.[0]?.message?.content || openClawResult.output || '{}';
      openClawData = JSON.parse(raw);
    } catch { /* ignore parse errors */ }

    const refinedDetails = openClawData.geminiPromptRefinement
      ? `${details}\n\nAdditional context: ${openClawData.geminiPromptRefinement}`
      : details;

    const quoteResponse: QuoteResponse = await generateAIQuote({ ...quoteRequest, details: refinedDetails });

    return res.json({
      ...quoteResponse,
      ...(openClawData.leadScore && { leadScore: openClawData.leadScore }),
      ...(openClawData.crossSellOpportunities && { crossSellOpportunities: openClawData.crossSellOpportunities }),
    });
  } catch (error) {
    console.error('Quote error, falling back to direct Gemini:', error);
    try {
      const quoteResponse: QuoteResponse = await generateAIQuote(quoteRequest);
      return res.json(quoteResponse);
    } catch (fallbackError) {
      return res.status(500).json({ error: 'Failed to generate quote.' });
    }
  }
});

// ─── 3. Lead Forwarding to n8n ────────────────────────────────────────────────
app.post('/api/leads', async (req, res) => {
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!n8nWebhookUrl) {
    console.warn('N8N_WEBHOOK_URL not configured — lead not forwarded');
    return res.status(200).json({ message: 'Lead received (forwarding not configured).' });
  }
  try {
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    if (response.ok) {
      res.json({ message: 'Lead successfully forwarded to n8n.' });
    } else {
      console.error(`n8n error: ${response.status}`);
      res.status(200).json({ message: 'Lead received (forwarding failed silently).' });
    }
  } catch (error) {
    console.error('Lead forwarding error:', error);
    res.status(200).json({ message: 'Lead received (forwarding error).' });
  }
});

app.listen(port, () => {
  console.log(`PlumbLead.ai server running on port ${port}`);
});
