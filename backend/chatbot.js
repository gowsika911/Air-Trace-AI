/**
 * Rule-based pollution assistant.
 *
 * This is intentionally simple keyword matching — a placeholder the same
 * way classifier.js is. To upgrade, replace getChatbotReply() with a call
 * to a real LLM API (pass the user's message + relevant zone/AQI context
 * as the prompt), keeping the same { reply } return shape.
 */

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

function getChatbotReply(message) {
  const text = String(message || '').toLowerCase();

  for (const rule of RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      return rule.reply;
    }
  }

  return FALLBACK_REPLY;
}

module.exports = { getChatbotReply };
