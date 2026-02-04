# Court Kings Showdown

A modern multiplayer basketball game built with Next.js, React Three Fiber, and FastAPI.

## Tech Stack

- **Frontend**: Next.js 14, React 18, Three.js (React Three Fiber), Tailwind CSS
- **Backend**: FastAPI (Python), WebSockets
- **Architecture**: REST API + WebSocket for real-time updates

## Features

- 3D basketball court with Three.js
- Real-time multiplayer gameplay
- Shot selection (Layup, Midrange, Three-Pointer, Half Court)
- Defense selection (Block, Steal, Contest)
- Power meter for shot accuracy
- Animated ball trajectory
- Modern UI with Tailwind CSS

## Setup

### Backend

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the server:
```bash
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

### Frontend

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Game Flow

1. Game starts automatically
2. Offensive player selects shot type
3. Defensive player selects defense type
4. Offensive player selects power (press SPACEBAR)
5. Ball animation plays
6. Result is displayed
7. Players switch turns
8. First to 10 points wins

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/          # REST API endpoints
│   │   ├── models/       # Game logic models
│   │   ├── services/     # Business logic
│   │   ├── schemas/      # Pydantic schemas
│   │   └── websocket/    # WebSocket handlers
│   └── requirements.txt
├── frontend/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── hooks/            # Custom hooks
│   ├── services/         # API clients
│   └── types/            # TypeScript types
└── README.md
```

## Future Enhancements

- AI opponent integration
- Player statistics tracking
- Game history/replay
- Sound effects
- Enhanced 3D graphics
- Multiplayer rooms
