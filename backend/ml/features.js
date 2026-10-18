// Single source of truth for the model's inputs and outputs.
// Used by BOTH training (train.js) and prediction (sourceModel.js) so they can never drift apart.

const FEATURES = ['pm25', 'pm10', 'no2', 'so2', 'co', 'pm10_pm25_ratio'];

// Order matters: the position in this list is the numeric label the model learns.
const CLASSES = ['Traffic emissions', 'Industrial activity', 'Construction dust', 'Seasonal background'];

function toFeatures({ pm25, pm10, no2, so2 = 0, co }) {
  const ratio = pm25 > 0 ? pm10 / pm25 : 0;
  return [pm25, pm10, no2, so2, co, ratio];
}

module.exports = { FEATURES, CLASSES, toFeatures };
