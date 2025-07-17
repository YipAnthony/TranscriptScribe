# CTG API Proxy Setup

This setup allows your backend to access the ClinicalTrials.gov API through your Next.js frontend, bypassing 403 errors that occur when requests come from cloud environments.

## How it works

1. **Frontend Proxy**: Next.js API route at `/api/proxy/clinical-trials` forwards requests to CTG API with proper browser headers
2. **Backend Integration**: Your Python backend calls the proxy instead of CTG API directly
3. **Environment Configuration**: Set `CTG_PROXY_URL` environment variable to point to your frontend

## Setup Instructions

### 1. Frontend (Next.js)

The proxy route is already set up at `app/api/proxy/clinical-trials/route.ts`

### 2. Backend Environment

Add to your backend `.env` file:

```bash
# For local development
CTG_PROXY_URL=http://localhost:3000/api/proxy/clinical-trials

# For production (replace with your frontend URL)
CTG_PROXY_URL=https://your-frontend-domain.com/api/proxy/clinical-trials
```

### 3. Testing

1. Start your Next.js development server:
   ```bash
   cd frontend
   npm run dev
   ```

2. Test the proxy:
   ```bash
   node test-proxy.js
   ```

3. Start your backend:
   ```bash
   cd backend
   poetry run python main.py
   ```

## Production Deployment

For production, make sure to:

1. Set `CTG_PROXY_URL` to your deployed frontend URL
2. Ensure your frontend and backend can communicate
3. Consider CORS settings if needed

## Troubleshooting

- **403 errors**: The proxy should handle this with proper browser headers
- **Connection errors**: Check that the proxy URL is correct and accessible
- **CORS issues**: The proxy handles this automatically

## Benefits

- ✅ Bypasses CTG API 403 errors
- ✅ Uses realistic browser headers
- ✅ Works in cloud environments
- ✅ Maintains API functionality 