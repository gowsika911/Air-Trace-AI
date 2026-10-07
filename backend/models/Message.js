const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  authority: { type: String, required: true },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  sentBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sentAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Message', messageSchema);
