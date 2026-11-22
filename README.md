# AirTrace AI

**AI-assisted air pollution monitoring and source-attribution dashboard**

AirTrace AI is a full-stack web application for exploring air-quality readings across monitored zones, estimating likely pollution sources, viewing AQI and pollutant trends, and accessing pollution-awareness guidance. It combines a React dashboard with a Node.js/Express API, MongoDB persistence, a Random Forest prediction model with a rule-based fallback, and an optional AI chatbot.

> **Important:** Pollution-source labels and confidence values are model estimates, not confirmed source measurements. The current Random Forest model is trained on simulated data for demonstrating the ML workflow. Do not treat its output as regulatory evidence or a substitute for official monitoring.

## Table of Contents

- [Features](#features)
- [How Prediction Works](#how-prediction-works)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Training the Model](#training-the-model)
- [Chatbot Providers](#chatbot-providers)
- [Security and Deployment Notes](#security-and-deployment-notes)

## Features

### Air-quality dashboard
- View monitoring zones and their pollutant readings.
- Open an individual zone for its readings, weather context, and prediction.
- View estimated AQI and its Indian CPCB category.
- Explore a deterministic 12-hour PM2.5 trend generated from the zone's baseline reading.

### Pollution-source estimation
- Estimate likely sources such as traffic emissions, industrial activity, construction dust, and seasonal background.
- Use a saved Random Forest model when available.
- Fall back to deterministic rule-based scoring if the trained model is missing or cannot produce a prediction.
- Display a source breakdown, confidence estimate, explanatory detail, and suggested action.

### User accounts and administration
- Register and log in using password hashing and JWT authentication.
- Access the authenticated profile endpoint.
- Restrict administrative zone updates and authority messaging to authenticated administrators.
- Store application data through MongoDB and Mongoose.

### Pollution assistant
- Ask general questions about air quality, pollutants, health precautions, and pollution reduction.
- Ask about monitored zones and receive answers grounded in zone data supplied by the API.
- Use Groq first, Gemini second, and rule-based responses when no configured LLM provider is available.

### Authorities and communication
- Browse the authorities directory.
- Administrators can send and view messages through protected endpoints.

## How Prediction Works

1. The API receives pollutant readings such as PM2.5, PM10, NO2, CO, and (where available) SO2.
2. The classifier prepares model features and attempts to use the saved Random Forest model.
3. If the model is unavailable or prediction fails, the classifier uses rule-based source scores.
4. The result includes the leading estimated source, a relative confidence score, a source breakdown, an AQI estimate, and a generated trend.

The AQI estimate in the current classifier is calculated from PM2.5 using configured Indian CPCB breakpoint bands. It is an application estimate based on the supplied reading, not a certified station AQI calculation from a complete set of pollutant sub-indices.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite, React Router, Leaflet |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Authentication | JSON Web Token (JWT), bcryptjs |
| Prediction | Random Forest via ml-random-forest, rule-based fallback |
| Chatbot | Groq API, Google Gemini API, keyword/rule-based fallback |
| Development | npm, nodemon |

## Project Architecture

~~~text
Air-Trace-AI/
├── backend/
│   ├── data/                 # Monitoring zones, users, authorities, messages
│   ├── middleware/           # Authentication and admin access checks
│   ├── ml/                   # Model features, training code, saved model
│   ├── models/               # MongoDB/Mongoose models
│   ├── routes/               # Chat-related routes
│   ├── utils/                # Authentication and zone helpers
│   ├── classifier.js         # Source estimation and AQI calculation
│   ├── chatbot.js            # LLM provider selection and fallback replies
│   ├── db.js                 # MongoDB connection
│   ├── server.js             # Express API and application startup
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
~~~

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm
- A MongoDB database (local or MongoDB Atlas)
- Optional: Groq or Gemini API key for AI chatbot responses

### 1. Clone the repository

~~~bash
git clone https://github.com/gowsika911/Air-Trace-AI.git
cd Air-Trace-AI
~~~

### 2. Configure the backend

~~~bash
cd backend
npm install
~~~

Create a `.env` file inside the `backend` directory and configure the required MongoDB connection and a strong JWT secret. Add optional chatbot provider keys if you want live LLM responses.

Start the backend:

~~~bash
npm run dev
~~~

Or use the production start command:

~~~bash
npm start
~~~

The API listens on port `5000` by default. On startup, the server connects to MongoDB and seeds the configured user and zone data.

### 3. Configure and run the frontend

Open a second terminal:

~~~bash
cd frontend
npm install
npm run dev
~~~

Open the local URL printed by Vite, normally [http://localhost:5173](http://localhost:5173).

The Vite development server proxies `/api` requests to `http://localhost:5000`.

## Environment Variables

Configure these values in `backend/.env`. Never commit real credentials.

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string; required |
| `JWT_SECRET` | Secret used to sign authentication tokens; set a strong unique value |
| `PORT` | Backend port; defaults to `5000` |
| `FRONTEND_URL` | Comma-separated allowed frontend origins; if omitted, current code allows all origins |
| `GROQ_API_KEY` | Optional Groq key for chatbot responses |
| `GROQ_MODEL` | Optional Groq model override |
| `GEMINI_API_KEY` | Optional Gemini key; used if Groq does not return a response |
| `GEMINI_MODEL` | Optional Gemini model override |

For deployment, add these values in the hosting provider's environment-variable settings rather than placing secrets in source code. The frontend's Vite proxy is for local development; configure the production frontend API origin according to the deployment setup.

## API Overview

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Backend health check |
| GET | `/api/zones` | List monitoring zones with computed context and predictions |
| GET | `/api/zones/:id` | Retrieve one zone |
| POST | `/api/predict` | Estimate source and AQI from pollutant values |
| POST | `/api/chatbot` | Ask the pollution assistant |
| GET | `/api/authorities` | List authorities |
| POST | `/api/auth/register` | Register a user |
| POST | `/api/auth/login` | Log in and receive a JWT |
| GET | `/api/auth/me` | Get the authenticated user's profile |
| PUT | `/api/admin/zones/:id` | Update zone fields (admin only) |
| POST | `/api/admin/messages` | Send an authority message (admin only) |
| GET | `/api/admin/messages` | List authority messages (admin only) |

The backend also mounts a chat router under `/api/chat`. Refer to its route implementation for supported operations.

### Example prediction request

~~~json
{
  "pm25": 42,
  "pm10": 68,
  "no2": 24,
  "co": 0.7,
  "so2": 8
}
~~~

The prediction response includes fields such as `source`, `confidence`, `detail`, `action`, `breakdown`, `aqi`, `aqiStatus`, `trend`, and `method`.

## Training the Model

The backend includes a model-training npm script:

~~~bash
cd backend
npm run train
~~~

The classifier attempts to load the saved model from `backend/ml/model.json`. If the model file is absent or invalid, the application continues with its rule-based fallback.

The current model is intended as a prototype/demo of the machine-learning pipeline. Because its training data is simulated, its confidence values should not be interpreted as real-world validated accuracy. A production system would require representative, independently labelled monitoring data, validation across locations and seasons, and documented model-performance evaluation.

## Chatbot Providers

The chatbot attempts providers in this order:

1. **Groq**, when `GROQ_API_KEY` is configured.
2. **Google Gemini**, when `GEMINI_API_KEY` is configured and Groq does not provide a response.
3. **Rule-based fallback**, which works without an external AI key.

The assistant uses monitoring-zone data supplied by the backend when answering zone-specific questions. External LLM providers may process submitted prompts, so avoid sending personal or sensitive information.

## Security and Deployment Notes

- Set a strong, unique `JWT_SECRET` in every deployed environment. The development fallback in the source code must never be relied on for production.
- Set `FRONTEND_URL` to the exact trusted frontend origin(s); the current backend allows all origins when this variable is absent.
- Keep `MONGODB_URI`, `GROQ_API_KEY`, and `GEMINI_API_KEY` private. Rotate any credential that has been committed or exposed.
- Use HTTPS, secure database credentials, least-privilege database access, and regular backups.
- Review authentication, authorisation, input validation, rate limiting, and admin account provisioning before public deployment.
- Protect user account data and chat history with appropriate privacy controls.
- Clearly label sample or simulated monitoring data in demos and presentations.
- Do not present estimated pollution sources or generated recommendations as official environmental measurements or regulatory advice.

---

Developed by **Gowsika E.**
