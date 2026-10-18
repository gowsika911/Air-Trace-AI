# Source classifier (Random Forest)

Predicts the dominant pollution source for a reading: **Traffic emissions, Industrial activity,
Construction dust, or Seasonal background**.

## Important: the training data is simulated
No public dataset of air-quality readings labelled with their pollution source exists, so
`simulate.js` generates sample readings from typical pollutant patterns (traffic: high NO2/CO,
industrial: high SO2, construction: PM10 much larger than PM2.5, seasonal: low and diffuse).
The classes overlap on purpose. **Accuracy measured on this data does not describe real-world
accuracy.** The model demonstrates the full ML pipeline: data -> training -> saved model -> prediction.

## Files
| File | Purpose |
|---|---|
| `features.js` | Model inputs and class names (shared by training and prediction) |
| `simulate.js` | Generates the simulated readings (seeded, no duplicate rows) |
| `train.js` | Trains the forest, evaluates it on unseen rows, saves the model and a report |
| `sourceModel.js` | Loads `model.json` at server start and returns class probabilities |
| `model.json` | The trained model (100 trees) - must be committed so the server can load it |
| `model-report.json` | Test accuracy, per-class scores, confusion matrix, input importance |

## Retrain
```bash
npm run train     # takes about 3 minutes; writes model.json and model-report.json
```

## Fallback
If `model.json` is missing or unreadable, `classifier.js` automatically uses its rule-based
scoring, so the app never stops working.

## Using real data later
Replace `generateDataset` in `train.js` with a loader for real readings and verified source labels
(rows shaped `{ reading: { pm25, pm10, no2, so2, co }, label }`), then run `npm run train`.
Nothing else in the app needs to change.
