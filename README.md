# DBUS Live - Bus Position Visualizer

A real-time bus position visualizer for DBUS Donostia (San Sebastián, Spain). The app estimates bus positions based on arrival time data from the DBUS website and displays them on an interactive map.

## Features

- 🗺️ Full-screen interactive map (Leaflet + OpenStreetMap)
- 🔍 Search and filter bus lines
- 🔴 Red dot markers showing estimated bus positions
- 📍 Tap a bus to see its route and ETA to each stop
- 🔄 Auto-refresh every 30 seconds
- 📱 Mobile-first responsive design

## Tech Stack

**Backend:**
- Node.js + Express
- TypeScript
- xml2js for parsing DBUS data

**Frontend:**
- React 18
- TypeScript
- Leaflet + react-leaflet
- Vite

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
cd dbus-visualizer
```

2. Install backend dependencies:
```bash
cd backend
npm install
```

3. Install frontend dependencies:
```bash
cd ../frontend
npm install
```

### Running the App

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. In another terminal, start the frontend:
```bash
cd frontend
npm run dev
```

3. Open http://localhost:5173 in your browser

## How It Works

1. **Data Source**: The app fetches stop data from DBUS's public markers XML files
2. **Arrival Times**: For each stop, it queries the `calcula_parada` AJAX endpoint to get real-time ETAs
3. **Position Estimation**: Bus positions are interpolated based on which stops have the lowest ETAs
4. **Visualization**: Buses appear as red dots; tapping shows the route and ETAs

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/lines` | List all bus lines |
| `GET /api/lines/:lineNum/stops` | Get stops for a line |
| `GET /api/lines/:lineNum/buses` | Get estimated bus positions |

## Deployment (Railway)

The app is configured as a single-service deployment where the backend serves the frontend.

### One-Click Deploy

1. Push your code to GitHub
2. Go to [Railway](https://railway.app) and create a new project
3. Connect your GitHub repo
4. Railway will automatically detect the `package.json` and run:
   - `npm run build` (builds both frontend and backend)
   - `npm start` (starts the backend serving the frontend)
5. Done! Railway provides a public URL automatically.

### Manual Deploy via CLI

```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

**No port configuration needed** - Railway automatically sets the `PORT` environment variable.

## Disclaimer

This is an unofficial project. Bus positions are **estimated** based on arrival times and may not reflect actual real-time GPS positions. Use for informational purposes only.

## License

MIT

