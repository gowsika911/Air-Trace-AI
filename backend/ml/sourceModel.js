const fs = require('fs');
const path = require('path');
const { RandomForestClassifier } = require('ml-random-forest');
const { CLASSES, toFeatures } = require('./features');

const MODEL_PATH = path.join(__dirname, 'model.json');

let forest = null;
let meta = null;

// Load the saved model once at startup. If it is missing or broken, the app keeps
// working: classifier.js falls back to its rule-based scoring.
try {
  const saved = JSON.parse(fs.readFileSync(MODEL_PATH, 'utf8'));
  forest = RandomForestClassifier.load(saved.forest);
  meta = saved.meta;
  console.log(`[model] Random Forest loaded (${meta.trainRows} training rows, ${meta.trainedOn.split(' (')[0]}).`);
} catch (err) {
  console.warn(`[model] No trained model loaded (${err.code === 'ENOENT' ? 'ml/model.json not found - run "npm run train"' : err.message}). Using rule-based scoring.`);
}

function isLoaded() {
  return forest !== null;
}

/**
 * Probability of each source for one reading, e.g.
 * { 'Traffic emissions': 0.82, 'Industrial activity': 0.1, ... }
 * Returns null if no model is loaded or the reading is not usable.
 */
function predictProbabilities(reading) {
  if (!forest) return null;

  const features = toFeatures(reading);
  if (!features.every(Number.isFinite)) return null;

  try {
    const result = {};
    CLASSES.forEach((name, label) => {
      result[name] = forest.predictProbability([features], label)[0];
    });
    return result;
  } catch (err) {
    console.warn(`[model] Prediction failed (${err.message}). Using rule-based scoring.`);
    return null;
  }
}

function getMeta() {
  return meta;
}

module.exports = { isLoaded, predictProbabilities, getMeta };
