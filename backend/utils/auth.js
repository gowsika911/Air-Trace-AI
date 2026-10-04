const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// IMPORTANT: set a real JWT_SECRET env var in production (Render dashboard).
// This fallback is only for local/dev convenience.
const JWT_SECRET = process.env.JWT_SECRET || 'airtrace-ai-dev-secret-change-in-production';
const TOKEN_EXPIRY = '7d';

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

function comparePassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

module.exports = { signToken, verifyToken, comparePassword };
