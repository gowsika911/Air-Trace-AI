import { useEffect, useRef, useState } from 'react';
import Headline from '../components/Headline.jsx';
import FormattedMessage from '../components/FormattedMessage.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  listConversations,
  getConversation,
  deleteConversation,
  sendChatMessage,
} from '../api.js';
import './ChatbotPage.css';

const WELCOME =
  "Hi! I'm the AirTrace AI assistant. Ask me about pollution sources in a zone, AQI, health precautions, or how to reduce pollution.";

/** Groups chats under Today / Yesterday / Previous 7 days / Older (like ChatGPT). */
function groupByDate(conversations) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const groups = [];

  conversations.forEach((c) => {
    const d = new Date(c.updatedAt);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diff = Math.round((todayStart - dayStart) / 86400000);
    const label = diff <= 0 ? 'Today' : diff === 1 ? 'Yesterday' : diff <= 7 ? 'Previous 7 days' : 'Older';

    let group = groups.find((g) => g.label === label);
    if (!group) {
      group = { label, items: [] };
      groups.push(group);
    }
    group.items.push(c);
  });

  return groups;
}

export default function ChatbotPage() {
  const { token } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]); // [{ from: 'user' | 'bot', text }]
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const bottomRef = useRef(null);

  const activeTitle = conversations.find((c) => c.id === activeId)?.title;

  useEffect(() => {
    listConversations(token)
      .then(setConversations)
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const startNewChat = () => {
    if (sending) return;
    setActiveId(null);
    setMessages([]);
    setInput('');
  };

  const openConversation = async (id) => {
    if (sending || id === activeId) return;
    setActiveId(id);
    setLoadingChat(true);
    try {
      const convo = await getConversation(token, id);
      setMessages(convo.messages.map((m) => ({ from: m.role, text: m.text })));
    } catch {
      setMessages([{ from: 'bot', text: 'Could not load this chat. Please try again.' }]);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleDelete = async (id) => {
    if (sending) return;
    if (!window.confirm('Delete this chat? This cannot be undone.')) return;
    try {
      await deleteConversation(token, id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (id === activeId) startNewChat();
    } catch {
      window.alert('Could not delete the chat. Please try again.');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { from: 'user', text }]);
    setInput('');
    setSending(true);

    try {
      const res = await sendChatMessage(token, { conversationId: activeId, message: text });
      setMessages((prev) => [...prev, { from: 'bot', text: res.reply }]);
      setActiveId(res.conversationId);
      // Add a new chat to the sidebar, or move an existing one to the top.
      setConversations((prev) => [
        { id: res.conversationId, title: res.title, updatedAt: res.updatedAt },
        ...prev.filter((c) => c.id !== res.conversationId),
      ]);
    } catch (err) {
      setMessages((prev) => [...prev, { from: 'bot', text: err.message || 'Something went wrong. Please try again.' }]);
    } finally {
      setSending(false);
    }
  };

  const groups = groupByDate(conversations);

  return (
    <>
      <Headline eyebrow="Assistant" title="Pollution AI Assistant" subtitle="Ask about sources, AQI, or reduction tips" />

      <div className="chat-layout">
        {/* ---------- history sidebar ---------- */}
        <aside className="chat-sidebar">
          <button className="chat-new" onClick={startNewChat} disabled={sending}>
            + New chat
          </button>

          <div className="chat-history">
            {loadingList ? (
              <p className="sub" style={{ padding: 8 }}>Loading…</p>
            ) : groups.length === 0 ? (
              <p className="sub" style={{ padding: 8 }}>No chats yet. Ask something to get started.</p>
            ) : (
              groups.map((group) => (
                <div key={group.label}>
                  <div className="chat-group-label">{group.label}</div>
                  {group.items.map((c) => (
                    <div
                      key={c.id}
                      className={`chat-item${c.id === activeId ? ' active' : ''}${sending ? ' disabled' : ''}`}
                      onClick={() => openConversation(c.id)}
                    >
                      <span className="chat-item-title" title={c.title}>{c.title}</span>
                      <button
                        className="chat-item-del"
                        title="Delete chat"
                        aria-label={`Delete chat ${c.title}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(c.id);
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </aside>

        {/* ---------- conversation ---------- */}
        <section className="card chat-main">
          {activeTitle && <div className="chat-title">{activeTitle}</div>}

          <div className="chat-messages">
            {loadingChat ? (
              <p className="sub">Loading chat…</p>
            ) : (
              <>
                {messages.length === 0 && (
                  <div className="chat-row bot">
                    <div className="chat-bubble bot">{WELCOME}</div>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div className={`chat-row ${m.from}`} key={i}>
                    <div className={`chat-bubble ${m.from}`}>
                      {m.from === 'bot' ? <FormattedMessage text={m.text} /> : m.text}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="chat-row bot">
                    <div className="chat-bubble bot thinking">Thinking…</div>
                  </div>
                )}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          <form className="chat-form" onSubmit={handleSend}>
            <input
              className="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something…"
              maxLength={1000}
              disabled={loadingChat}
            />
            <button className="predict" type="submit" disabled={sending || loadingChat} style={{ width: 'auto', padding: '0 18px', marginTop: 0 }}>
              Send
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
