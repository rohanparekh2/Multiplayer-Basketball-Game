# Setup Instructions

## Quick Start

### 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API will be available at http://localhost:8000
API documentation at http://localhost:8000/docs

### 2. Frontend Setup

In a new terminal:

```bash
cd frontend
npm install
```

Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

Then run:
```bash
npm run dev
```

The frontend will be available at http://localhost:3000

## Architecture

### Backend (FastAPI)
- **Models**: Game logic (Player, Offense, Defense, Game)
- **Services**: Business logic (GameService, ShotCalculationService)
- **API**: REST endpoints for game actions
- **WebSocket**: Real-time game state updates

### Frontend (Next.js + React Three Fiber)
- **3D Graphics**: Three.js court and ball animations
- **UI Components**: Shot selection, defense, power meter, scoreboard
- **State Management**: Custom hooks with WebSocket integration
- **Styling**: Tailwind CSS with modern animations

## Key Features

✅ 3D basketball court with React Three Fiber
✅ Real-time multiplayer via WebSockets
✅ Shot selection (4 types)
✅ Defense selection (3 types)
✅ Power meter with spacebar control
✅ Animated ball trajectory
✅ Modern UI with smooth transitions
✅ Scoreboard and game state management

## Game Flow

1. Game auto-creates on page load
2. Offensive player selects shot type
3. Defensive player selects defense
4. Offensive player presses SPACEBAR to set power
5. Ball animation plays
6. Result displayed (Made/Missed)
7. Players switch turns
8. First to 10 points wins

## Development Notes

- Backend uses in-memory storage (can be upgraded to database)
- WebSocket handles real-time state synchronization
- Frontend uses React hooks for state management
- All game logic is server-authoritative

