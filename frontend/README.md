# Basketball Game Frontend

Next.js frontend with React Three Fiber for 3D graphics.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Create a `.env.local` file:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

## Architecture

- `app/` - Next.js app directory
- `components/` - React components
  - `GameCanvas/` - Three.js scene
  - `Court/` - 3D basketball court
  - `Basketball/` - Animated basketball
  - `UI/` - Game UI components
- `hooks/` - Custom React hooks
- `services/` - API and WebSocket clients
- `types/` - TypeScript type definitions

