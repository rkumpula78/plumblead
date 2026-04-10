// src/components/Chatbot.tsx
// PlumbLead.ai — Floating AI chat widget with quote handoff + context extraction

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  showQuoteCta?: boolean;
}

export interface ChatContext {
  serviceKey: string;   // matched QuoteModal service key, or ''
  serviceLabel: string; // human-readable matched service label
  details: string;      // summary of user messages
  location: string;     // extracted location if mentioned
  urgency: string;      // 'emergency' | 'soon' | 'routine'
}

interface ChatbotProps {
  lang?: 'en' | 'es';
  onOpenQuote?: (context?: ChatContext) => void;
}

const API_BASE = 'https://plumblead-production.up.railway.app';

const COPY = {
  en: {
    title: 'PlumbLead Assistant',
    subtitle: 'Senior Plumbing Consultant',
    placeholder: 'Ask about a plumbing issue...',
    greeting: "Hi! I'm your PlumbLead AI assistant. Describe your plumbing issue and I'll give you expert guidance — then we can get you an instant estimate.",
    error: "Sorry, I'm having trouble connecting. Please try again.",
    openLabel: 'Chat with a plumbing expert',
    suggestionLabel: 'Quick questions:',
    suggestions: ['My water heater is leaking', 'What causes low water pressure?', 'How much does drain cleaning cost?', 'My toilet keeps running'],
    quoteCtaTitle: 'Ready for a price estimate?',
    quoteCtaBody: 'Get an instant AI-powered quote in 30 seconds — no commitment required.',
    quoteCtaButton: '⚡ Get My Free Estimate →',
  },
  es: {
    title: 'Asistente PlumbLead',
    subtitle: 'Consultor Senior de Plomería',
    placeholder: 'Pregunta sobre un problema de plomería...',
    greeting: '¡Hola! Soy tu asistente de IA. Describe tu problema y te daré orientación experta — luego podemos darte un estimado instantáneo.',
    error: 'Lo siento, tengo problemas de conexión. Por favor intenta de nuevo.',
    openLabel: 'Habla con un experto en plomería',
    suggestionLabel: 'Preguntas rápidas:',
    suggestions: ['Mi calentador está goteando', '¿Qué causa la baja presión?', '¿Cuánto cuesta el drenaje?', 'Mi inodoro no para'],
    quoteCtaTitle: '¿Listo para un estimado?',
    quoteCtaBody: 'Obtén una cotización instantánea en 30 segundos — sin compromiso.',
    quoteCtaButton: '⚡ Obtener Mi Estimado Gratis →',
  },
};

// ─── Service detection ────────────────────────────────────────────────────────
// Maps conversation keywords to QuoteModal service keys

const SERVICE_PATTERNS: Array<{ key: string; label: string; pattern: RegExp }> = [
  { key: 'water-heater-tank',     label: 'Water Heater (Tank)',     pattern: /water\s*heater|hot\s*water\s*tank|tank\s*water\s*heater/i },
  { key: 'water-heater-tankless', label: 'Tankless Water Heater',   pattern: /tankless/i },
  { key: 'water-heater-repair',   label: 'Water Heater Repair',     pattern: /water\s*heater.*repair|repair.*water\s*heater/i },
  { key: 'emergency-leak',        label: 'Emergency / Leak',        pattern: /leak|burst|flood|emergency|water\s*damage|gushing/i },
  { key: 'drain-cleaning',        label: 'Drain Cleaning',          pattern: /drain|clog|slow\s*drain|backed\s*up|blockage/i },
  { key: 'toilet-repair',         label: 'Toilet Repair / Install', pattern: /toilet|commode|running\s*water|flush/i },
  { key: 'leak-detection',        label: 'Leak Detection',          pattern: /detect.*leak|leak.*detect|hidden\s*leak|water\s*bill/i },
  { key: 'sewer-line',            label: 'Sewer Line',              pattern: /sewer|sewage|mainline|main\s*line|septic/i },
  { key: 'repiping',              label: 'Repiping',                pattern: /repipe|re-pipe|whole\s*house.*pipe|galvanized|corroded\s*pipe/i },
  { key: 'faucet-fixture',        label: 'Faucets & Fixtures',      pattern: /faucet|fixture|tap|dripping|sink/i },
  { key: 'sump-pump',             label: 'Sump Pump',               pattern: /sump\s*pump/i },
];

const URGENCY_PATTERNS = {
  emergency: /emergency|urgent|right now|immediately|flooding|burst|no\s*hot\s*water|asap/i,
  soon:      /this\s*week|few\s*days|soon|not\s*working|stopped\s*working/i,
};

const LOCATION_PATTERN = /\b([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}|\d{5})\b/;

function extractContext(messages: Message[]): ChatContext {
  const userText = messages
    .filter(m => m.role === 'user')
    .map(m => m.content)
    .join(' ');

  const allText = messages
    .filter(m => m.id !== 'greeting')
    .map(m => m.content)
    .join(' ');

  // Detect service — user messages first, then all text as fallback
  let matchedService = { key: '', label: '' };
  for (const svc of SERVICE_PATTERNS) {
    if (svc.pattern.test(userText)) { matchedService = { key: svc.key, label: svc.label }; break; }
  }
  if (!matchedService.key) {
    for (const svc of SERVICE_PATTERNS) {
      if (svc.pattern.test(allText)) { matchedService = { key: svc.key, label: svc.label }; break; }
    }
  }

  // Detect urgency
  let urgency = 'routine';
  if (URGENCY_PATTERNS.emergency.test(userText)) urgency = 'emergency';
  else if (URGENCY_PATTERNS.soon.test(userText)) urgency = 'soon';

  // Extract location
  const locationMatch = userText.match(LOCATION_PATTERN);
  const location = locationMatch ? locationMatch[1].trim() : '';

  // Build details summary from user messages
  const details = messages
    .filter(m => m.role === 'user' && m.id !== 'greeting')
    .map(m => m.content.trim())
    .join('. ')
    .replace(/\.{2,}/g, '.')
    .trim();

  return { serviceKey: matchedService.key, serviceLabel: matchedService.label, details, location, urgency };
}

// ─── Component ────────────────────────────────────────────────────────────────

const Chatbot: React.FC<ChatbotProps> = ({ lang = 'en', onOpenQuote }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [unread, setUnread] = useState(0);
  const [aiResponseCount, setAiResponseCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const t = COPY[lang];

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (open) { setUnread(0); setTimeout(() => inputRef.current?.focus(), 100); } }, [open]);
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ id: 'greeting', role: 'assistant', content: t.greeting, timestamp: new Date() }]);
    }
  }, [open]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text.trim(), timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    const history = updatedMessages
      .filter(m => m.id !== 'greeting')
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), history, lang, sessionId }),
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      const newCount = aiResponseCount + 1;
      setAiResponseCount(newCount);
      const showCta = newCount >= 2;
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || t.error,
        timestamp: new Date(),
        showQuoteCta: showCta,
      }]);
      if (!open) setUnread(prev => prev + 1);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: t.error, timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleGetQuote = () => {
    const context = extractContext(messages);
    setOpen(false);
    if (onOpenQuote) {
      onOpenQuote(context);
    } else {
      // Fallback: store context and navigate
      try { sessionStorage.setItem('plumblead_chat_context', JSON.stringify(context)); } catch {}
      window.location.href = '/quote';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } };
  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <style>{`
        @keyframes plc-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
        @keyframes plc-fadein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes plc-bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}
        @keyframes plc-ctapop{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
        .plc-msg{animation:plc-fadein 0.25s ease}
        .plc-widget{animation:plc-fadein 0.3s ease}
        .plc-cta{animation:plc-ctapop 0.3s ease}
      `}</style>

      <button onClick={() => setOpen(!open)} aria-label={t.openLabel}
        style={{ position:'fixed',bottom:28,right:28,zIndex:9999,width:60,height:60,borderRadius:'50%',background:open?'#0D0D0D':'#F5A623',border:'3px solid #0D0D0D',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,boxShadow:'0 4px 20px rgba(0,0,0,0.25)',transition:'all 0.2s',animation:!open?'plc-pulse 3s infinite':'none' }}>
        {open ? <span style={{color:'#F5A623',fontSize:20,fontWeight:700}}>✕</span> : <span>🔧</span>}
        {unread > 0 && !open && (
          <div style={{position:'absolute',top:-4,right:-4,width:20,height:20,borderRadius:'50%',background:'#D83030',border:'2px solid #FFF',fontSize:11,fontWeight:700,color:'#FFF',display:'flex',alignItems:'center',justifyContent:'center'}}>{unread}</div>
        )}
      </button>

      {open && (
        <div className="plc-widget" style={{position:'fixed',bottom:100,right:28,zIndex:9998,width:360,maxHeight:580,background:'#FFF',border:'3px solid #0D0D0D',display:'flex',flexDirection:'column',fontFamily:'DM Sans, sans-serif',boxShadow:'0 8px 40px rgba(0,0,0,0.2)'}}>
          <div style={{background:'#0D0D0D',padding:'14px 18px',display:'flex',alignItems:'center',gap:12,borderBottom:'3px solid #F5A623'}}>
            <div style={{width:40,height:40,borderRadius:'50%',background:'#F5A623',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>🔧</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:18,color:'#F5A623',letterSpacing:1,lineHeight:1.2}}>{t.title}</div>
              <div style={{fontSize:11,color:'#9E9B91',display:'flex',alignItems:'center',gap:5}}>
                <span style={{width:6,height:6,borderRadius:'50%',background:'#4CAF50',display:'inline-block'}}/>{t.subtitle}
              </div>
            </div>
          </div>

          <div style={{flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:12,maxHeight:380,background:'#F5F4F0'}}>
            {messages.map(msg => (
              <div key={msg.id}>
                <div className="plc-msg" style={{display:'flex',flexDirection:msg.role==='user'?'row-reverse':'row',alignItems:'flex-end',gap:8}}>
                  {msg.role==='assistant' && (
                    <div style={{width:28,height:28,borderRadius:'50%',background:'#F5A623',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0}}>🔧</div>
                  )}
                  <div style={{maxWidth:'78%'}}>
                    <div style={{padding:'10px 14px',background:msg.role==='user'?'#0D0D0D':'#FFF',color:msg.role==='user'?'#FFF':'#0D0D0D',fontSize:14,lineHeight:1.5,borderRadius:msg.role==='user'?'12px 4px 12px 12px':'4px 12px 12px 12px',border:msg.role==='assistant'?'1px solid #E8E6DF':'none'}}>
                      {msg.content}
                    </div>
                    <div style={{fontSize:10,color:'#9E9B91',marginTop:3,textAlign:msg.role==='user'?'right':'left'}}>{formatTime(msg.timestamp)}</div>
                  </div>
                </div>

                {msg.showQuoteCta && (
                  <div className="plc-cta" style={{margin:'12px 0 0 36px',background:'#0D0D0D',borderRadius:12,padding:'14px 16px',border:'2px solid #F5A623'}}>
                    <div style={{fontSize:13,fontWeight:700,color:'#F5A623',marginBottom:4}}>{t.quoteCtaTitle}</div>
                    <div style={{fontSize:12,color:'#9E9B91',marginBottom:12,lineHeight:1.5}}>{t.quoteCtaBody}</div>
                    <button onClick={handleGetQuote}
                      style={{width:'100%',padding:'10px',background:'#F5A623',color:'#0D0D0D',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer',fontFamily:'DM Sans, sans-serif'}}>
                      {t.quoteCtaButton}
                    </button>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="plc-msg" style={{display:'flex',alignItems:'flex-end',gap:8}}>
                <div style={{width:28,height:28,borderRadius:'50%',background:'#F5A623',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>🔧</div>
                <div style={{padding:'12px 16px',background:'#FFF',border:'1px solid #E8E6DF',borderRadius:'4px 12px 12px 12px',display:'flex',gap:4,alignItems:'center'}}>
                  {[0,150,300].map((d,i)=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:'#9E9B91',animation:`plc-bounce 1s ${d}ms infinite`}}/>)}
                </div>
              </div>
            )}
            <div ref={messagesEndRef}/>
          </div>

          {messages.filter(m=>m.role==='user').length===0 && (
            <div style={{padding:'10px 16px',background:'#FFF',borderTop:'1px solid #E8E6DF'}}>
              <div style={{fontSize:11,color:'#9E9B91',fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>{t.suggestionLabel}</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {t.suggestions.map((s,i)=>(
                  <button key={i} onClick={()=>sendMessage(s)}
                    style={{fontSize:12,padding:'5px 10px',border:'1px solid #E8E6DF',background:'#F5F4F0',cursor:'pointer',fontFamily:'DM Sans, sans-serif',color:'#0D0D0D',borderRadius:4}}>{s}</button>
                ))}
              </div>
            </div>
          )}

          <div style={{padding:'12px 16px',background:'#FFF',borderTop:'2px solid #0D0D0D',display:'flex',gap:8,alignItems:'center'}}>
            <input ref={inputRef} type="text" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={t.placeholder} disabled={loading}
              style={{flex:1,padding:'10px 12px',fontSize:14,border:'2px solid #E8E6DF',background:'#FFF',fontFamily:'DM Sans, sans-serif',outline:'none',color:'#0D0D0D'}}/>
            <button onClick={()=>sendMessage(input)} disabled={loading||!input.trim()}
              style={{width:40,height:40,flexShrink:0,background:input.trim()&&!loading?'#F5A623':'#E8E6DF',border:'none',cursor:input.trim()&&!loading?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,transition:'background 0.2s'}}>→</button>
          </div>

          <div style={{padding:'6px 16px',background:'#0D0D0D',textAlign:'center',fontSize:10,color:'#5C5A53',letterSpacing:0.5}}>
            Powered by <span style={{color:'#F5A623',fontWeight:700}}>PlumbLead.ai</span>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
