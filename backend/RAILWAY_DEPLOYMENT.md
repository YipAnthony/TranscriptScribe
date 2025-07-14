# Railway Deployment Guide

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Environment Variables**: You'll need to set up your environment variables in Railway

## Required Environment Variables

Set these in your Railway project settings:

```
GOOGLE_AI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Deployment Steps

### Option 1: Deploy from GitHub (Recommended)

1. **Connect GitHub Repository**:
   - Go to Railway dashboard
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your TranscriptScribe repository

2. **Configure Deployment**:
   - Set the **Root Directory** to `backend`
   - Railway will automatically detect it's a Python/Poetry project

3. **Set Environment Variables**:
   - Go to your project's "Variables" tab
   - Add all required environment variables listed above

4. **Deploy**:
   - Railway will automatically build and deploy your app
   - The first deployment might take 5-10 minutes

### Option 2: Deploy from CLI

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**:
   ```bash
   railway login
   ```

3. **Initialize Railway Project**:
   ```bash
   cd backend
   railway init
   ```

4. **Set Environment Variables**:
   ```bash
   railway variables set GOOGLE_AI_API_KEY=your_gemini_api_key
   railway variables set SUPABASE_URL=your_supabase_url
   railway variables set SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

5. **Deploy**:
   ```bash
   railway up
   ```

## Verification

After deployment, your app will be available at:
- **Production URL**: `https://your-app-name.railway.app`
- **Health Check**: `https://your-app-name.railway.app/health`
- **API Docs**: `https://your-app-name.railway.app/docs`

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Railway logs for Poetry installation issues
   - Ensure all dependencies are in `pyproject.toml`

2. **Environment Variables**:
   - Verify all required variables are set in Railway dashboard
   - Check that variable names match exactly (case-sensitive)

3. **Port Issues**:
   - Railway automatically sets the `$PORT` environment variable
   - The Procfile uses this variable correctly

4. **Database Connection**:
   - Ensure Supabase URL and keys are correct
   - Check that your Supabase project allows external connections

### Logs and Monitoring

- **View Logs**: Go to your Railway project → "Deployments" → Click on deployment → "Logs"
- **Real-time Logs**: Use `railway logs` in CLI
- **Health Monitoring**: Railway automatically monitors your `/health` endpoint

## Custom Domain (Optional)

1. Go to your Railway project → "Settings" → "Domains"
2. Add your custom domain
3. Configure DNS records as instructed

## Scaling

Railway automatically scales based on traffic. You can also:
- Set manual scaling in project settings
- Configure auto-scaling rules
- Monitor resource usage in the dashboard

## Cost Optimization

- Railway charges based on usage
- Consider setting up auto-sleep for development environments
- Monitor usage in the Railway dashboard 