# Deployment Guide for MindSync

## Step 1: Upload to GitHub

### If you already have a GitHub account:

1. **Create a new repository on GitHub:**
   - Go to https://github.com/new
   - Repository name: `MindSync` (or your preferred name)
   - Description: "Mental Health Companion App"
   - Choose Public or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)
   - Click "Create repository"

2. **Add remote and push:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/MindSync.git
   git branch -M main
   git push -u origin main
   ```

### If you need to set up GitHub:

1. Create account at https://github.com
2. Install GitHub CLI or use GitHub Desktop
3. Follow the steps above

## Step 2: Deploy on Render

### Initial Setup:

1. **Create Render Account:**
   - Go to https://render.com
   - Sign up with GitHub (recommended for easy integration)

2. **Connect GitHub Repository:**
   - In Render dashboard, click "New +"
   - Select "Web Service"
   - Connect your GitHub account if not already connected
   - Select your `MindSync` repository

### Configure Render Service:

3. **Basic Settings:**
   - **Name:** mindsync-backend (or your choice)
   - **Region:** Choose closest to you (e.g., Oregon for US)
   - **Branch:** main
   - **Root Directory:** Backend
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

4. **Environment Variables:**
   Add these in the Render dashboard under "Environment":
   
   ```
   NODE_ENV=production
   PORT=10000 (Render provides this, but can override)
   MONGO_URI=your_mongodb_atlas_connection_string
   BASE_URL=https://your-app-name.onrender.com
   FRONTEND_URL=https://your-app-name.onrender.com
   ```
   
   **Optional:**
   ```
   OPENAI_API_KEY=your_openai_key
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   ```

### MongoDB Setup:

5. **Set up MongoDB Atlas (if not already done):**
   - Go to https://www.mongodb.com/cloud/atlas
   - Create a free cluster
   - Get connection string
   - Update `MONGO_URI` in Render environment variables
   - Replace `<password>` with your actual password

### Google OAuth Setup:

6. **Configure Google OAuth (for Google Fit):**
   - Go to https://console.cloud.google.com
   - Create a project
   - Enable Google Fitness API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://your-app-name.onrender.com/api/googlefit/oauth2callback`
   - Add credentials to Render environment variables

### Deploy:

7. **Click "Create Web Service"**
   - Render will build and deploy your app
   - First deployment takes 5-10 minutes
   - You'll get a URL like: `https://your-app-name.onrender.com`

8. **Update Base URLs:**
   - After deployment, update `BASE_URL` and `FRONTEND_URL` in Render environment variables
   - Redeploy if needed

## Step 3: Verify Deployment

1. Visit your Render URL
2. Test the app:
   - Dashboard loads correctly
   - Can add vitals manually
   - Wellness tips appear
   - Google Fit connection (if configured)

## Troubleshooting

### Build fails:
- Check build logs in Render dashboard
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

### App crashes:
- Check logs in Render dashboard
- Verify environment variables are set correctly
- Ensure MongoDB connection string is correct

### Google Fit not working:
- Verify redirect URI matches Render URL
- Check OAuth credentials are correct
- Ensure Google Fitness API is enabled

### Environment Variables:
- Never commit .env files to GitHub
- Always use Render's environment variables section
- Use Render's secret management for sensitive data

## Free Tier Limitations:

- Render free tier has cold starts (first request after 15 min inactivity is slow)
- 750 hours/month free
- Auto-sleeps after inactivity
- Use paid tier for always-on service

## Alternative: Deploy Frontend Separately

You can also deploy the frontend separately:
1. Build frontend as static files
2. Deploy to Netlify, Vercel, or GitHub Pages
3. Update API_BASE_URL in frontend to point to Render backend
4. Configure CORS properly

## Support

For issues:
- Check Render logs
- Check MongoDB Atlas logs
- Review environment variables
- Check network tab in browser console

