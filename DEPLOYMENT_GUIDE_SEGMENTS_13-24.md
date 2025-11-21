# 🚀 Complete Deployment Guide: Segments 13-24

## Wasilah Platform Production Deployment Manual

**Version:** 1.0  
**Last Updated:** November 2024  
**Target Segments:** 13-24 (Complete Platform)

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Firebase Project Setup](#firebase-project-setup)
3. [Environment Configuration](#environment-configuration)
4. [Frontend Deployment](#frontend-deployment)
5. [Backend Deployment](#backend-deployment)
6. [Post-Deployment Testing](#post-deployment-testing)
7. [Manual Testing Procedures](#manual-testing-procedures)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)
10. [Rollback Procedures](#rollback-procedures)

---

## 1. Pre-Deployment Checklist

### ✅ Prerequisites

**Required Software:**
- Node.js 20+ (LTS version)
- npm 10+
- Firebase CLI (`npm install -g firebase-tools`)
- Git

**Verify Installation:**
```bash
node --version  # Should be v20.x.x or higher
npm --version   # Should be 10.x.x or higher
firebase --version
git --version
```

### ✅ Code Repository

**Clone and verify:**
```bash
cd /path/to/your/workspace
git clone https://github.com/mrehmanbee22seecs/wasillahemail.git
cd wasillahemail
git checkout main  # Or your deployment branch
git pull origin main
```

### ✅ Install Dependencies

**Frontend:**
```bash
npm ci  # Use ci for production-like install
```

**Backend:**
```bash
cd functions
npm ci
cd ..
```

### ✅ Verify Build

**Test frontend build:**
```bash
npm run build
# Should complete without errors
# Check dist/ folder exists
ls -la dist/
```

**Test backend build:**
```bash
cd functions
npm run build
# Should complete without errors
# Check lib/ folder exists
ls -la lib/
cd ..
```

---

## 2. Firebase Project Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `wasilah-production` (or your choice)
4. Enable Google Analytics (recommended)
5. Select/create Analytics account
6. Click "Create project"

### Step 2: Add Web App

1. In Firebase Console, click "Add app" → Web icon
2. Register app name: `Wasilah Web App`
3. Check "Also set up Firebase Hosting"
4. Click "Register app"
5. Save the Firebase configuration (you'll need this)

### Step 3: Enable Firebase Services

**Authentication:**
1. Go to Authentication → Sign-in method
2. Enable Email/Password
3. Enable Google (optional)
4. Add authorized domains (your production domain)

**Firestore Database:**
1. Go to Firestore Database
2. Click "Create database"
3. Choose production mode (or test mode, then secure later)
4. Select region closest to users (e.g., asia-south1)
5. Click "Enable"

**Storage:**
1. Go to Storage
2. Click "Get started"
3. Use production rules (will configure later)
4. Select same region as Firestore
5. Click "Done"

**Cloud Functions:**
1. Upgrade to Blaze plan (required for Cloud Functions)
2. Go to Functions
3. Note: Functions will be deployed via CLI

---

## 3. Environment Configuration

### Step 1: Create Environment Files

**Frontend Environment (.env.production):**
```bash
# Create .env.production in root directory
cat > .env.production << 'EOF'
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# API Configuration
VITE_API_BASE_URL=https://us-central1-your-project.cloudfunctions.net

# Third-party Services
VITE_CLOUDINARY_CLOUD_NAME=your-cloudinary-name
VITE_CLOUDINARY_UPLOAD_PRESET=your-preset
VITE_RESEND_API_KEY=your-resend-key

# Sentry (Optional)
VITE_SENTRY_DSN=your-sentry-dsn

# Environment
VITE_APP_ENV=production
EOF
```

**Backend Environment (functions/.env):**
```bash
cd functions
cat > .env << 'EOF'
# Firebase Admin (auto-configured, but can set service account)
FIREBASE_CONFIG=auto

# Email Service
RESEND_API_KEY=your-resend-api-key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Webhook Secrets
WEBHOOK_SECRET=generate-random-secure-string

# Sentry
SENTRY_DSN=your-backend-sentry-dsn

# CORS Origins
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
EOF
cd ..
```

### Step 2: Firebase CLI Login

```bash
firebase login
# Opens browser for authentication
# Log in with your Google account
```

### Step 3: Initialize Firebase in Project

```bash
firebase init

# Select:
# - Firestore
# - Functions
# - Hosting
# - Storage

# Firestore: Use existing firestore.rules and firestore.indexes.json
# Functions: Use existing functions/ directory, JavaScript, ESLint yes
# Hosting: Use dist/ as public directory, configure as SPA (rewrite all to index.html)
# Storage: Use existing storage.rules
```

### Step 4: Configure Firebase JSON

**Verify firebase.json:**
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions",
    "predeploy": [
      "npm --prefix \"$RESOURCE_DIR\" run build"
    ]
  },
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

---

## 4. Frontend Deployment

### Step 1: Build Frontend

```bash
# Set environment
export NODE_ENV=production

# Build
npm run build

# Verify build
ls -la dist/
# Should see: index.html, assets/, etc.
```

### Step 2: Test Build Locally

```bash
# Install serve globally
npm install -g serve

# Serve locally
serve -s dist -p 3000

# Open http://localhost:3000
# Verify the app loads correctly
```

### Step 3: Deploy to Firebase Hosting

```bash
# Deploy hosting only
firebase deploy --only hosting

# Expected output:
# ✔  Deploy complete!
# Hosting URL: https://your-project.web.app
```

### Step 4: Verify Deployment

1. Open the hosting URL
2. Check console for errors
3. Verify Firebase connection
4. Test authentication

---

## 5. Backend Deployment

### Step 1: Deploy Firestore Rules and Indexes

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Wait for indexes to build (can take 10-30 minutes)
```

### Step 2: Deploy Storage Rules

```bash
firebase deploy --only storage
```

### Step 3: Deploy Cloud Functions

**Important: Set environment variables first**

```bash
cd functions

# Set environment variables for Cloud Functions
firebase functions:config:set \
  resend.api_key="your-resend-key" \
  cloudinary.cloud_name="your-cloud-name" \
  cloudinary.api_key="your-api-key" \
  cloudinary.api_secret="your-secret" \
  webhook.secret="your-webhook-secret"

# Deploy functions
cd ..
firebase deploy --only functions

# This may take 5-15 minutes
```

### Step 4: Verify Functions Deployment

```bash
# List deployed functions
firebase functions:list

# Expected functions:
# - api
# - onUserCreate
# - onProjectCreate
# - onEventCreate
# - onDonationCreate
# - scheduledBackup
# - analyticsProcessor
```

---

## 6. Post-Deployment Testing

### Step 1: Verify Services

**Check Firebase Console:**
1. Authentication → Users (should be empty initially)
2. Firestore → Data (collections should exist)
3. Storage → Files (buckets should be configured)
4. Functions → Dashboard (all functions should show "Healthy")

### Step 2: Test API Endpoints

```bash
# Get your functions URL
FUNCTIONS_URL="https://us-central1-your-project.cloudfunctions.net"

# Test health endpoint
curl "${FUNCTIONS_URL}/api/health"
# Expected: {"status":"ok","timestamp":"..."}

# Test API routes
curl "${FUNCTIONS_URL}/api/projects"
# Should return projects array (may be empty)
```

### Step 3: Test Authentication

1. Go to your deployed app
2. Click "Sign Up"
3. Register new account
4. Verify email received (if email configured)
5. Log in with credentials
6. Check Firebase Console → Authentication → Users

---

## 7. Manual Testing Procedures

### 🧪 Test Suite 1: Authentication

**Test 1.1: User Registration**
- [ ] Navigate to /register
- [ ] Fill all required fields
- [ ] Submit form
- [ ] Verify success message
- [ ] Check email for verification
- [ ] Verify user in Firebase Console

**Test 1.2: User Login**
- [ ] Navigate to /login
- [ ] Enter credentials
- [ ] Submit
- [ ] Verify redirect to dashboard
- [ ] Check user session persists on reload

**Test 1.3: Password Reset**
- [ ] Click "Forgot Password"
- [ ] Enter email
- [ ] Check email received
- [ ] Click reset link
- [ ] Enter new password
- [ ] Login with new password

**Test 1.4: Logout**
- [ ] Click logout button
- [ ] Verify redirect to home
- [ ] Verify session cleared
- [ ] Try accessing protected route

### 🧪 Test Suite 2: Projects

**Test 2.1: Create Project (NGO User)**
- [ ] Login as NGO user
- [ ] Navigate to "Create Project"
- [ ] Fill all fields (title, description, location, etc.)
- [ ] Upload project image
- [ ] Set start/end dates
- [ ] Add required volunteers count
- [ ] Submit
- [ ] Verify project appears in dashboard
- [ ] Check Firestore for project document

**Test 2.2: View Projects**
- [ ] Navigate to /projects
- [ ] Verify projects list displays
- [ ] Click on a project
- [ ] Verify details page shows all info
- [ ] Check map location (if enabled)

**Test 2.3: Apply to Project (Volunteer)**
- [ ] Login as volunteer
- [ ] Find a project
- [ ] Click "Apply"
- [ ] Fill application form
- [ ] Submit
- [ ] Verify application status
- [ ] Check notifications

**Test 2.4: Approve Application (NGO)**
- [ ] Login as NGO
- [ ] Navigate to project applications
- [ ] View application details
- [ ] Approve/reject application
- [ ] Verify volunteer notified

### 🧪 Test Suite 3: Events

**Test 3.1: Create Event**
- [ ] Login as NGO
- [ ] Navigate to "Create Event"
- [ ] Fill event details
- [ ] Set date/time
- [ ] Add capacity limit
- [ ] Upload event banner
- [ ] Submit
- [ ] Verify event created

**Test 3.2: Register for Event**
- [ ] Login as volunteer
- [ ] Browse events
- [ ] Click "Register"
- [ ] Confirm registration
- [ ] Verify confirmation email
- [ ] Check event in "My Events"

**Test 3.3: Event Check-in**
- [ ] On event day
- [ ] Login as NGO
- [ ] Open event dashboard
- [ ] Mark attendees present
- [ ] Verify attendance recorded

### 🧪 Test Suite 4: File Uploads

**Test 4.1: Profile Picture**
- [ ] Navigate to profile settings
- [ ] Click "Change Profile Picture"
- [ ] Select image file
- [ ] Upload
- [ ] Verify image displayed
- [ ] Check Firebase Storage bucket

**Test 4.2: Project Images**
- [ ] Create/edit project
- [ ] Upload project image
- [ ] Verify image shows in preview
- [ ] Save project
- [ ] Verify image persists

**Test 4.3: Documents**
- [ ] Upload NGO verification documents
- [ ] Verify file size limits work
- [ ] Check allowed file types
- [ ] Verify upload progress

### 🧪 Test Suite 5: Notifications

**Test 5.1: In-App Notifications**
- [ ] Trigger notification event (e.g., application approval)
- [ ] Check notification bell icon
- [ ] Open notifications panel
- [ ] Verify notification appears
- [ ] Click notification
- [ ] Verify navigation to relevant page

**Test 5.2: Email Notifications**
- [ ] Trigger email event
- [ ] Check email inbox
- [ ] Verify email received
- [ ] Check email formatting
- [ ] Verify links work

### 🧪 Test Suite 6: Search & Filters

**Test 6.1: Search Projects**
- [ ] Navigate to projects page
- [ ] Enter search term
- [ ] Verify results match search
- [ ] Try different keywords
- [ ] Test empty results

**Test 6.2: Filter Projects**
- [ ] Apply location filter
- [ ] Verify results filtered
- [ ] Apply category filter
- [ ] Apply date range
- [ ] Combine multiple filters
- [ ] Clear all filters

### 🧪 Test Suite 7: Dashboard

**Test 7.1: Volunteer Dashboard**
- [ ] Login as volunteer
- [ ] Verify stats display correctly
- [ ] Check "My Applications" section
- [ ] Check "Upcoming Events"
- [ ] Verify points/badges
- [ ] Test quick actions

**Test 7.2: NGO Dashboard**
- [ ] Login as NGO
- [ ] Verify organization stats
- [ ] Check "Active Projects"
- [ ] Check "Recent Applications"
- [ ] Verify analytics charts
- [ ] Test create shortcuts

**Test 7.3: Admin Dashboard**
- [ ] Login as admin
- [ ] Verify system-wide stats
- [ ] Check user management
- [ ] Check pending verifications
- [ ] Test admin actions

### 🧪 Test Suite 8: Analytics & Reports

**Test 8.1: View Analytics**
- [ ] Navigate to analytics page
- [ ] Verify charts load
- [ ] Check different time ranges
- [ ] Export data (CSV/PDF)
- [ ] Verify export downloads

**Test 8.2: Generate Reports**
- [ ] Select report type
- [ ] Set date range
- [ ] Generate report
- [ ] Verify data accuracy
- [ ] Download report
- [ ] Check format (PDF/Excel)

### 🧪 Test Suite 9: Mobile Responsiveness

**Test 9.1: Mobile Layout**
- [ ] Open on mobile device or use DevTools
- [ ] Navigate through all pages
- [ ] Verify responsive design
- [ ] Test forms on mobile
- [ ] Check image loading
- [ ] Verify navigation menu

**Test 9.2: PWA Features**
- [ ] Check "Add to Home Screen" prompt
- [ ] Install PWA
- [ ] Test offline functionality
- [ ] Verify app icon
- [ ] Test notifications on mobile

### 🧪 Test Suite 10: Performance

**Test 10.1: Load Times**
- [ ] Use Lighthouse in Chrome DevTools
- [ ] Check Performance score
- [ ] Verify initial load < 3 seconds
- [ ] Check Time to Interactive
- [ ] Test on slow 3G

**Test 10.2: Caching**
- [ ] Load page
- [ ] Refresh page
- [ ] Verify faster load on second visit
- [ ] Check Network tab for cached resources

---

## 8. Monitoring & Maintenance

### Firebase Console Monitoring

**Daily Checks:**
1. **Authentication**: Monitor user signups and activity
2. **Firestore**: Check database usage and reads/writes
3. **Functions**: Monitor function invocations and errors
4. **Storage**: Track storage usage
5. **Hosting**: Check traffic and bandwidth

**Weekly Checks:**
1. Review error logs
2. Check performance metrics
3. Monitor costs
4. Review security rules
5. Update indexes if needed

### Set Up Alerts

**Firebase Console → Project Settings → Service Accounts:**
```bash
# Set budget alerts
# - 50% of budget
# - 90% of budget
# - 100% of budget
```

### Sentry Error Tracking

**Setup:**
1. Go to [Sentry.io](https://sentry.io)
2. Create new project
3. Get DSN
4. Add to environment variables
5. Deploy updated code

**Monitor:**
- Real-time error alerts
- Error frequency
- User impact
- Stack traces

### Performance Monitoring

**Firebase Performance:**
```bash
# Enable in Firebase Console
# Monitor:
# - Page load times
# - Network requests
# - Custom traces
```

---

## 9. Troubleshooting

### Issue: Build Fails

**Error:** `npm run build` fails

**Solution:**
```bash
# Clear cache
rm -rf node_modules
rm package-lock.json
npm cache clean --force

# Reinstall
npm install

# Try build again
npm run build
```

### Issue: Functions Deployment Fails

**Error:** Functions fail to deploy

**Solution:**
```bash
# Check Node version
node --version  # Must be 20+

# Check functions build
cd functions
npm run build
# Fix any TypeScript errors

# Try deploying single function
firebase deploy --only functions:api

# Check logs
firebase functions:log
```

### Issue: Firestore Rules Error

**Error:** "Missing or insufficient permissions"

**Solution:**
```bash
# Review firestore.rules
# Ensure rules allow authenticated users

# Test rules in Firebase Console
# Firestore → Rules → Playground

# Redeploy rules
firebase deploy --only firestore:rules
```

### Issue: Storage Upload Fails

**Error:** File upload returns 403

**Solution:**
```bash
# Check storage.rules
# Ensure authenticated users can write

# Verify file size limits
# Default: 5MB, increase if needed

# Redeploy storage rules
firebase deploy --only storage
```

### Issue: Authentication Not Working

**Error:** Users can't log in

**Solution:**
1. Check Firebase Console → Authentication → Sign-in method
2. Verify Email/Password is enabled
3. Check authorized domains includes your hosting URL
4. Verify VITE_FIREBASE_* variables are correct
5. Check browser console for errors

### Issue: API Calls Fail

**Error:** 404 or CORS errors

**Solution:**
```bash
# Verify functions are deployed
firebase functions:list

# Check CORS configuration in functions
# Add your hosting domain to allowed origins

# Redeploy functions
firebase deploy --only functions
```

### Issue: Email Not Sending

**Error:** Emails not received

**Solution:**
1. Check Resend API key is valid
2. Verify sender email is verified in Resend
3. Check spam folder
4. Review Cloud Functions logs:
   ```bash
   firebase functions:log --only sendEmail
   ```
5. Verify RESEND_API_KEY environment variable

---

## 10. Rollback Procedures

### Quick Rollback

**If deployment has issues:**

```bash
# Rollback hosting to previous version
firebase hosting:rollback

# Rollback functions
# Note: There's no automatic rollback for functions
# You need to redeploy the previous version

# Get previous code
git checkout <previous-commit-hash>

# Redeploy
firebase deploy --only functions
```

### Full Rollback

**Step 1: Revert Code**
```bash
git log --oneline  # Find previous working commit
git checkout <commit-hash>
```

**Step 2: Rebuild**
```bash
npm ci
npm run build
```

**Step 3: Redeploy**
```bash
firebase deploy
```

**Step 4: Verify**
- Test critical functionality
- Check logs for errors
- Monitor for issues

---

## 11. Security Checklist

### Before Going Live

- [ ] All Firebase rules are production-ready (no test mode)
- [ ] Environment variables don't contain sensitive data in frontend
- [ ] API keys are restricted (Firebase Console → Project Settings)
- [ ] CORS is properly configured
- [ ] HTTPS is enforced
- [ ] Content Security Policy headers are set
- [ ] Rate limiting is enabled
- [ ] Input validation is implemented
- [ ] File upload restrictions are in place
- [ ] SQL injection prevention (though using Firestore)
- [ ] XSS prevention measures
- [ ] Authentication token expiration is set
- [ ] Password requirements are enforced
- [ ] Two-factor authentication available (optional)

---

## 12. Cost Optimization

### Firebase Spark Plan (Free Tier)

**Limits:**
- Firestore: 1GB storage, 50K reads/day, 20K writes/day
- Functions: 2M invocations/month
- Hosting: 10GB storage, 360MB/day transfer
- Authentication: Unlimited

**Estimated Users:** 100-500 users comfortably

### Firebase Blaze Plan (Pay-as-you-go)

**With Optimizations (caching, query limits):**
- 100-500 users: $0.50-1.00/month
- 1,000-2,000 users: $2-5/month
- 5,000+ users: $10-20/month

**Cost Reduction Tips:**
1. Implement query `.limit()` in all Firestore queries
2. Enable caching for frequently accessed data
3. Use CDN for static assets (Cloudinary free tier)
4. Compress images before upload
5. Monitor daily to catch spikes
6. Set budget alerts in Firebase Console

---

## 13. Production Checklist

### Pre-Launch

- [ ] All features tested manually
- [ ] Performance tested (Lighthouse score > 85)
- [ ] Security audit completed
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Error tracking active
- [ ] Documentation complete
- [ ] Team trained on operations
- [ ] Support process defined
- [ ] Incident response plan ready

### Launch Day

- [ ] Deploy to production
- [ ] Verify all services
- [ ] Test critical user flows
- [ ] Monitor error logs
- [ ] Watch performance metrics
- [ ] Check user feedback channels
- [ ] Have rollback plan ready

### Post-Launch (First Week)

- [ ] Daily log reviews
- [ ] User feedback collection
- [ ] Performance monitoring
- [ ] Cost tracking
- [ ] Bug fixes as needed
- [ ] Quick iterations
- [ ] User support

---

## 14. Contact & Support

### For Issues

1. **Check logs first:**
   ```bash
   firebase functions:log
   ```

2. **Check Firebase Console:**
   - Authentication issues
   - Firestore errors
   - Function failures

3. **Review this guide**

4. **Check documentation:**
   - Firebase docs: https://firebase.google.com/docs
   - React docs: https://react.dev
   - Vite docs: https://vitejs.dev

---

## 15. Appendix

### A. Common Commands Reference

```bash
# Firebase
firebase login
firebase logout
firebase projects:list
firebase use <project-id>
firebase deploy
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore
firebase hosting:rollback
firebase functions:log
firebase functions:config:get
firebase functions:config:set key="value"

# NPM
npm ci                    # Clean install
npm install              # Install dependencies
npm run build            # Production build
npm run dev              # Development server
npm test                 # Run tests
npm run lint             # Lint code

# Git
git status
git add .
git commit -m "message"
git push origin main
git pull origin main
git checkout -b branch-name
git log --oneline

# Node/NPM
node --version
npm --version
nvm use 20              # Switch Node version
```

### B. Environment Variables Template

**Complete .env.production:**
```env
# Firebase
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

# API
VITE_API_BASE_URL=

# Services
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
VITE_RESEND_API_KEY=
VITE_SENTRY_DSN=

# App
VITE_APP_ENV=production
VITE_APP_NAME=Wasilah
VITE_APP_URL=https://yourdomain.com
```

### C. Firestore Indexes

**If indexes fail to build automatically:**

1. Go to Firebase Console → Firestore → Indexes
2. Click "Add index"
3. Create composite indexes for:
   - Projects: `status + createdAt`
   - Events: `status + date`
   - Users: `role + status`
   - Applications: `projectId + status`

### D. Useful Links

- **Firebase Console:** https://console.firebase.google.com
- **Firebase Docs:** https://firebase.google.com/docs
- **Firebase Status:** https://status.firebase.google.com
- **Cloudinary Console:** https://cloudinary.com/console
- **Resend Dashboard:** https://resend.com/dashboard
- **Sentry Dashboard:** https://sentry.io

---

## 📞 Final Notes

This guide covers the complete deployment process for Wasilah platform (Segments 13-24). Follow each step carefully, test thoroughly, and monitor closely after deployment.

**Remember:**
- Always test in development before production
- Keep backups of your database
- Monitor costs daily initially
- Document any custom configurations
- Keep team informed of changes

**Good luck with your deployment! 🚀**

---

*Last Updated: November 2024*  
*Version: 1.0*  
*Maintained by: Development Team*
