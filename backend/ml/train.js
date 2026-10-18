/**
 * Trains the Random Forest source classifier on SIMULATED data and saves it.
 * Run:  npm run train
 * Output: ml/model.json (used by the server) and ml/model-report.json (metrics).
 */
const fs = require('fs');
const path = require('path');
const { RandomForestClassifier } = require('ml-random-forest');
const { FEATURES, CLASSES, toFeatures } = require('./features');
const { generateDataset, makeRng } = require('./simulate');

const TRAIN_PER_CLASS = 800;
const TEST_PER_CLASS = 200;
const SEED = 42;

const forestOptions = {
  seed: SEED,
  nEstimators: 100,
  maxFeatures: 0.7,
  replacement: true,
  useSampleBagging: true,
  treeOptions: { maxDepth: 10, minNumSamples: 5 },
};

// ---- 1. data: separate train and test sets, never sharing a row ----
const seen = new Set();
const train = generateDataset(TRAIN_PER_CLASS, 1001, seen);
const test = generateDataset(TEST_PER_CLASS, 2002, seen);
const duplicateRows = train.length + test.length - seen.size; // 0 when every row is unique

const toXY = (rows) => ({ X: rows.map((r) => toFeatures(r.reading)), y: rows.map((r) => r.label) });
const trainSet = toXY(train);
const testSet = toXY(test);

// ---- 2. train ----
console.log(`Training on ${train.length} simulated rows (${TRAIN_PER_CLASS} per class)...`);
const started = Date.now();
const forest = new RandomForestClassifier(forestOptions);
forest.train(trainSet.X, trainSet.y);
console.log(`Trained ${forestOptions.nEstimators} trees in ${((Date.now() - started) / 1000).toFixed(1)}s`);

// ---- 3. evaluate on rows the model has never seen ----
const accuracyOf = (X, y) => {
  const pred = forest.predict(X);
  return pred.filter((p, i) => p === y[i]).length / y.length;
};

const predicted = forest.predict(testSet.X);
const matrix = CLASSES.map(() => CLASSES.map(() => 0)); // rows = true class, columns = predicted class
predicted.forEach((p, i) => { matrix[testSet.y[i]][p] += 1; });

const perClass = CLASSES.map((name, k) => {
  const tp = matrix[k][k];
  const fp = matrix.reduce((sum, row, r) => sum + (r === k ? 0 : row[k]), 0);
  const fn = matrix[k].reduce((sum, v, c) => sum + (c === k ? 0 : v), 0);
  const precision = tp + fp ? tp / (tp + fp) : 0;
  const recall = tp + fn ? tp / (tp + fn) : 0;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  return { class: name, precision: +precision.toFixed(3), recall: +recall.toFixed(3), f1: +f1.toFixed(3) };
});

const testAccuracy = accuracyOf(testSet.X, testSet.y);
const trainAccuracy = accuracyOf(trainSet.X, trainSet.y);

// ---- 4. which inputs matter? (permutation importance: shuffle one input, see accuracy drop) ----
const rng = makeRng(7);
const importance = FEATURES.map((name, col) => {
  let drop = 0;
  const repeats = 5;
  for (let r = 0; r < repeats; r += 1) {
    const column = testSet.X.map((row) => row[col]);
    for (let i = column.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng.rand() * (i + 1));
      [column[i], column[j]] = [column[j], column[i]];
    }
    const shuffled = testSet.X.map((row, i) => row.map((v, c) => (c === col ? column[i] : v)));
    drop += testAccuracy - accuracyOf(shuffled, testSet.y);
  }
  return { feature: name, accuracyDrop: +(drop / repeats).toFixed(3) };
}).sort((a, b) => b.accuracyDrop - a.accuracyDrop);

// ---- 5. save ----
const meta = {
  model: 'Random Forest',
  library: 'ml-random-forest',
  trainedOn: 'SIMULATED data (demonstration of the ML pipeline, not real labelled readings)',
  classes: CLASSES,
  features: FEATURES,
  trainRows: train.length,
  testRows: test.length,
  seed: SEED,
  options: forestOptions,
};
fs.writeFileSync(path.join(__dirname, 'model.json'), JSON.stringify({ meta, forest: forest.toJSON() }));

const report = {
  note: 'All figures below are on SIMULATED data. They do not describe accuracy on real-world readings.',
  ...meta,
  duplicateRows,
  trainAccuracy: +trainAccuracy.toFixed(3),
  testAccuracy: +testAccuracy.toFixed(3),
  perClass,
  confusionMatrix: { rowsAreTrueClass: CLASSES, columnsArePredictedClass: CLASSES, matrix },
  featureImportance: importance,
};
fs.writeFileSync(path.join(__dirname, 'model-report.json'), JSON.stringify(report, null, 2));

console.log(`\nDuplicate rows across train+test: ${duplicateRows}`);
console.log(`Train accuracy: ${(trainAccuracy * 100).toFixed(1)}%   Test accuracy: ${(testAccuracy * 100).toFixed(1)}%  (simulated data)`);
console.log('\nPer class (test):');
perClass.forEach((c) => console.log(`  ${c.class.padEnd(20)} precision ${c.precision}  recall ${c.recall}  f1 ${c.f1}`));
console.log('\nConfusion matrix (rows = true, columns = predicted):');
console.log('  ' + CLASSES.map((c) => c.split(' ')[0].padStart(13)).join(''));
matrix.forEach((row, i) => console.log('  ' + row.map((v) => String(v).padStart(13)).join('') + '   ' + CLASSES[i]));
console.log('\nMost important inputs (accuracy lost when shuffled):');
importance.forEach((f) => console.log(`  ${f.feature.padEnd(18)} ${f.accuracyDrop}`));
const kb = (fs.statSync(path.join(__dirname, 'model.json')).size / 1024).toFixed(0);
console.log(`\nSaved ml/model.json (${kb} KB) and ml/model-report.json`);
