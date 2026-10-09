/**
 * Pollution assistant.
 *
 * Provider order (first one that works wins):
 *   1. Groq   (if GROQ_API_KEY is set)    - OpenAI-compatible, free tier
 *   2. Gemini (if GEMINI_API_KEY is set)  - Google AI Studio, free tier
 *   3. Rule-based keyword matching        - always available, no key needed
 *
 * Live zone data (AQI, source, pollutant levels) is passed to the LLMs as
 * context, and used directly by the rule-based fallback for zone questions.
 * Failures are logged to the server console (never the API keys).
 */

// Groq retires/changes models often. If GROQ_MODEL is not set, the app asks Groq
// which models this API key can use and picks the best match from this list.
const GROQ_PREFERRED = ['openai/gpt-oss-20b', 'openai/gpt-oss-120b', 'llama-3.1-8b-instant', 'llama-3.3-70b-versatile'];
let groqModel = process.env.GROQ_MODEL || null;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const REQUEST_TIMEOUT_MS = 8000;

const SYSTEM_PROMPT = `You are the AirTrace AI assistant for a pollution-monitoring dashboard covering four zones of Coimbatore, India: Gandhipuram, Saravanampatti, Singanallur and RS Puram.

Rules:
- For any question about a specific zone, or about which zone or source is worst, answer ONLY from the live monitoring data provided below. Use its AQI, category, likely source, pollutant levels and suggested action. Never add roads, landmarks, industries, or numbers that are not in that data. The pollution source is the app's estimate: state it directly and call it an estimate. Never say source information is missing when it appears in the data.
- Match small spelling mistakes in zone names to the nearest zone.
- If the user asks about a place that is not one of the four zones, say you only monitor these four zones and offer to share their data.
- This app uses India's CPCB AQI categories: Good 0-50, Satisfactory 51-100, Moderate 101-200, Poor 201-300, Very Poor 301-400, Severe 401-500. Never use US EPA categories.
- For general questions (health precautions, reducing pollution, what PM2.5 means), give practical advice.
- Format every answer as: one short intro line, then 3-5 bullet points (each on its own line, starting with "- ", each one short), and optionally a last line starting with "Tip:". Use **bold** only for key labels (zone name, AQI, source). No markdown headers, no tables, no long paragraphs.
- For a question about a specific zone, use these bullets: **AQI** (value and category), **Estimated main source**, **Key pollutants**, **What to do**.`;

function buildSystemPrompt(contextText) {
  if (!contextText) return SYSTEM_PROMPT;
  return `${SYSTEM_PROMPT}\n\nLIVE MONITORING DATA:\n${contextText}`;
}

/** fetch with a timeout; always clears its timer. */
async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Asks Groq which models this key can use; returns the best chat model id or null. */
async function discoverGroqModel(apiKey) {
  try {
    const res = await fetchWithTimeout('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      console.warn(`[chatbot] Could not list Groq models (HTTP ${res.status}).`);
      return null;
    }
    const data = await res.json();
    const ids = (data.data || [])
      .map((m) => m.id)
      .filter((id) => !/whisper|guard|tts|embed|orpheus|transcri/i.test(id));
    return GROQ_PREFERRED.find((id) => ids.includes(id)) || ids[0] || null;
  } catch (err) {
    console.warn(`[chatbot] Could not list Groq models: ${err.name} - ${err.message}`);
    return null;
  }
}

/** Groq (OpenAI-compatible chat completions). Returns text or null. */
async function askGroq(message, contextText = '', history = []) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  if (!groqModel) {
    groqModel = await discoverGroqModel(apiKey);
    if (!groqModel) return null;
    console.log(`[chatbot] Using Groq model: ${groqModel}`);
  }

  const body = {
    model: groqModel,
    messages: [
      { role: 'system', content: buildSystemPrompt(contextText) },
      ...history,
      { role: 'user', content: message },
    ],
    temperature: 0.4,
    // Reasoning models (gpt-oss) count thinking tokens toward this limit.
    max_tokens: 1024,
  };
  if (/gpt-oss/i.test(groqModel)) body.reasoning_effort = 'low';

  try {
    const res = await fetchWithTimeout('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.warn(`[chatbot] Groq returned HTTP ${res.status} (model: ${groqModel}): ${errBody.slice(0, 300)}`);
      // Model gone/no access: forget it so the next request re-detects (unless pinned via env).
      if (res.status === 404 && !process.env.GROQ_MODEL) groqModel = null;
      return null;
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) {
      console.warn(`[chatbot] Groq returned no text (finish_reason: ${data?.choices?.[0]?.finish_reason || 'unknown'}).`);
      return null;
    }
    return text;
  } catch (err) {
    console.warn(`[chatbot] Groq request failed: ${err.name} - ${err.message}`);
    return null;
  }
}

/** Google Gemini (generateContent). Returns text or null. */
/** Maps {role:'user'|'assistant', content} history to Gemini's format (must start with a user turn). */
function toGeminiHistory(history) {
  const mapped = history.map((h) => ({
    role: h.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: h.content }],
  }));
  while (mapped.length > 0 && mapped[0].role === 'model') mapped.shift();
  return mapped;
}

async function askGemini(message, contextText = '', history = []) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: buildSystemPrompt(contextText) }] },
          contents: [...toGeminiHistory(history), { role: 'user', parts: [{ text: message }] }],
          // 2.5 models count internal "thinking" tokens toward this limit.
          generationConfig: { maxOutputTokens: 1024, temperature: 0.4 },
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.warn(`[chatbot] Gemini returned HTTP ${res.status} (model: ${GEMINI_MODEL}): ${errBody.slice(0, 300)}`);
      return null;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('').trim();
    if (!text) {
      console.warn(`[chatbot] Gemini gave no text. finishReason: ${data?.candidates?.[0]?.finishReason || 'unknown'}`);
      return null;
    }
    return text;
  } catch (err) {
    console.warn(`[chatbot] Gemini request failed: ${err.name} - ${err.message}`);
    return null;
  }
}

const RULES = [
  {
    keywords: ['hi', 'hello', 'hey'],
    reply:
      "Hi! I'm the AirTrace AI assistant. You can ask me about:\n- **Zone data** - e.g. \"pollution source in Gandhipuram\"\n- **AQI** and what it means\n- **Health precautions** on polluted days\n- **How to reduce pollution**",
  },
  {
    keywords: ['traffic'],
    reply:
      'Traffic pollution mainly comes from vehicle exhaust (NO2, CO). What helps:\n- Use public transport or carpool\n- Keep your vehicle serviced\n- Avoid idling at signals\n- Choose cycling or walking for short trips',
  },
  {
    keywords: ['construction', 'dust'],
    reply:
      'Construction dust raises PM10 levels. What helps:\n- Sites should spray water to settle dust\n- Cover sand and debris piles\n- Use dust barriers around the site\n- Avoid outdoor exercise near active construction',
  },
  {
    keywords: ['industry', 'industrial', 'factory'],
    reply:
      'Industrial emissions are regulated by TNPCB. What you can do:\n- Report unusual smoke or odor from a facility\n- Use the **Authorities** page for contact details\n- Industries should run regular stack emission checks',
  },
  {
    keywords: ['burning', 'burn', 'fire'],
    reply:
      'Open burning of waste or leaves releases harmful particles and gases. What to do:\n- Never burn leaves, plastic, or household waste\n- Use municipal waste collection instead\n- Report open burning to the local authorities',
  },
  {
    keywords: ['reduce', 'prevent', 'tips', 'help', 'improve'],
    reply:
      'Ways to reduce pollution and your exposure:\n- Use public transport instead of private vehicles\n- Avoid outdoor activity during high-AQI hours\n- Support dust control at construction sites\n- Avoid open burning\n- Plant and protect urban greenery',
  },
  {
    keywords: ['aqi', 'air quality index'],
    reply:
      'AQI (Air Quality Index) shows how polluted the air is. India (CPCB) categories:\n- **0-50** Good\n- **51-100** Satisfactory\n- **101-200** Moderate\n- **201-300** Poor\n- **301-400** Very Poor\n- **401-500** Severe',
  },
  {
    keywords: ['mask', 'protect', 'health'],
    reply:
      'On high-AQI days:\n- Wear an N95 mask outdoors\n- Keep windows closed\n- Use an air purifier indoors if possible\n- Avoid strenuous outdoor exercise\n- Keep children and elderly people indoors',
  },
  {
    keywords: ['pm2.5', 'pm25', 'pm10', 'particulate'],
    reply:
      'PM2.5 and PM10 are fine particles that can enter your lungs and bloodstream.\n- **PM2.5** - very fine particles (vehicle and industrial smoke)\n- **PM10** - coarser particles (road and construction dust)\n- Main local sources: traffic, construction dust, industrial activity',
  },
  {
    keywords: ['contact', 'authority', 'authorities', 'report'],
    reply:
      'Contact details are on the **Authorities** page:\n- TNPCB (pollution control)\n- City Corporation\n- Traffic Police\n- District Health Department',
  },
  {
    keywords: ['thank', 'thanks'],
    reply: "You're welcome! Stay safe, and check the **Dashboard** for live zone-level pollution data.",
  },
];

const FALLBACK_REPLY =
  "I can help with:\n- **Zone data** - e.g. \"pollution source in Singanallur\"\n- **AQI** and what it means\n- **Health precautions** on polluted days\n- **How to reduce pollution** - e.g. \"how to reduce traffic pollution\"";

/** Lowercase, strip punctuation, collapse spaces. */
function normalize(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Edit distance between two strings (for typo-tolerant zone matching). */
function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j += 1) dp[0][j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return dp[a.length][b.length];
}

/** Zones mentioned in the message - exact, spacing-insensitive, or with small typos. */
function findMentionedZones(message, zones) {
  const text = normalize(message);
  const squashed = text.replace(/ /g, '');
  const words = text.split(' ').filter(Boolean);

  return zones.filter((zone) => {
    const name = normalize(zone.name);
    const nameSquashed = name.replace(/ /g, '');
    if (text.includes(name) || squashed.includes(nameSquashed)) return true;

    const maxDist = nameSquashed.length >= 8 ? 2 : 1;
    const nameWordCount = name.split(' ').length;
    for (let i = 0; i + nameWordCount <= words.length; i += 1) {
      const candidate = words.slice(i, i + nameWordCount).join('');
      if (
        Math.abs(candidate.length - nameSquashed.length) <= maxDist &&
        levenshtein(candidate, nameSquashed) <= maxDist
      ) {
        return true;
      }
    }
    return false;
  });
}

/** One-line live summary of a zone (zone = enriched object from the API). */
function zoneSummary(zone) {
  const p = zone.prediction || {};
  const c = zone.pollutants || {};
  return `${zone.name}: AQI ${p.aqi} (${p.aqiStatus}); estimated main pollution source: ${p.source} (${p.confidence}% confidence); PM2.5 ${c.pm25}, PM10 ${c.pm10}, NO2 ${c.no2}, SO2 ${c.so2}, CO ${c.co}; suggested action: ${p.action}`;
}

function zoneReply(zone) {
  const p = zone.prediction || {};
  const c = zone.pollutants || {};
  return [
    `**${zone.name}** right now:`,
    `- **AQI:** ${p.aqi} (${p.aqiStatus})`,
    `- **Estimated main source:** ${p.source} (${p.confidence}% confidence)`,
    `- **Key pollutants:** PM2.5 ${c.pm25}, PM10 ${c.pm10}, NO2 ${c.no2} \u00b5g/m\u00b3`,
    `- **What to do:** ${p.action}`,
  ].join('\n');
}

/** Whole-word keyword test (so "hi" does not match inside "which"). Allows a plural "s". */
function hasKeyword(text, keyword) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}s?\\b`).test(text);
}

function getRuleBasedReply(message, zones = []) {
  const text = String(message || '').toLowerCase();

  // If the user names a monitored zone, answer from live zone data.
  const mentioned = findMentionedZones(message, zones);
  if (mentioned.length > 0) {
    return mentioned.map(zoneReply).join('\n\n');
  }

  for (const rule of RULES) {
    if (rule.keywords.some((kw) => hasKeyword(text, kw))) {
      return rule.reply;
    }
  }

  return FALLBACK_REPLY;
}

/** Readable fact sheet for one zone, attached directly to the user's question. */
function zoneFacts(zone) {
  const p = zone.prediction || {};
  const c = zone.pollutants || {};
  return [
    `${zone.name}`,
    `- AQI: ${p.aqi} (${p.aqiStatus})`,
    `- Estimated main pollution source: ${p.source} (${p.confidence}% confidence)`,
    `- PM2.5: ${c.pm25}, PM10: ${c.pm10}, NO2: ${c.no2}, SO2: ${c.so2}, CO: ${c.co}`,
    `- Suggested action: ${p.action}`,
  ].join('\n');
}

/** Live data block for the LLMs: ranking, the zone the user asked about, then every zone. */
function buildContext(zones, mentioned = []) {
  if (!zones.length) return '';

  const ranked = [...zones].sort((x, y) => (y.prediction?.aqi ?? 0) - (x.prediction?.aqi ?? 0));
  const lines = [
    `Zones ranked worst to best by AQI: ${ranked.map((z) => `${z.name} (${z.prediction?.aqi}, ${z.prediction?.aqiStatus})`).join(', ')}.`,
  ];

  if (mentioned.length > 0) {
    lines.push(`The user is asking about: ${mentioned.map((z) => z.name).join(', ')}.`);
  }

  lines.push(...zones.map(zoneSummary));
  return lines.join('\n');
}

/** For follow-ups like "what should I do?", find the zone from the last few user messages. */
function findZonesFromHistory(history, zones) {
  const recentUserMessages = history.filter((h) => h.role === 'user').slice(-3).reverse();
  for (const h of recentUserMessages) {
    const found = findMentionedZones(h.content, zones);
    if (found.length > 0) return found;
  }
  return [];
}

/**
 * Tries Groq, then Gemini, then rule-based matching.
 * history = earlier turns of this chat: [{ role: 'user' | 'assistant', content }]
 */
async function getChatbotReply(message, zones = [], history = []) {
  if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
    console.warn('[chatbot] No GROQ_API_KEY or GEMINI_API_KEY set - using rule-based replies.');
  }

  const mentioned = findMentionedZones(message, zones);
  const carriedOver = mentioned.length === 0 ? findZonesFromHistory(history, zones) : [];
  const context = buildContext(zones, mentioned);

  // Small models follow facts placed next to the question better than facts buried in the system prompt.
  let llmMessage = message;
  if (mentioned.length > 0) {
    llmMessage = `${message}\n\nFacts from the live monitoring data (answer using these):\n${mentioned.map(zoneFacts).join('\n\n')}`;
  } else if (carriedOver.length > 0) {
    llmMessage = `${message}\n\nEarlier in this chat the user asked about ${carriedOver.map((z) => z.name).join(', ')}. Use these facts only if the new question is about that zone:\n${carriedOver.map(zoneFacts).join('\n\n')}`;
  }

  const groqReply = await askGroq(llmMessage, context, history);
  if (groqReply) return groqReply;

  const geminiReply = await askGemini(llmMessage, context, history);
  if (geminiReply) return geminiReply;

  return getRuleBasedReply(message, zones);
}

// Startup hint: shows which providers are configured (never prints the keys).
console.log(
  `[chatbot] Providers -> Groq: ${process.env.GROQ_API_KEY ? `configured (${process.env.GROQ_MODEL || 'model auto-detected on first use'})` : 'NOT set'} | Gemini: ${process.env.GEMINI_API_KEY ? `configured (${GEMINI_MODEL})` : 'NOT set'}`
);

module.exports = { getChatbotReply };
