const express = require('express');
const mongoose = require('mongoose');

const MAX_MESSAGE_LENGTH = 1000;
const MAX_MESSAGES_PER_CHAT = 200;
const HISTORY_SENT_TO_MODEL = 10; // last 10 messages (5 exchanges) give the model context

function makeTitle(text) {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > 40 ? `${clean.slice(0, 40).trim()}...` : clean;
}

/**
 * Saved chat history (ChatGPT-style). Every route requires login and only
 * ever touches the logged-in user's own conversations.
 * Dependencies are injected so the routes are easy to test.
 */
function createChatRouter({ Conversation, loadZones, getChatbotReply, authenticate }) {
  const router = express.Router();
  router.use(authenticate);

  const handle = (fn) => async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      console.error('[chat] error:', err.message);
      res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
  };

  // List my conversations (newest first, without messages)
  router.get('/conversations', handle(async (req, res) => {
    const list = await Conversation.find({ user: req.user.id }, 'title updatedAt', { sort: { updatedAt: -1 } });
    res.json(list.map((c) => ({ id: c.id, title: c.title, updatedAt: c.updatedAt })));
  }));

  // Open one conversation with all its messages
  router.get('/conversations/:id', handle(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Chat not found.' });
    const convo = await Conversation.findOne({ _id: req.params.id, user: req.user.id });
    if (!convo) return res.status(404).json({ error: 'Chat not found.' });
    res.json({
      id: convo.id,
      title: convo.title,
      messages: convo.messages.map((m) => ({ role: m.role, text: m.text, createdAt: m.createdAt })),
    });
  }));

  // Delete one of my conversations
  router.delete('/conversations/:id', handle(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Chat not found.' });
    const result = await Conversation.deleteOne({ _id: req.params.id, user: req.user.id });
    if (!result.deletedCount) return res.status(404).json({ error: 'Chat not found.' });
    res.json({ ok: true });
  }));

  // Send a message. No conversationId = start a new chat.
  router.post('/message', handle(async (req, res) => {
    const { conversationId } = req.body;
    const text = typeof req.body.message === 'string' ? req.body.message.trim() : '';

    if (!text) return res.status(400).json({ error: 'message is required.' });
    if (text.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: `Message is too long (max ${MAX_MESSAGE_LENGTH} characters).` });
    }

    let convo;
    if (conversationId) {
      if (!mongoose.isValidObjectId(conversationId)) return res.status(404).json({ error: 'Chat not found.' });
      convo = await Conversation.findOne({ _id: conversationId, user: req.user.id });
      if (!convo) return res.status(404).json({ error: 'Chat not found.' });
      if (convo.messages.length >= MAX_MESSAGES_PER_CHAT) {
        return res.status(400).json({ error: 'This chat is full. Please start a new chat.' });
      }
    } else {
      convo = new Conversation({ user: req.user.id, title: makeTitle(text), messages: [] });
    }

    const history = convo.messages.slice(-HISTORY_SENT_TO_MODEL).map((m) => ({
      role: m.role === 'bot' ? 'assistant' : 'user',
      content: m.text,
    }));

    let zones = [];
    try {
      zones = await loadZones();
    } catch {
      zones = []; // still answer without live data
    }

    const reply = await getChatbotReply(text, zones, history);

    convo.messages.push({ role: 'user', text }, { role: 'bot', text: reply });
    await convo.save();

    res.json({ conversationId: convo.id, title: convo.title, reply, updatedAt: convo.updatedAt });
  }));

  return router;
}

module.exports = createChatRouter;
