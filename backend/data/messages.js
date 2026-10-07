const Message = require('../models/Message');

function addMessage({ authority, subject, body, sentBy }) {
  return Message.create({ authority, subject, body, sentBy });
}

function listMessages() {
  return Message.find().sort({ sentAt: -1 });
}

module.exports = { addMessage, listMessages };
