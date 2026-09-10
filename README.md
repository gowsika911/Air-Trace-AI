# AirTrace AI — React + Node Prototype

Pollution source attribution dashboard. Converted from the original static
HTML/CSS/JS prototype into a React frontend + Node/Express backend.

## Folder structure

```
airtrace-ai-react/
├── backend/
│   ├── data/
│   │   └── zones.js          # Monitoring zone definitions + pollutant readings
│   ├── classifier.js         # Rule-based source classifier (swap for real ML later)
│   ├── server.js             # Express API
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── Headline.jsx
│   │   │   ├── MapCard.jsx
│   │   │   ├── ResultCard.jsx
│   │   │   ├── PollutantForm.jsx
│   │   │   ├── TrendChart.jsx
│   │   │   ├── CausePanel.jsx
│   │   │   └── Toast.jsx
│   │   ├── App.jsx
│   │   ├── api.js            # fetch wrappers for backend calls
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Setup steps

You need Node.js 18+ installed.

**1. Install backend dependencies**
```bash
cd airtrace-ai-react/backend
npm install
```

**2. Install frontend dependencies**
```bash
cd airtrace-ai-react/frontend
npm install
```

## Execution steps

Run backend and frontend in two separate terminals.

**Terminal 1 — start the backend (port 5000)**
```bash
cd airtrace-ai-react/backend
npm start
```
You should see: `AirTrace AI backend running on http://localhost:5000`

**Terminal 2 — start the frontend (port 5173)**
```bash
cd airtrace-ai-react/frontend
npm run dev
```
Open the printed URL, normally `http://localhost:5173`.

The Vite dev server proxies any `/api/*` request to `http://localhost:5000`,
so the frontend and backend talk to each other with no extra config.

## API reference

| Method | Route              | Description                                      |
|--------|--------------------|--------------------------------------------------|
| GET    | `/api/health`      | Health check                                     |
| GET    | `/api/zones`       | All monitoring zones with computed prediction    |
| GET    | `/api/zones/:id`   | Single zone by id (e.g. `z1`)                    |
| POST   | `/api/predict`     | Body: `{ pm25, pm10, no2, co }` → prediction JSON|

Example `POST /api/predict` response:
```json
{
  "source": "Traffic emissions",
  "confidence": 57,
  "detail": "Rush-hour NO2 and CO pattern detected at this location.",
  "action": "Deploy traffic police at peak junctions and activate signal-timing plan for the next 2 hours.",
  "breakdown": [
    { "name": "Traffic emissions", "percentage": 57 },
    { "name": "Industrial activity", "percentage": 24 },
    { "name": "Construction dust", "percentage": 19 },
    { "name": "Seasonal background", "percentage": 0 }
  ]
}
```

## Upgrading to a real ML model

Right now `backend/classifier.js` uses hand-written rules (weighted scoring
on PM2.5, PM10, NO2, CO). To plug in a real trained model:

1. Train a Random Forest (or similar) in Python using a labeled dataset,
   export it (e.g. with `joblib` or ONNX).
2. Either:
   - Run a small Python microservice (Flask/FastAPI) that loads the model
     and exposes a `/predict` endpoint, then have `server.js` call it, or
   - Use a Node ML library (e.g. `onnxruntime-node`) to run the exported
     model directly inside `classifier.js`.
3. Keep the same return shape (`source`, `confidence`, `detail`, `action`,
   `breakdown`) so the frontend needs zero changes.
