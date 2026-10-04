// In-memory log of messages sent from Admin to authorities.
// PROTOTYPE LIMITATION: resets on server restart. No real email/SMS is
// sent — this simulates the action and stores a record of it. To make
// this real, plug in a service like Nodemailer + SMTP credentials here.
const messages = [];
let nextId = 1;

function addMessage({ authority, subject, body, sentBy }) {
  const message = {
    id: nextId++,
    authority,
    subject,
    body,
    sentBy,
    sentAt: new Date().toISOString(),
  };
  messages.push(message);
  return message;
}

function listMessages() {
  return [...messages].reverse(); // newest first
}

module.exports = { addMessage, listMessages };
