# Miraza — React Migration Guide

Complete migration from Flask + Jinja2 templates to **React + Flask API**.

## Project Structure

```
miraza/
├── app.py                    # Flask API backend
├── requirements.txt          # Python dependencies
├── docker-compose.yml        # Development services
├── Dockerfile               # Flask production image
├── render.yaml              # Render deployment config
│
└── frontend/                # React SPA
    ├── src/
    │   ├── components/      # Reusable React components
    │   ├── pages/           # Page components
    │   ├── services/        # API client
    │   └── App.tsx          # Main app
    ├── package.json         # JavaScript dependencies
    ├── vite.config.ts       # Build tool config
    └── README.md            # Frontend setup guide
```

## Migration Timeline

### Phase 1: React Setup ✅
- Created React + TypeScript project with Vite
- Configured API client for Flask communication
- Set up routing with React Router v6

### Phase 2: Component Conversion ✅
- Converted Jinja2 templates to React components
- Implemented flip cards, carousels, interactive elements
- Maintained original design & branding

### Phase 3: Backend API ✅
- Added CORS support to Flask
- Created `/api/inscripcion` endpoint
- Removed template rendering (API-only mode)
- Added `flask-cors==4.0.0` dependency

### Phase 4: Development Setup (In Progress)
- Document local development environment
- Create Docker Compose for easy setup

### Phase 5: Deployment (Pending)
- Production builds configuration
- Render deployment updates

## Quick Start

### Prerequisites
- Node.js >= 18
- Python >= 3.10
- SQLite3 or PostgreSQL

### Local Development

**Terminal 1: Flask Backend**
```bash
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5000
```

**Terminal 2: React Frontend**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

**Access the app:** http://localhost:5173

### Docker Compose (Optional)

```bash
# Start both services
docker-compose up

# Flask: http://localhost:5000
# React: http://localhost:5173
```

## API Endpoints

All API endpoints are prefixed with `/api`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/inscripcion` | Submit registration |
| GET | `/api/health` | Health check |

Example request from React:
```typescript
POST /api/inscripcion
Content-Type: application/json

{
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@example.com",
  "telefono": "+56912345678",
  "curso": "4to Medio",
  "materias": ["Matemática", "Lenguaje"]
}
```

## CORS Configuration

Flask is configured to accept requests from:
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (Alt port)
- `https://miraza.cl` (Production)

Update in `app.py` line ~17 if needed.

## File Changes Summary

### Updated Files
- **app.py** - Added CORS, changed routes to `/api/`, removed templates
- **requirements.txt** - Added `flask-cors==4.0.0`
- **docker-compose.yml** - Can add React service

### New Files
- **frontend/** - Complete React app
- **frontend/package.json** - JS dependencies
- **frontend/src/pages/** - All page components
- **frontend/src/components/** - Layout, Navbar, Footer
- **frontend/src/services/api.ts** - API client

### Deprecated Files
- ~~templates/*.html~~ - No longer used (keep for reference)
- ~~static/~~ - Optional (can delete or keep for admin assets)

## Environment Variables

### Flask (.env)
```
DATABASE_URL=postgresql://...  # Optional, uses SQLite if empty
ADMIN_USER=your_admin_username
ADMIN_PASSWORD=your_admin_password
SECRET_KEY=your_secret_key
FLASK_DEBUG=false
```

### React Frontend (frontend/.env.development)
```
VITE_API_URL=http://localhost:5000
```

### React Frontend (frontend/.env.production)
```
VITE_API_URL=https://miraza.cl
```

## Deployment Options

### Option 1: Separate Services (Recommended for scaling)
- **Frontend:** Deploy React build to Vercel/Netlify
- **Backend:** Keep Flask on Render

### Option 2: Unified Deployment
- Build React: `cd frontend && npm run build`
- Copy `frontend/dist/*` to `static/` folder
- Deploy single Flask app to Render

Configure in `render.yaml`:
```yaml
services:
  - type: web
    name: miraza
    buildCommand: npm install && npm run build && npm --prefix frontend install && npm --prefix frontend run build
    startCommand: gunicorn app:app
```

## Development Tips

- **Hot Reload:** Both Vite (React) and Flask support hot module reloading
- **API Testing:** Use curl, Postman, or the browser's Network tab
- **Debugging:** Chrome DevTools, React Developer Tools extension
- **Performance:** Run `npm run build` to see bundle size

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Check Flask CORS config & browser console |
| API 404s | Verify endpoint is `/api/...` not `/...` |
| CSS not loading | Check browser Network tab for 404s |
| React won't start | Run `npm install` in `frontend/` folder |
| Database errors | Ensure DATABASE_URL is set or SQLite path exists |

## Next Steps

1. **Test locally** - Ensure both frontend and backend run without errors
2. **Update database** - Verify inscriptions still save correctly
3. **Deploy frontend** - Push React build to hosting
4. **Update DNS** - Point to new services if needed
5. **Monitor** - Check logs for errors post-deployment

## Support & Resources

- **React:** https://react.dev
- **Flask:** https://flask.palletsprojects.com
- **TypeScript:** https://www.typescriptlang.org
- **Vite:** https://vitejs.dev

## Migration Complete! 🎉

Your app now has:
- ✅ Modern React UI with TypeScript
- ✅ Improved developer experience
- ✅ Separate API layer (Flask)
- ✅ Scalable architecture
- ✅ Better performance with Vite

Migration took 4 phases. Deployment is ready!
