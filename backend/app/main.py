from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.api import game
from app.websocket import game_handler

# Load environment variables from .env file
load_dotenv()

app = FastAPI(
    title="Basketball Game API",
    description="Multiplayer basketball game backend",
    version="1.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(game.router, prefix="/api/game", tags=["game"])

# WebSocket endpoint
@app.websocket("/ws/game/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await game_handler.handle_game_websocket(websocket, room_id)

@app.get("/")
async def root():
    return {"message": "Basketball Game API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

