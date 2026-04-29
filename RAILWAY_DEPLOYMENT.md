# Railway Deployment Guide

This document explains how to deploy the Global Threads application to Railway.

## Prerequisites
- Railway account (https://railway.app)
- GitHub account with access to the repository
- Project pushed to GitHub

## Step-by-Step Deployment

### 1. Connect Repository to Railway
1. Go to [Railway.app](https://railway.app)
2. Sign in with GitHub
3. Click **"Create a new project"** or **"+ New Project"**
4. Select **"Deploy from GitHub repo"**
5. Select the repository: `SDP_08_globalthreads_frontend`
6. Select the `main` branch
7. Click **"Deploy"**

### 2. Configure Environment Variables
Railway will automatically detect the Node.js project and use the Dockerfile.

Add the following environment variables in Railway's dashboard:

```
DB_HOST=your-mysql-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=global_threads_backend
NODE_ENV=production
PORT=5000
```

> **Note**: If you need a MySQL database, you can:
> - Add a MySQL plugin in Railway (click "+ Add" and search for MySQL)
> - Railway will automatically populate the connection variables
> - Or use an external MySQL database and configure the variables manually

### 3. Configure Build Settings
The project includes:
- **Dockerfile**: Handles React build and Express server setup
- **Procfile**: Alternative configuration for buildpack deployment
- **railway.json**: Railway project configuration

#### If using Dockerfile (Recommended):
- Railway detects `Dockerfile` automatically
- Build process: Installs dependencies → Builds React → Starts Express server
- Estimated build time: 5-10 minutes

#### If using Buildpack (Alternative):
- Delete `Dockerfile` and use `Procfile`
- Railway will use Node.js buildpack

### 4. Deploy
1. Click **"Deploy"** button
2. Watch the build logs
3. Once build completes, you'll get a deployment URL
4. Application will be live at: `https://your-project-name.railway.app`

## Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `DB_HOST` | MySQL database host | `mysql.railway.internal` |
| `DB_USER` | Database username | `root` |
| `DB_PASSWORD` | Database password | `your_secure_password` |
| `DB_NAME` | Database name | `global_threads_backend` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `5000` |

## Troubleshooting

### Build Fails
- Check logs in Railway dashboard
- Ensure all dependencies are in `package.json`
- Verify `npm run build` works locally

### Application Crashes
- Check logs in Railway dashboard
- Verify database connection variables are correct
- Ensure database is accessible from Railway

### Database Connection Issues
- If using Railway MySQL plugin, it auto-configures
- For external database, ensure:
  - Host is publicly accessible
  - Credentials are correct
  - Firewall allows Railway IP

## Redeployment

To redeploy after code changes:
1. Push changes to `main` branch
2. Railway automatically detects and redeploys
3. Or manually trigger in Railway dashboard: **"Redeploy"**

## Monitoring & Logs

- View real-time logs in Railway dashboard
- Check application health: `https://your-app.railway.app/api/health`
- Monitor database performance in Railway metrics

## Database Backup

Railway provides database backups:
1. Go to the MySQL service in Railway
2. Configure backup settings
3. Backups are retained for 30 days

## Production Best Practices

1. **Environment Variables**: Never commit sensitive data
2. **Database**: Use Railway's managed MySQL or secure external database
3. **Logs**: Monitor regularly for errors
4. **Updates**: Test locally before pushing to main
5. **CORS**: Configure appropriately for production domain

## Additional Resources

- Railway Documentation: https://docs.railway.app
- Node.js on Railway: https://docs.railway.app/guides/nodejs
- Environment Variables: https://docs.railway.app/guides/variables
