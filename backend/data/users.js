const bcrypt = require('bcryptjs');

/**
 * In-memory user store.
 *
 * PROTOTYPE LIMITATION: this resets whenever the server restarts
 * (including every Render redeploy). Fine for a demo/prototype.
 * To make it persistent, swap this for a real database (e.g. MongoDB
 * Atlas free tier) — the rest of the auth code does not need to change,
 * only how users are read/written here.
 */
const users = [];
let nextId = 1;

function seed() {
  const seedUsers = [
    { name: 'Admin', email: 'admin@airtrace.ai', password: 'Admin@123', role: 'admin' },
    { name: 'Admin', email: 'admin123@gmail.com', password: 'Admin@123', role: 'admin' },
    { name: 'Demo Citizen', email: 'user@airtrace.ai', password: 'User@123', role: 'user' },
  ];

  seedUsers.forEach(({ name, email, password, role }) => {
    users.push({
      id: nextId++,
      name,
      email,
      passwordHash: bcrypt.hashSync(password, 10),
      role,
    });
  });
}

seed();

function findByEmail(email) {
  return users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
}

function createUser({ name, email, password, role = 'user' }) {
  const user = {
    id: nextId++,
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role,
  };
  users.push(user);
  return user;
}

function toPublic(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

module.exports = { users, findByEmail, createUser, toPublic };
