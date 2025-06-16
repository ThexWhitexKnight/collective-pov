# Vercel Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Code Repository
- [ ] Code is pushed to GitHub/GitLab/Bitbucket
- [ ] Repository is public or accessible to Vercel
- [ ] All sensitive files are in `.gitignore`

### 2. Environment Variables Ready
- [ ] PostgreSQL database URL (Neon, Supabase, or PlanetScale)
- [ ] Google Drive service account credentials
- [ ] NEXTAUTH_SECRET generated
- [ ] NEXTAUTH_URL set to production domain

### 3. Database Setup
- [ ] Cloud PostgreSQL database created
- [ ] Database connection string tested
- [ ] Prisma migrations ready to run

### 4. Google Drive API
- [ ] Google Cloud project created
- [ ] Drive API enabled
- [ ] Service account created with Drive permissions
- [ ] Service account key downloaded
- [ ] Target Google Drive folder created and shared with service account

## 🚀 Deployment Steps

1. **Connect Repository to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Select the `app` folder as root directory

2. **Configure Environment Variables**
   - Add all variables from `.env.production.template`
   - Ensure NEXTAUTH_URL matches your Vercel domain

3. **Deploy**
   - Vercel will automatically build and deploy
   - First deployment may take 2-3 minutes

## 🔧 Post-Deployment

- [ ] Test file upload functionality
- [ ] Verify Google Drive integration
- [ ] Check database connections
- [ ] Test all API endpoints

## 📋 Files Created for Deployment

- `vercel.json` - Vercel configuration
- `.vercelignore` - Files to exclude from deployment
- `.env.production.template` - Environment variables template
- `VERCEL_DEPLOYMENT_GUIDE.md` - Detailed deployment guide
- Updated `package.json` with Vercel-specific scripts
- Updated `prisma/schema.prisma` for Vercel compatibility

## 🆘 Need Help?

Refer to `VERCEL_DEPLOYMENT_GUIDE.md` for detailed instructions and troubleshooting.
