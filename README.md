# Court Kings Showdown

A modern multiplayer basketball game built with Next.js, TypeScript, and FastAPI.

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Framer Motion, Tailwind CSS, SVG
- **Backend**: FastAPI (Python), WebSockets, Pydantic
- **AI**: Google Gemini API (for Coach AI)
- **Architecture**: REST API + WebSocket for real-time updates

## Features

- 2D SVG basketball court with smooth animations
- Real-time multiplayer gameplay with WebSocket support
- Shot selection (Layup, Midrange, Three-Pointer, Half Court)
- Defense selection (Block, Steal, Contest)
- 2K-style timing meter for shot accuracy
- Adaptive AI defense that adjusts to player tendencies
- AI Coach that provides strategic recommendations
- Player tracking (hot/cold streaks, fatigue, shot charts)
- Animated ball trajectory with distinct make/miss animations
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
2. Offensive player selects shot type (with AI Coach recommendations)
3. Defensive player selects defense type
4. Offensive player times their shot using the timing meter (press SPACEBAR)
5. Ball animation plays with distinct make/miss paths
6. Result is displayed with make percentage
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
│   ├── components/       # React components (TypeScript)
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API and WebSocket clients
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions (offense, defense calculations)
└── README.md
```

## Environment Variables

### Backend
- `GEMINI_API_KEY` (optional): Google Gemini API key for Coach AI. If not provided, falls back to rule-based recommendations.

### Frontend
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:8000)
- `NEXT_PUBLIC_WS_URL`: WebSocket URL (default: ws://localhost:8000)

## Future Enhancements

- Sound effects
- Game history/replay
- Enhanced animations
- Multiplayer rooms with matchmaking
