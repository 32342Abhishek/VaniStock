# VaaniStock

VaaniStock is a voice-enabled inventory management system for small businesses. It combines a FastAPI backend with a React + Vite frontend to support product tracking, stock movement, alerts, and voice-driven commands in multiple languages.

## Features

- Product management and stock updates
- Inventory summaries and low-stock alerts
- Transaction history and reporting
- Voice command parsing for English, Hindi, Hinglish, and Telugu-inspired inputs
- JWT-based authentication
- Responsive dashboard for desktop and mobile

## Tech Stack

- Backend: Python, FastAPI, MongoDB, PyMongo
- Frontend: React, Vite, Tailwind CSS
- Authentication: JWT + bcrypt

## Project Structure

- backend/ — FastAPI app and MongoDB integration
- frontend/ — React UI
- .env.example — sample environment settings

## Quick Start

### 1) Backend setup

Copy the example environment file and adjust values as needed:

```bash
cd backend
copy .env.example .env
```

Then start the API:

```bash
cd backend
py -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2) Frontend setup

```bash
cd frontend
npm install
npm run dev
```

### One-command Windows startup

From the project root, run:

```powershell
.\start-dev.ps1
```

The launcher checks for Python, npm, and frontend dependencies before opening the backend and frontend terminals. It checks local MongoDB only when `MONGODB_URI` points to localhost; Atlas connections are used directly from `backend/.env`.

### 3) Production build

```bash
cd frontend
npm run build
```

## Default local URLs

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API docs: http://localhost:8000/docs

The protected app includes Dashboard, Inventory, Voice Assistant, Transactions, Reports, Alerts, and Settings screens. Settings are persisted through the `/api/settings` endpoint.

## Notes

- MongoDB must be reachable through the `MONGODB_URI` in `backend/.env`. MongoDB Atlas is supported with a `mongodb+srv://` connection string.
- For production, replace the default JWT secret and review CORS settings.

## License

This project is intended for educational and business-use prototyping. Update licensing before production deployment.
