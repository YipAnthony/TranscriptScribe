# Railway Deployment

## Quick Setup

1. **Go to [railway.app](https://railway.app)**
2. **Create new project** → "Deploy from GitHub repo"
3. **Select your repository**
4. **Set Root Directory** to `backend`
5. **Add Environment Variables:**
   - `GOOGLE_AI_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

## Files Created

- `Procfile` - Tells Railway how to run the app
- `runtime.txt` - Specifies Python version
- `requirements.txt` - Fallback dependencies
- `pyproject.toml` - Poetry configuration (updated)

## Your app will be available at:
- `https://your-app-name.railway.app`
- Health check: `/health`
- API docs: `/docs`

## Troubleshooting

If Poetry fails, Railway will fall back to `requirements.txt`.
Check logs in Railway dashboard for any issues. 