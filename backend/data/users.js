const bcrypt = require('bcryptjs');
const User = require('../models/User');

/**
 * Seeds default accounts if the users collection is empty.
 * Runs once, on server startup (see server.js).
 */
async function seedUsers() {
  const count = await User.countDocuments();
  if (count > 0) return;

  const seedAccounts = [
    { name: 'Admin', email: 'admin@airtrace.ai', password: 'Admin@123', role: 'admin' },
    { name: 'Admin', email: 'admin123@gmail.com', password: 'Admin@123', role: 'admin' },
    { name: 'Demo Citizen', email: 'user@airtrace.ai', password: 'User@123', role: 'user' },
  ];

  for (const { name, email, password, role } of seedAccounts) {
    await User.create({ name, email, passwordHash: bcrypt.hashSync(password, 10), role });
  }
  console.log('Seeded default user accounts.');
}

function findByEmail(email) {
  return User.findOne({ email: String(email).toLowerCase() });
}

function findById(id) {
  return User.findById(id);
}

async function createUser({ name, email, password, role = 'user' }) {
  const passwordHash = bcrypt.hashSync(password, 10);
  return User.create({ name, email, passwordHash, role });
}

function toPublic(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

module.exports = { seedUsers, findByEmail, findById, createUser, toPublic };
