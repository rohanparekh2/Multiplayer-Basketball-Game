# Basketball Game Frontend

Next.js frontend with SVG-based 2D graphics and Framer Motion animations.

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
  - `GameCanvas/` - SVG game canvas container
  - `Court/` - SVG basketball court
  - `Basketball/` - SVG basketball with animations
  - `UI/` - Game UI components
- `hooks/` - Custom React hooks
- `services/` - API and WebSocket clients
- `types/` - TypeScript type definitions
- `utils/` - Utility functions (trajectory calculations)

