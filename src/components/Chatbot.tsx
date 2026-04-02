// src/components/Chatbot.tsx
// PlumbLead.ai — Floating AI chat widget

import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatbotProps {
  lang?: 'en' | 'es';
}

// Always point to Railway backend
const API_BASE = 'https://plumblead-production.up.railway.app';

const COPY = {
  en: {
    title: 'PlumbLead Assistant',
    subtitle: 'Senior Plumbing Consultant',
    placeholder: 'Ask about a plumbing issue...',
    greeting: "Hi! I'm your PlumbLead AI assistant — a senior plumbing consultant. Describe your issue and I'll give you expert guidance and a ballpark estimate.",
    error: "Sorry, I'm having trouble connecting. Please try again.",
    openLabel: 'Chat with a plumbing expert',
    suggestionLabel: 'Quick questions:',
    suggestions: ['My water heater is leaking', 'What causes low water pressure?', 'How much does drain cleaning cost?', 'My toilet keeps running'],
  },
  es: {
    title: 'Asistente PlumbLead',
    subtitle: 'Consultor Senior de Plomería',
    placeholder: 'Pregunta sobre un problema de plomería...',
    greeting: '¡Hola! Soy tu asistente de IA de PlumbLead — consultor senior de plomería. Describe tu problema y te daré orientación experta y un estimado.',
    error: 'Lo siento, tengo problemas de conexión. Por favor intenta de nuevo.',
    openLabel: 'Habla con un experto en plomería',
    suggestionLabel: 'Preguntas rápidas:',
    suggestions: ['Mi calentador está goteando', '¿Qué causa la baja presión de agua?', '¿Cuánto cuesta limpiar el drenaje?', 'Mi inodoro no para de correr'],
  },
};

const Chatbot: React.FC<ChatbotProps> = ({ lang = 'en' }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const [unread, setUnread] = useState(0);
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
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), lang, sessionId }),
      });
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.response || t.error, timestamp: new Date() }]);
      if (!open) setUnread(prev => prev + 1);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: t.error, timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } };
  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <style>{`@keyframes pl-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}@keyframes pl-fadein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes pl-bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}.pl-msg{animation:pl-fadein 0.25s ease}.pl-widget{animation:pl-fadein 0.3s ease}`}</style>
      <button onClick={() => setOpen(!open)} aria-label={t.openLabel} style={{ position:'fixed',bottom:28,right:28,zIndex:9999,width:60,height:60,borderRadius:'50%',background:open?'#0D0D0D':'#F5A623',border:'3px solid #0D0D0D',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,boxShadow:'0 4px 20px rgba(0,0,0,0.25)',transition:'all 0.2s',animation:!open?'pl-pulse 3s infinite':'none' }}>
        {open ? <span style={{color:'#F5A623',fontSize:20,fontWeight:700,lineHeight:1}}>✕</span> : <span style={{fontSize:22}}>🔧</span>}
        {unread > 0 && !open && <div style={{position:'absolute',top:-4,right:-4,width:20,height:20,borderRadius:'50%',background:'#D83030',border:'2px solid #FFF',fontSize:11,fontWeight:700,color:'#FFF',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'DM Sans, sans-serif'}}>{unread}</div>}
      </button>
      {open && (
        <div className="pl-widget" style={{position:'fixed',bottom:100,right:28,zIndex:9998,width:360,maxHeight:560,background:'#FFF',border:'3px solid #0D0D0D',display:'flex',flexDirection:'column',fontFamily:'DM Sans, sans-serif',boxShadow:'0 8px 40px rgba(0,0,0,0.2)'}}>
          <div style={{background:'#0D0D0D',padding:'14px 18px',display:'flex',alignItems:'center',gap:12,borderBottom:'3px solid #F5A623'}}>
            <div style={{width:40,height:40,borderRadius:'50%',background:'#F5A623',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>🔧</div>
            <div style={{flex:1}}>
              <div style={{fontFamily:'Bebas Neue, sans-serif',fontSize:18,color:'#F5A623',letterSpacing:1,lineHeight:1.2}}>{t.title}</div>
              <div style={{fontSize:11,color:'#9E9B91',display:'flex',alignItems:'center',gap:5}}><span style={{width:6,height:6,borderRadius:'50%',background:'#4CAF50',display:'inline-block'}}/>{t.subtitle}</div>
            </div>
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'16px',display:'flex',flexDirection:'column',gap:12,maxHeight:360,background:'#F5F4F0'}}>
            {messages.map(msg => (
              <div key={msg.id} className="pl-msg" style={{display:'flex',flexDirection:msg.role==='user'?'row-reverse':'row',alignItems:'flex-end',gap:8}}>
                {msg.role==='assistant' && <div style={{width:28,height:28,borderRadius:'50%',background:'#F5A623',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0}}>🔧</div>}
                <div style={{maxWidth:'78%'}}>
                  <div style={{padding:'10px 14px',background:msg.role==='user'?'#0D0D0D':'#FFF',color:msg.role==='user'?'#FFF':'#0D0D0D',fontSize:14,lineHeight:1.5,borderRadius:msg.role==='user'?'12px 4px 12px 12px':'4px 12px 12px 12px',border:msg.role==='assistant'?'1px solid #E8E6DF':'none'}}>{msg.content}</div>
                  <div style={{fontSize:10,color:'#9E9B91',marginTop:3,textAlign:msg.role==='user'?'right':'left'}}>{formatTime(msg.timestamp)}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="pl-msg" style={{display:'flex',alignItems:'flex-end',gap:8}}>
                <div style={{width:28,height:28,borderRadius:'50%',background:'#F5A623',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>🔧</div>
                <div style={{padding:'12px 16px',background:'#FFF',border:'1px solid #E8E6DF',borderRadius:'4px 12px 12px 12px',display:'flex',gap:4,alignItems:'center'}}>
                  {[0,150,300].map((d,i)=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:'#9E9B91',animation:`pl-bounce 1s ${d}ms infinite`}}/>)}
                </div>
              </div>
            )}
            <div ref={messagesEndRef}/>
          </div>
          {messages.filter(m=>m.role==='user').length===0 && (
            <div style={{padding:'10px 16px',background:'#FFF',borderTop:'1px solid #E8E6DF'}}>
              <div style={{fontSize:11,color:'#9E9B91',fontWeight:700,textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>{t.suggestionLabel}</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {t.suggestions.map((s,i)=><button key={i} onClick={()=>sendMessage(s)} style={{fontSize:12,padding:'5px 10px',border:'1px solid #E8E6DF',background:'#F5F4F0',cursor:'pointer',fontFamily:'DM Sans, sans-serif',color:'#0D0D0D'}}>{s}</button>)}
              </div>
            </div>
          )}
          <div style={{padding:'12px 16px',background:'#FFF',borderTop:'2px solid #0D0D0D',display:'flex',gap:8,alignItems:'center'}}>
            <input ref={inputRef} type="text" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={t.placeholder} disabled={loading} style={{flex:1,padding:'10px 12px',fontSize:14,border:'2px solid #E8E6DF',background:'#FFF',fontFamily:'DM Sans, sans-serif',outline:'none',color:'#0D0D0D'}}/>
            <button onClick={()=>sendMessage(input)} disabled={loading||!input.trim()} style={{width:40,height:40,flexShrink:0,background:input.trim()&&!loading?'#F5A623':'#E8E6DF',border:'none',cursor:input.trim()&&!loading?'pointer':'not-allowed',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,transition:'background 0.2s'}}>→</button>
          </div>
          <div style={{padding:'6px 16px',background:'#0D0D0D',textAlign:'center',fontSize:10,color:'#5C5A53',letterSpacing:0.5}}>Powered by <span style={{color:'#F5A623',fontWeight:700}}>PlumbLead.ai</span></div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
