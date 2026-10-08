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
- For any question about a specific zone, or about which zone or source is worst, answer ONLY from the live monitoring data provided below. Use its AQI, category, likely source, pollutant levels and suggested action. Never add roads, landmarks, industries, or numbers that are not in that data. Describe the likely source as the app's estimate.
- Match small spelling mistakes in zone names to the nearest zone.
- If the user asks about a place that is not one of the four zones, say you only monitor these four zones and offer to share their data.
- This app uses India's CPCB AQI categories: Good 0-50, Satisfactory 51-100, Moderate 101-200, Poor 201-300, Very Poor 301-400, Severe 401-500. Never use US EPA categories.
- For general questions (health precautions, reducing pollution, what PM2.5 means), give practical advice.
- Be concise: 2-4 sentences, plain text, no markdown headers or tables.`;

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
async function askGroq(message, contextText = '') {
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
async function askGemini(message, contextText = '') {
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
          contents: [{ role: 'user', parts: [{ text: message }] }],
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
    reply: "Hi! I'm the AirTrace AI assistant. Ask me about AQI, pollution sources, or how to reduce pollution.",
  },
  {
    keywords: ['traffic'],
    reply:
      'Traffic pollution mainly comes from vehicle exhaust (NO2, CO). You can help by carpooling, using public transport, maintaining your vehicle, and avoiding unnecessary idling.',
  },
  {
    keywords: ['construction', 'dust'],
    reply:
      'Construction dust raises PM10 levels. Sites should use water spraying, cover material piles, and use dust barriers. Avoid outdoor exercise near active construction.',
  },
  {
    keywords: ['industry', 'industrial', 'factory'],
    reply:
      'Industrial emissions are regulated by TNPCB. If you notice unusual smoke or odor from a facility, you can report it via the Authorities page.',
  },
  {
    keywords: ['burning', 'burn', 'fire'],
    reply:
      'Open burning of waste/leaves releases harmful particulates and gases. It is illegal in most urban areas — report it instead of tolerating it.',
  },
  {
    keywords: ['reduce', 'prevent', 'tips', 'help', 'improve'],
    reply:
      'A few ways to reduce pollution exposure and impact: use public transport, avoid outdoor activity during high-AQI hours, support dust control at construction sites, avoid open burning, and plant/support urban greenery.',
  },
  {
    keywords: ['aqi', 'air quality index'],
    reply:
      'AQI (Air Quality Index) summarizes how polluted the air currently is. Below 100 is generally safe, 101-200 is moderate (sensitive groups should be cautious), and above 300 is severe — avoid outdoor activity.',
  },
  {
    keywords: ['mask', 'protect', 'health'],
    reply:
      'On high-AQI days: wear an N95 mask outdoors, keep windows closed, use an air purifier indoors if possible, and avoid strenuous outdoor exercise.',
  },
  {
    keywords: ['pm2.5', 'pm25', 'pm10', 'particulate'],
    reply:
      'PM2.5 and PM10 are fine particulate matter that can enter your lungs and bloodstream. Main sources here are traffic, construction dust, and industrial activity.',
  },
  {
    keywords: ['contact', 'authority', 'authorities', 'report'],
    reply:
      'You can find contact details for TNPCB, the City Corporation, Traffic Police, and the Health Department on the Authorities page.',
  },
  {
    keywords: ['thank', 'thanks'],
    reply: "You're welcome! Stay safe and check the Dashboard for live zone-level pollution data.",
  },
];

const FALLBACK_REPLY =
  "I can help with questions about pollution sources, AQI, health precautions, or how to reduce pollution. Try asking something like 'how to reduce traffic pollution' or 'what does high PM2.5 mean'.";

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
  return `${zone.name}: AQI ${p.aqi} (${p.aqiStatus}); likely source: ${p.source} (${p.confidence}% confidence); PM2.5 ${c.pm25}, PM10 ${c.pm10}, NO2 ${c.no2}, SO2 ${c.so2}, CO ${c.co}; suggested action: ${p.action}`;
}

function zoneReply(zone) {
  const p = zone.prediction || {};
  const c = zone.pollutants || {};
  return `${zone.name} right now: AQI ${p.aqi} (${p.aqiStatus}). The likely main source is ${p.source} (${p.confidence}% confidence). PM2.5 is ${c.pm25} \u00b5g/m\u00b3, PM10 ${c.pm10} \u00b5g/m\u00b3, NO2 ${c.no2} \u00b5g/m\u00b3. Suggested action: ${p.action}`;
}

function getRuleBasedReply(message, zones = []) {
  const text = String(message || '').toLowerCase();

  // If the user names a monitored zone, answer from live zone data.
  const mentioned = findMentionedZones(message, zones);
  if (mentioned.length > 0) {
    return mentioned.map(zoneReply).join(' ');
  }

  for (const rule of RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      return rule.reply;
    }
  }

  return FALLBACK_REPLY;
}

/** Live data block for the LLMs: ranking, the zone the user asked about, then every zone. */
function buildContext(message, zones) {
  if (!zones.length) return '';

  const ranked = [...zones].sort((x, y) => (y.prediction?.aqi ?? 0) - (x.prediction?.aqi ?? 0));
  const lines = [
    `Zones ranked worst to best by AQI: ${ranked.map((z) => `${z.name} (${z.prediction?.aqi}, ${z.prediction?.aqiStatus})`).join(', ')}.`,
  ];

  const mentioned = findMentionedZones(message, zones);
  if (mentioned.length > 0) {
    lines.push(`The user is asking about: ${mentioned.map((z) => z.name).join(', ')}.`);
  }

  lines.push(...zones.map(zoneSummary));
  return lines.join('\n');
}

/** Tries Groq, then Gemini, then rule-based matching. */
async function getChatbotReply(message, zones = []) {
  if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
    console.warn('[chatbot] No GROQ_API_KEY or GEMINI_API_KEY set - using rule-based replies.');
  }

  const context = buildContext(message, zones);

  const groqReply = await askGroq(message, context);
  if (groqReply) return groqReply;

  const geminiReply = await askGemini(message, context);
  if (geminiReply) return geminiReply;

  return getRuleBasedReply(message, zones);
}

// Startup hint: shows which providers are configured (never prints the keys).
console.log(
  `[chatbot] Providers -> Groq: ${process.env.GROQ_API_KEY ? `configured (${process.env.GROQ_MODEL || 'model auto-detected on first use'})` : 'NOT set'} | Gemini: ${process.env.GEMINI_API_KEY ? `configured (${GEMINI_MODEL})` : 'NOT set'}`
);

module.exports = { getChatbotReply };
