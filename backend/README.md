# Basketball Game Backend

FastAPI backend for the multiplayer basketball game.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Run the server:
```bash
uvicorn app.main:app --reload --port 8000
```

3. API docs available at: http://localhost:8000/docs

## Architecture

- `app/models/` - Game logic models (Player, Offense, Defense, Game)
- `app/services/` - Business logic services
- `app/api/` - REST API endpoints
- `app/websocket/` - WebSocket handlers for real-time updates
- `app/schemas/` - Pydantic schemas for API validation

