import express from 'express';
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import cors from 'cors';
import { generateAIQuote, QuoteRequest, QuoteResponse } from './src/services/geminiService';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
  origin: (origin, callback) => { callback(null, true); },
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
  const isSpanish = lang === 'es';

  const systemInstruction = `You are a friendly plumbing assistant for PlumbLead.ai. Your job is to quickly qualify the homeowner's issue and guide them to get a free quote.

STRICT RULES:
- Keep responses SHORT — 2-4 sentences maximum. Never use headers, bullet points, or long lists.
- Ask ONE clarifying question per response to narrow down the problem.
- After 1-2 exchanges, encourage them to use the Instant Quote tool for a free estimate.
- Be warm and helpful, not clinical or encyclopedic.
- Never dump a wall of text. If you feel like writing more than 4 sentences, stop and ask a question instead.
- IMPORTANT: Respond entirely in ${isSpanish ? 'Spanish' : 'English'}.

Example good response to "my water heater is leaking":
"That sounds urgent — a leaking water heater needs attention soon. Is the leak coming from the top, bottom, or the side of the tank? That'll help us figure out if it's a quick fix or a replacement."

Example bad response: Long headers, bullet points, multiple sections. Never do this.`;

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
      contents: `${systemInstruction}\n\nHomeowner: ${message}`,
    });
    const text = geminiResponse.text ?? "I'm sorry, I couldn't process that right now.";
    return res.json({ response: text });
  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: 'Failed to get chatbot response.' });
  }
});

// --- Lead Qualification via Gemini (reliable fallback) ---
async function qualifyLeadWithGemini(serviceType: string, details: string, location: string): Promise<{
  leadScore: string;
  crossSellOpportunities: string[];
}> {
  const prompt = `You are a plumbing lead qualifier. Analyze this service request and return ONLY a JSON object with no markdown, no backticks, no explanation.

Service: ${serviceType}
Details: ${details}
Location: ${location}

Return exactly this JSON structure:
{
  "leadScore": "Emergency|High Urgency|Routine",
  "crossSellOpportunities": ["array", "of", "strings"]
}

Rules for leadScore:
- "Emergency": active leak, burst pipe, gas leak, flooding, no hot water
- "High Urgency": slow drain, running toilet, dripping faucet affecting daily life
- "Routine": preventive maintenance, installation planning, general inquiry

Rules for crossSellOpportunities: suggest 1-3 related services the homeowner might need.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    const text = (response.text ?? '').trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    const parsed = JSON.parse(text);
    return {
      leadScore: parsed.leadScore || 'Routine',
      crossSellOpportunities: Array.isArray(parsed.crossSellOpportunities)
        ? parsed.crossSellOpportunities
        : [],
    };
  } catch (err) {
    console.error('Gemini lead qualification error:', err);
    // Last resort defaults based on service type
    const isEmergency = serviceType.toLowerCase().includes('emergency') ||
      serviceType.toLowerCase().includes('leak') ||
      serviceType.toLowerCase().includes('sewer');
    return {
      leadScore: isEmergency ? 'High Urgency' : 'Routine',
      crossSellOpportunities: [],
    };
  }
}

// --- Quote ---
app.post('/api/quote', async (req, res) => {
  const { serviceType, details, location, language = 'en', sessionId = 'plumblead-quote-user' } = req.body;
  const quoteRequest: QuoteRequest = { serviceType, details, location, language };

  // Step 1: Try OpenClaw for lead qualification
  let leadScore = '';
  let crossSellOpportunities: string[] = [];
  let refinedDetails = details;

  if (openClawApiEndpoint && openClawApiKey) {
    try {
      const qualificationPrompt = `You are a PlumbLead.ai Lead Qualifier. Analyze this request and return ONLY valid JSON with no markdown or backticks:
{
  "leadScore": "Emergency|High Urgency|Routine",
  "crossSellOpportunities": ["string"],
  "geminiPromptRefinement": "optional extra context for quote generation"
}
Service: ${serviceType}
Details: ${details}
Location: ${location}`;

      const openClawResponse = await fetch(openClawApiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openClawApiKey}` },
        body: JSON.stringify({
          model: 'openclaw:plumblead',
          messages: [{ role: 'user', content: qualificationPrompt }],
          user: sessionId
        })
      });

      if (openClawResponse.ok) {
        const openClawResult = await openClawResponse.json() as any;
        const raw = (openClawResult.choices?.[0]?.message?.content || openClawResult.output || '').trim()
          .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.leadScore) leadScore = parsed.leadScore;
          if (Array.isArray(parsed.crossSellOpportunities)) crossSellOpportunities = parsed.crossSellOpportunities;
          if (parsed.geminiPromptRefinement) refinedDetails = `${details}\n\nAdditional context: ${parsed.geminiPromptRefinement}`;
        }
      }
    } catch (err) {
      console.error('OpenClaw qualification error, using Gemini fallback:', err);
    }
  }

  // Step 2: If OpenClaw didn't return lead score, use Gemini
  if (!leadScore) {
    try {
      const geminiQualification = await qualifyLeadWithGemini(serviceType, details, location);
      leadScore = geminiQualification.leadScore;
      crossSellOpportunities = geminiQualification.crossSellOpportunities;
    } catch (err) {
      console.error('Gemini qualification error:', err);
      leadScore = 'Routine';
    }
  }

  // Step 3: Generate the price estimate
  try {
    const quoteResponse: QuoteResponse = await generateAIQuote({ ...quoteRequest, details: refinedDetails });
    return res.json({
      ...quoteResponse,
      leadScore,
      crossSellOpportunities,
    });
  } catch (error) {
    console.error('Quote generation error:', error);
    // Return partial response with lead score even if quote fails
    return res.status(500).json({
      error: 'Failed to generate quote.',
      leadScore,
      crossSellOpportunities,
    });
  }
});

// --- Lead Forwarding ---
app.post('/api/leads', async (req, res) => {
  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!n8nWebhookUrl) {
    return res.status(200).json({ message: 'Lead received.' });
  }
  try {
    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    if (response.ok) return res.json({ message: 'Lead forwarded to n8n.' });
    return res.status(200).json({ message: 'Lead received (forwarding failed).' });
  } catch (error) {
    console.error('Lead forwarding error:', error);
    return res.status(200).json({ message: 'Lead received.' });
  }
});

app.listen(port, () => {
  console.log(`PlumbLead.ai server running on port ${port}`);
});
