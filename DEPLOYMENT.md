# Deployment Guide — Miraza React Migration

Deploy the React + Flask application to production on Render or similar platforms.

## Deployment Architecture

### Option A: Separate Services (Recommended)

```
┌─────────────────────────────────────┐
│         Client (Browser)             │
└────────────────┬────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
    ┌───┴──────┐    ┌────┴─────┐
    │ Vercel   │    │  Render   │
    │ (React)  │    │ (FastAPI) │
    └──────────┘    └───────────┘
```

### Option B: Unified Service

```
┌──────────────────────────────────┐
│      Client (Browser)            │
└──────────────┬───────────────────┘
               │
          ┌────┴─────┐
          │   Render  │
          │           │
     ┌────┴───────┐   │
     │ React (/) │   │
     │ API (/api)│   │
     └───────────┘   │
     (Flask + built   │
      React assets)   │
```

## Option A: Separate Deployments (Recommended)

### Step 1: Deploy Flask Backend to Render

1. **Create Render Account** - https://render.com
2. **Connect GitHub**
3. **Create Web Service:**
   - Repository: Your miraza repo
   - Build command: `pip install -r requirements.txt`
   - Start command: `gunicorn app:app`
   - Environment variables:
     ```
     DATABASE_URL=postgresql://[render-postgres-url]
     ADMIN_USER=[secure-username]
     ADMIN_PASSWORD=[secure-password]
     SECRET_KEY=[random-secret]
     ```

4. **Update CORS in Flask** (`app.py`):
   ```python
   CORS(app, resources={r"/api/*": {"origins": [
       "http://localhost:5173",
       "https://your-frontend-domain.com"
   ]}})
   ```

5. **Deploy:** Push to GitHub, Render auto-deploys

### Step 2: Deploy React Frontend to Vercel

1. **Create Vercel Account** - https://vercel.com
2. **Connect GitHub**
3. **Create Project:**
   - Framework: Vite
   - Root directory: `frontend`
   - Build command: `npm run build`
   - Install command: `npm install`

4. **Environment Variables:**
   ```
   VITE_API_URL=https://[your-render-domain].onrender.com
   ```

5. **Deploy:** Vercel auto-deploys on GitHub push

### Step 3: Update DNS & SSL

- Point your domain to Vercel (CNAME)
- Vercel handles SSL automatically
- API domain: use Render's subdomain

## Option B: Unified Deployment

### Build & Deploy to Render

1. **Update render.yaml:**

```yaml
services:
  - type: web
    name: miraza-app
    env: python
    plan: standard
    
    buildCommand: >
      pip install -r requirements.txt &&
      cd frontend &&
      npm install &&
      npm run build &&
      cd ..
    
    startCommand: gunicorn app:app
    
    envVars:
      - key: DATABASE_URL
        scope: build
      - key: ADMIN_USER
        scope: build
      - key: ADMIN_PASSWORD
        scope: build
      - key: SECRET_KEY
        scope: build
      - key: FLASK_ENV
        value: production

databases:
  - name: miraza-db
    plan: standard
    version: 14
```

2. **Update Flask to serve React build:**

```python
import os
from flask import send_from_directory

# Build directory
REACT_BUILD_DIR = os.path.join(os.path.dirname(__file__), 'frontend/dist')

# Serve React static files
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    """Serve React app or API"""
    if path.startswith('api/'):
        # Let Flask handle API routes
        return not_found(404)
    
    file_path = os.path.join(REACT_BUILD_DIR, path)
    
    # Serve file if exists
    if path and os.path.isfile(file_path):
        return send_from_directory(REACT_BUILD_DIR, path)
    
    # Fallback to index.html for SPA
    return send_from_directory(REACT_BUILD_DIR, 'index.html')

@app.route('/robots.txt')
def robots():
    return send_from_directory(REACT_BUILD_DIR, 'robots.txt')
```

3. **Deploy:**
   ```bash
   git push  # Render auto-builds & deploys
   ```

## Production Environment Variables

### Flask (.env or Render settings)
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
ADMIN_USER=secure_username
ADMIN_PASSWORD=strong_password_here
SECRET_KEY=$(openssl rand -base64 32)
FLASK_ENV=production
```

### React (frontend/.env.production or Vercel)
```
VITE_API_URL=https://api.miraza.cl
```

## Database Setup

### Using Render PostgreSQL

1. **Create PostgreSQL database in Render**
2. **Copy connection string**
3. **Set DATABASE_URL in backend service**
4. **Migrations run automatically on first deploy**

### Using SQLite (Default)

No setup needed - SQLite file is created in `database/miraza.db`

## SSL/TLS Certificate

### With Vercel + Render
- Both provide free SSL certificates
- Auto-renew and HTTPS setup
- Domain configuration: CNAME to Vercel

### Custom Domain
1. Purchase domain (Namecheap, GoDaddy, etc.)
2. Update DNS CNAME to Vercel
3. Add domain in Vercel dashboard
4. SSL auto-generates

## Performance Optimization

### Frontend (React/Vercel)
```bash
# Check bundle size
cd frontend
npm run build
# Outputs to frontend/dist/

# Monitor with:
npm install -D rollup-plugin-visualizer
```

### Backend (Flask/Render)
```python
# Enable caching
from flask_caching import Cache

cache_config = {
    "CACHE_TYPE": "simple",
    "CACHE_DEFAULT_TIMEOUT": 300
}
cache = Cache(app, config=cache_config)

@app.route('/api/health')
@cache.cached(timeout=60)
def health():
    # ...
```

## Monitoring & Debugging

### Render Logs
```bash
# View Flask logs in Render dashboard
# or stream locally:
render logs --tail -f
```

### Vercel Logs
- View in Vercel dashboard
- Runtime logs for serverless functions
- Edge function logs

### Error Tracking
```python
# Add error logging to Flask
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

sentry_sdk.init(
    dsn="your-sentry-dsn",
    integrations=[FlaskIntegration()],
    traces_sample_rate=1.0
)
```

## Deployment Checklist

- [ ] Flask backend builds successfully
- [ ] React frontend builds successfully
- [ ] Database migrations run
- [ ] CORS is configured for production domains
- [ ] Environment variables are set
- [ ] SSL certificate is valid
- [ ] API endpoints are accessible
- [ ] Form submissions work (inscripcion)
- [ ] Admin panel loads (if migrating)
- [ ] No console errors in browser DevTools
- [ ] Mobile responsiveness tested
- [ ] Performance metrics acceptable

## Rollback Procedure

### Vercel
```bash
# View deployment history
vercel deployments

# Rollback to previous:
vercel rollback
```

### Render
- Redeploy from previous GitHub commit
- Or use "Redeploy Previous Version" in dashboard

## Cost Estimates

### Option A (Separate)
- Vercel: $0-20/month (frontend)
- Render: $7-20/month (API + database)
- **Total:** ~$15-40/month

### Option B (Unified)
- Render: $7-20/month (everything)
- **Total:** ~$7-20/month

## Support Resources

- **Render Deploy Docs:** https://render.com/docs
- **Vercel Deploy Docs:** https://vercel.com/docs
- **Flask Production:** https://flask.palletsprojects.com/deployment
- **React Optimization:** https://react.dev/learn/render-and-commit
- **PostgreSQL on Render:** https://render.com/docs/databases

## Post-Deployment

1. **Setup monitoring** - Errors, performance
2. **Configure backups** - PostgreSQL daily backups
3. **Setup alerts** - Email on errors
4. **Gradual rollout** - Test with beta users first
5. **Analytics** - Add monitoring to track usage

---

**Deployment complete!** Your app is now live on the internet.

For issues, check console logs and API responses in browser DevTools.
