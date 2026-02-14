import asyncio
import json
import os
import random
from pathlib import Path
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
from sklearn.ensemble import IsolationForest
from rag.config import Settings, get_settings
from rag.logging import configure_logging, get_logger
from rag.generation import HFInferenceClient

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models ---

class SensorData(BaseModel):
    id: str
    value: float
    unit: str
    status: str  # normal, warning, critical

class AnomalyEvent(BaseModel):
    zone: str
    severity: float
    timestamp: float

class ChatRequest(BaseModel):
    question: str

class ChatResponse(BaseModel):
    answer: str

class RAGChatResponse(BaseModel):
    answer: str
    contexts: List[Dict[str, str]]

# --- Global State ---

class GlobalState:
    sensors: Dict[str, SensorData] = {}
    anomalies: List[AnomalyEvent] = []
    twin_state: Dict[str, str] = {"core": "normal"}
    clients: List[WebSocket] = []
    history: Dict[str, List[float]] = {
        "temperature": [],
        "pressure": [],
        "ph": [],
        "flowRate": [],
        "vibration": []
    }
    model: Optional[IsolationForest] = None
    is_model_fitted: bool = False
    data_count: int = 0
    settings: Optional[Settings] = None
    hf_client: Optional[HFInferenceClient] = None

state = GlobalState()

# --- Simulation & AI ---

def generate_sensor_value(current: float, min_val: float, max_val: float, noise: float = 0.5) -> float:
    change = random.uniform(-noise, noise)
    new_val = current + change
    return max(min_val, min(new_val, max_val))

async def simulate_sensors():
    # Initial values
    temps = 365.0
    pressure = 2.2
    ph = 7.0
    flow = 135.0
    vibration = 2.0

    while True:
        await asyncio.sleep(1)
        
        # Random Walk
        temps = generate_sensor_value(temps, 350, 380, 0.5)
        pressure = generate_sensor_value(pressure, 2.0, 2.4, 0.05)
        ph = generate_sensor_value(ph, 6.8, 7.2, 0.05)
        flow = generate_sensor_value(flow, 120, 150, 2.0)
        vibration = generate_sensor_value(vibration, 0, 10, 0.5)

        # Anomaly Injection (5% chance)
        is_anomaly = False
        if random.random() < 0.05:
            if random.random() < 0.5:
                temps += 30  # Spike temp
            else:
                pressure += 0.3 # Spike pressure
            is_anomaly = True

        # Update State
        update_sensor("temperature", temps, "°C", 375, 355)
        update_sensor("pressure", pressure, "MPa", 2.35, 2.05)
        update_sensor("ph", ph, "pH", 7.15, 6.85)
        update_sensor("flowRate", flow, "m³/h", 145, 125)
        update_sensor("vibration", vibration, "mm/s", 8, 0)

        # Store history for AI
        state.history["temperature"].append(temps)
        state.history["pressure"].append(pressure)
        state.history["ph"].append(ph)
        state.history["flowRate"].append(flow)
        state.history["vibration"].append(vibration)
        
        # Keep window size 50
        for key in state.history:
            if len(state.history[key]) > 50:
                state.history[key].pop(0)

        state.data_count += 1
        
        # Broadcast
        await broadcast_state()

def update_sensor(id: str, value: float, unit: str, high_thresh: float, low_thresh: float):
    status = "normal"
    if value > high_thresh or value < low_thresh:
        status = "warning"
        if value > high_thresh * 1.05 or value < low_thresh * 0.95:
             status = "critical"
    
    state.sensors[id] = SensorData(id=id, value=round(value, 2), unit=unit, status=status)

async def ai_loop():
    # Setup model
    state.model = IsolationForest(n_estimators=100, contamination=0.05)
    
    while True:
        await asyncio.sleep(10)
        
        # Warmup check
        if state.data_count < 50:
            # print(f"AI Warming up... {state.data_count}/50 samples")
            continue

        # Prepare data for all sensors (simple flattening or feature extraction)
        # Here we take the latest values of all sensors as a single sample point? 
        # Or fit on the history of one sensor? 
        # The prompt says "fit IsolationForest on window". Usually this means fit on the history of 50 samples.
        # But we need to detect anomaly *now*. 
        # Let's fit on the rolling window of combined features.
        
        data_matrix = []
        # We need a matrix of shape (n_samples, n_features)
        # Let's use the last 50 time steps as samples.
        # Features: temp, pressure, ph, flow, vibration
        
        n_samples = len(state.history["temperature"])
        if n_samples < 50:
            continue

        for i in range(n_samples):
            row = [
                state.history["temperature"][i],
                state.history["pressure"][i],
                state.history["ph"][i],
                state.history["flowRate"][i],
                state.history["vibration"][i]
            ]
            data_matrix.append(row)
        
        X = np.array(data_matrix)
        
        # Fit model
        state.model.fit(X)
        state.is_model_fitted = True
        
        # Predict on latest
        latest = X[-1].reshape(1, -1)
        score = state.model.decision_function(latest)[0]
        prediction = state.model.predict(latest)[0] # -1 for anomaly
        
        # print(f"AI Score: {score:.3f}, Prediction: {prediction}")

        if score < -0.2:
            print("ANOMALY DETECTED!")
            state.twin_state["core"] = "critical"
            # Add anomaly event
            event = AnomalyEvent(zone="core", severity=abs(score), timestamp=state.data_count) # simplified timestamp
            state.anomalies.append(event)
            # Keep last 10
            if len(state.anomalies) > 10:
                state.anomalies.pop(0)
        else:
            state.twin_state["core"] = "normal"

async def broadcast_state():
    if not state.clients:
        return
    
    message = {
        "type": "sensor_update",
        "payload": [s.dict() for s in state.sensors.values()],
        "twin_state": state.twin_state,
        "anomalies": [a.dict() for a in state.anomalies[-1:]] if state.anomalies else [] # Send latest anomaly if exists? Or full list?
        # Prompt says "push incremental updates... and anomaly events immediately". 
        # Let's send full sensor array.
    }
    
    disconnected = []
    for client in state.clients:
        try:
            await client.send_text(json.dumps(message))
        except:
            disconnected.append(client)
    
    for client in disconnected:
        state.clients.remove(client)

# --- Endpoints ---

@app.on_event("startup")
async def startup_event():
    configure_logging()
    env_path = Path(__file__).resolve().parent / ".env"
    state.settings = get_settings(str(env_path))
    # Initialize only HF Client, bypassing full RAG Pipeline
    state.hf_client = HFInferenceClient(state.settings)
    
    asyncio.create_task(simulate_sensors())
    asyncio.create_task(ai_loop())

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    state.clients.append(websocket)
    
    # Send initial state
    init_msg = {
        "type": "init",
        "payload": [s.dict() for s in state.sensors.values()],
        "twin_state": state.twin_state,
        "anomalies": [a.dict() for a in state.anomalies]
    }
    await websocket.send_text(json.dumps(init_msg))
    
    try:
        while True:
            await websocket.receive_text() # Keep connection open
    except WebSocketDisconnect:
        state.clients.remove(websocket)

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    # Rule based logic
    question = request.question.lower()
    
    status = state.twin_state["core"]
    temp = state.sensors.get("temperature", SensorData(id="temp", value=0, unit="C", status="unknown"))
    pressure = state.sensors.get("pressure", SensorData(id="pressure", value=0, unit="MPa", status="unknown"))
    
    answer = ""
    if "status" in question or "how" in question:
        answer = f"The reactor core status is currently {status}. "
    
    if "temperature" in question:
        answer += f"Temperature is {temp.value}{temp.unit}. "
        
    if "pressure" in question:
        answer += f"Pressure is {pressure.value}{pressure.unit}. "
        
    if "anomaly" in question or "wrong" in question:
        if status == "critical":
            answer += "WARNING: Anomaly detected in the core zone! Check alerts."
        else:
            answer += "No active anomalies detected."
            
    if not answer:
        answer = f"System is running. Core status: {status}. Temp: {temp.value}. Pressure: {pressure.value}."
        
    return ChatResponse(answer=answer)

@app.post("/rag/chat", response_model=RAGChatResponse)
async def rag_chat(request: ChatRequest):
    if not state.hf_client:
        raise HTTPException(status_code=500, detail="AI Client not initialized")
    
    logger = get_logger("rag.chat")
    try:
        # Direct generation without retrieval
        # Pure API call to Hugging Face
        answer = state.hf_client.generate(request.question, [])
        return RAGChatResponse(answer=answer, contexts=[])
    except Exception as exc:
        logger.error("Chat generation failed: %s", exc)
        # Fallback to simple rule-based response if LLM fails
        return RAGChatResponse(answer=f"I'm unable to process that right now. (Error: {str(exc)})", contexts=[])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
