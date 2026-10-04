import { useState, useRef, useEffect } from 'react';
import Headline from '../components/Headline.jsx';
import { askChatbot } from '../api.js';

const WELCOME = {
  from: 'bot',
  text: "Hi! I'm the AirTrace AI assistant. Ask me about pollution sources, AQI, or how to reduce pollution.",
};

export default function ChatbotPage() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { from: 'user', text }]);
    setInput('');
    setSending(true);

    try {
      const { reply } = await askChatbot(text);
      setMessages((prev) => [...prev, { from: 'bot', text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { from: 'bot', text: 'Sorry, I could not reach the server. Try again.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Headline eyebrow="Assistant" title="Pollution AI Assistant" subtitle="Ask about sources, AQI, or reduction tips" />
      <div className="card panel" style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', height: 460 }}>
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: 4 }}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                margin: '8px 0',
                display: 'flex',
                justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  padding: '9px 13px',
                  borderRadius: 12,
                  fontSize: 13,
                  background: m.from === 'user' ? 'linear-gradient(100deg, var(--teal), #74d9db)' : '#0c282d',
                  color: m.from === 'user' ? '#06343a' : 'var(--ink)',
                  border: m.from === 'user' ? 'none' : '1px solid var(--line)',
                }}
              >
                {m.text}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask something…"
            style={{
              flex: 1,
              background: '#0a2227',
              border: '1px solid var(--line)',
              borderRadius: 8,
              padding: '9px 11px',
              color: 'var(--ink)',
              fontFamily: 'inherit',
              fontSize: 13,
            }}
          />
          <button className="predict" type="submit" disabled={sending} style={{ width: 'auto', padding: '0 18px' }}>
            Send
          </button>
        </form>
      </div>
    </>
  );
}
