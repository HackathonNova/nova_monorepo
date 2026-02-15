# Implementation Guide: Industrial AI Reactor Monitor

## Requirements

### Frontend Requirements (React + Vite, Tailwind CSS)
1. **Futuristic UI**: Dark-themed UI with glassmorphism, soft glow effects, and gradient backgrounds inspired by the Dora design reference.
2. **Landing Page**: Hero section with headline "Industrial AI Reactor Monitor", subheading "Real-time Anomaly Detection & Digital Twin", and "Enter Dashboard" CTA.
3. **Login Page**: Mock JWT flow (admin/admin), store token in localStorage, redirect to dashboard.
4. **Main Dashboard**:
    - Sticky top nav (user email, logout).
    - Left panel: 3D reactor digital twin using `@google/model-viewer`. Rotates slowly.
    - Right panel: Tabs ("Overview", "Chat", "Alerts").
    - Overlay: When anomaly=true, reactor core glows pulsing red.
5. **Sensors Dashboard**:
    - Grid of animated sensor cards (temp, pressure, pH, flow, vibration).
    - Sparklines and color-coded status.
    - Updates every second via WebSocket.
6. **State Management (Zustand)**:
    - `auth`: token, login/logout.
    - `sensor`: latest readings.
    - `alert`: anomalies list.
7. **WebSocket Client**:
    - Connect to `ws://localhost:8000/ws`.
    - Auto-reconnect with backoff.
    - Dispatch "sensor" and "anomaly" events to store.

### Backend Requirements (FastAPI, Python 3.11)
1. **Data**: In-memory dicts for `sensors`, `anomalies`, `clients`. Centralized `twin_state`.
2. **Simulation**:
    - Runs every 1s.
    - Random walk generation for sensors.
    - 5% anomaly chance (spike temp/pressure).
    - Updates `sensors` and broadcasts.
3. **Anomaly Detection**:
    - Rolling window (50 readings).
    - `IsolationForest` (n=100, cont=0.05) runs every 10s.
    - Warmup period before prediction.
    - If score < -0.2, publish anomaly and update `twin_state`.
4. **API**:
    - WebSocket `/ws`: Push incremental updates and events.
    - POST `/chat`: Rule-based engine responding with context from `twin_state`.

## UI Cleanup Audit

### Removed Non-Functional Buttons
- Dashboard sidebar settings icon button (no handler)
- Landing hero documentation button (no handler)
- Landing header navigation links (anchor placeholders)

### Removed Decorative UI Elements
- Landing page ticker bar and status items
- Landing page scanline overlay and grid background
- Landing hero floating status callouts

### Removed Orphaned Styles
- grid-bg
- grid-lines
- scanline-overlay
- crt-overlay
- ticker keyframes

## Data Contracts

### WebSocket Message Schema
```json
{
  "type": "sensor_update", // or "anomaly"
  "payload": [
    {
      "id": "temp",
      "value": 365.2,
      "status": "normal"
    }
  ],
  "twin_state": {
    "core": "normal" // or "critical"
  }
}
```

## Development Timeline (8 Hours)

| Hour | Focus | Tasks |
|------|-------|-------|
| 1 | Setup | Repo init, Backend scaffold (FastAPI), Directory structure |
| 2 | Backend | Sensor simulation, Data models, In-memory store |
| 3 | AI Logic | IsolationForest integration, Warmup logic, Anomaly detection |
| 4 | API | WebSocket broadcasting loop, Chat endpoint with context |
| 5 | Frontend | Vite init, Tailwind setup, Theme/Layout implementation |
| 6 | State | WebSocket client, Zustand store sync, Component connections |
| 7 | Visuals | 3D Model viewer, Anomaly red glow overlay, Sensor cards |
| 8 | Polish | Chatbot UI, Manual testing, Bug fixing, Documentation |

## Startup Instructions

### Backend
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev -- --port 5173
```
