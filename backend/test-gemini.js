require('dotenv').config();

const key = process.env.GEMINI_API_KEY;
console.log('Key loaded:', key ? 'YES' : 'NO');

fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${key}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contents: [{ parts: [{ text: 'Say hello in one short sentence' }] }] })
})
  .then(r => r.json())
  .then(d => console.log(JSON.stringify(d, null, 2)))
  .catch(console.error);