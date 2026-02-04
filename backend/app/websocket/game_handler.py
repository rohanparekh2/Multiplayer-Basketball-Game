from fastapi import WebSocket, WebSocketDisconnect
from app.services.game_service import game_service
import json


class ConnectionManager:
    """Manages WebSocket connections for game rooms."""
    
    def __init__(self):
        # room_id -> list of websockets
        self.active_connections: dict[str, list[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, room_id: str):
        """Connects a client to a room."""
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)
    
    def disconnect(self, websocket: WebSocket, room_id: str):
        """Disconnects a client from a room."""
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
    
    async def broadcast_to_room(self, room_id: str, message: dict):
        """Broadcasts a message to all clients in a room."""
        if room_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[room_id]:
                try:
                    await connection.send_json(message)
                except:
                    disconnected.append(connection)
            
            # Remove disconnected clients
            for conn in disconnected:
                self.disconnect(conn, room_id)


manager = ConnectionManager()


async def handle_game_websocket(websocket: WebSocket, room_id: str):
    """Handles WebSocket connections for game updates."""
    # Lazy import to avoid circular dependency
    from app.api.game import game_to_response
    
    await manager.connect(websocket, room_id)
    
    try:
        # Send initial game state
        game = game_service.get_game(room_id)
        if game:
            await websocket.send_json({
                "type": "game_state",
                "data": game_to_response(game).model_dump()
            })
        
        # Keep connection alive and handle incoming messages
        while True:
            data = await websocket.receive_text()
            try:
                message = json.loads(data)
                # Handle different message types if needed
                # For now, just broadcast game state updates
                game = game_service.get_game(room_id)
                if game:
                    await manager.broadcast_to_room(room_id, {
                        "type": "game_state",
                        "data": game_to_response(game).model_dump()
                    })
            except json.JSONDecodeError:
                await websocket.send_json({"error": "Invalid JSON"})
    
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)

