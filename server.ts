import express from 'express';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import cors from 'cors';
import { generateAIQuote, QuoteRequest, QuoteResponse } from './src/services/geminiService';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Allow requests from plumblead.ai and local dev
const allowedOrigins = [
  'https://plumblead.ai',
  'https://www.plumblead.ai',
  'https://plumblead-site.rkumpula.workers.dev',
  'http://localhost:5173',
  'http://localhost:3000',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile, curl, etc)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive for now — tighten after confirmed working
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

const openClawApiEndpoint = process.env.OPENCLAW_API_ENDPOINT;
const openClawApiKey = process.env.OPENCLAW_API_KEY;
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// --- Health Check ---
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- Chat ---
app.post('/api/chat', async (req, res) => {
  const { message, lang = 'en', sessionId = 'plumblead-user' } = req.body;
  const systemInstruction = `You are a Senior Plumbing Technical Consultant for PlumbLead.ai.
  Use precise plumbing terminology. Explain the how and why behind issues.
  Offer safe DIY tips but always note when a professional is required.
  Be direct and authoritative. Encourage the Instant Quote tool for pricing.
  IMPORTANT: Respond in ${lang === 'es' ? 'Spanish' : 'English'}.`;

  // Try OpenClaw first
  if (openClawApiEndpoint && openClawApiKey) {
    try {
      const response = await fetch(openClawApiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openClawApiKey}` },
        body: JSON.stringify({
          model: 'openclaw:plumblead',
          messages: [{ role: 'user', content: systemInstruction + '\n\n' + message }],
          user: sessionId
        })
      });
      const result = await response.json() as any;
      const chatbotResponse = result.choices?.[0]?.message?.content || result.output;
      if (chatbotResponse) return res.json({ response: chatbotResponse });
    } catch (err) {
      console.error('OpenClaw error, falling back to Gemini:', err);
    }
  }

  // Gemini fallback
  try {
    const geminiResponse = await ai.models.generateContent({
      model: process.env.PLUMBLEAD_QUOTE_AI_MODEL || 'gemini-2.0-flash',
      contents: `${systemInstruction}\n\nHomeowner question: ${message}`,
    });
    const text = geminiResponse.text ?? "I'm sorry, I couldn't process that right now.";
    return res.json({ response: text });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'Failed to get chatbot response.' });
  }
});

// --- Quote ---
app.post('/api/quote', async (req, res) => {
  const { serviceType, details, location, language = 'en', sessionId = 'plumblead-quote-user' } = req.body;
  const quoteRequest: QuoteRequest = { serviceType, details, location, language };

  if (!openClawApiEndpoint || !openClawApiKey) {
    try {
      const quoteResponse: QuoteResponse = await generateAIQuote(quoteRequest);
      return res.json(quoteResponse);
    } catch (error) {
      console.error('Quote error:', error);
      return res.status(500).json({ error: 'Failed to generate quote.' });
    }
  }

  try {
    const qualificationPrompt = `You are a PlumbLead.ai Lead Qualifier. Analyze this request and return ONLY valid JSON:
{
  "leadScore": "High Urgency|Routine|Emergency",
  "crossSellOpportunities": ["string"],
  "geminiPromptRefinement": "optional extra context"
}
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
    } catch { /* ignore */ }

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
    console.error('Quote error, falling back:', error);
    try {
      return res.json(await generateAIQuote(quoteRequest));
    } catch {
      return res.status(500).json({ error: 'Failed to generate quote.' });
    }
  }
});

// --- Lead Forwarding ---
app.post('/api/leads', async (req, res) => {
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!n8nWebhookUrl) {
    console.warn('N8N_WEBHOOK_URL not set');
    return res.status(200).json({ message: 'Lead received.' });
  }
  try {
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    if (response.ok) {
      return res.json({ message: 'Lead forwarded to n8n.' });
    }
    return res.status(200).json({ message: 'Lead received (forwarding failed).' });
  } catch (error) {
    console.error('Lead forwarding error:', error);
    return res.status(200).json({ message: 'Lead received.' });
  }
});

app.listen(port, () => {
  console.log(`PlumbLead.ai server running on port ${port}`);
});
