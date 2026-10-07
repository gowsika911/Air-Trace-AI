const mongoose = require('mongoose');

/**
 * Connects to MongoDB using MONGODB_URI from the environment.
 * Fails fast with a clear message if the URI is missing or unreachable —
 * this app now depends on the database for all persistent data, so we
 * don't want to silently run in a broken state.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('FATAL: MONGODB_URI is not set. Add it to your .env file (local) or Render environment variables (production).');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log('MongoDB connected successfully.');
  } catch (err) {
    console.error('FATAL: Could not connect to MongoDB.');
    console.error(err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
