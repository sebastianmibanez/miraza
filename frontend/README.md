# Miraza Frontend

Modern React + TypeScript frontend for Miraza preuniversitario & apoyo educativo.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool & dev server
- **React Router v6** - Client-side routing
- **Axios** - HTTP client for API calls
- **CSS 3** - Styling with design tokens

## Prerequisites

- **Node.js** >= 18.x
- **npm** >= 9.x or **yarn** >= 3.x

## Installation

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.development`:

```bash
cp .env.example .env.development
```

For production builds, `.env.production` is already configured to use `https://miraza.cl`.

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

**Important:** In development, the app proxies API requests to `http://localhost:5000` (Flask backend). Make sure Flask is running on port 5000.

## Development Commands

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Lint TypeScript & JSX
npm run lint
```

## Project Structure

```
frontend/
├── src/
│   ├── components/     # Reusable components
│   │   ├── Layout.tsx  # Main layout with navbar & footer
│   │   ├── Navbar.tsx  # Navigation component
│   │   └── Footer.tsx  # Footer component
│   ├── pages/          # Page components
│   │   ├── Home.tsx
│   │   ├── QuienesSomos.tsx
│   │   ├── Planes.tsx
│   │   ├── Aranceles.tsx
│   │   ├── Apoyo.tsx
│   │   └── Contacto.tsx
│   ├── services/
│   │   └── api.ts      # Axios API client
│   ├── App.tsx         # Main app with routing
│   ├── main.tsx        # Entry point
│   └── index.css       # Global styles
├── vite.config.ts      # Vite configuration + API proxy
├── tsconfig.json       # TypeScript config
├── index.html          # HTML template
└── package.json
```

## API Integration

The app communicates with the Flask backend at `http://localhost:5000`.

### Available Endpoints

- `POST /api/inscripcion` - Submit registration form
- `GET /api/health` - Health check

### Making API Calls

Use the `api` service in `src/services/api.ts`:

```typescript
import { inscribir, InscripcionData } from '@/services/api'

const data: InscripcionData = {
  nombre: 'Juan',
  apellido: 'Pérez',
  email: 'juan@example.com',
  telefono: '+56912345678',
  curso: '4to Medio',
  materias: ['Matemática', 'Lenguaje'],
  mensaje: 'Interesado en PAES'
}

const response = await inscribir(data)
```

## Design System

### Color Palette

```typescript
--navy:   #0A1F44   // Primary dark
--blue:   #1B4DB8   // Primary
--gold:   #F5A623   // Accent
--gold-l: #FFD07A   // Light accent
--light:  #F0F4FC   // Light background
--white:  #FFFFFF   // White
--text:   #1a1a2e   // Text color
--muted:  #6b7a99   // Muted text
```

### Typography

- **Headings:** Playfair Display (serif, 700/900 weight)
- **Body:** Outfit (sans-serif, 400/500/600 weight)

## Environment Variables

### Development (`.env.development`)
```
VITE_API_URL=http://localhost:5000
```

### Production (`.env.production`)
```
VITE_API_URL=https://miraza.cl
```

## Building for Production

```bash
npm run build
```

Output files are in the `dist/` folder. These are static files that can be served by any web server or integrated into the Flask backend.

### Serving React Build with Flask (Optional)

To serve the React build from Flask, you can add this to `app.py`:

```python
from flask import send_from_directory
import os

@app.route('/')
@app.route('/<path:filename>')
def serve_react(filename='index.html'):
    """Serve React build files"""
    frontend_build = os.path.join(os.path.dirname(__file__), 'frontend/dist')
    if filename and os.path.isfile(os.path.join(frontend_build, filename)):
        return send_from_directory(frontend_build, filename)
    return send_from_directory(frontend_build, 'index.html')
```

## Deployment

### Option 1: Separate Deployment (Recommended)
- Deploy React build to a static host (Vercel, Netlify, GitHub Pages)
- Deploy Flask backend to another service (Render, Heroku, Railway)

### Option 2: Unified Deployment
- Build React: `npm run build`
- Move `dist/` contents to Flask's `static/` folder
- Deploy as a single Flask app

## Performance

- Static analysis with Vite for code splitting
- CSS is scoped to components
- Lazy loading for routes (can be added with React.lazy())
- No external UI framework overhead

## Support

For issues or questions about the frontend, check:
- React docs: https://react.dev
- Vite docs: https://vitejs.dev
- TypeScript docs: https://www.typescriptlang.org

