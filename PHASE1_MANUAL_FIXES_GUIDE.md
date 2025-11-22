# Phase 1 Manual Fixes Guide

## Overview
This guide provides step-by-step instructions for manually fixing issues that require local environment access or careful dependency management.

---

## 1. NPM Security Vulnerabilities

### Frontend Vulnerabilities

**Issue:** xlsx package has 2 high-severity vulnerabilities
- CVE-2024-XXXX: Prototype Pollution in sheetJS (CVSS 7.8)
- CVE-2024-XXXX: Regular Expression Denial of Service (CVSS 7.5)

**Current Version:** xlsx@* (any version)
**Required Action:** Update to xlsx@0.20.2 or higher

### Steps to Fix:

```bash
# Navigate to project root
cd /home/runner/work/wasillahemail/wasillahemail

# Update xlsx package
npm update xlsx@latest

# If that doesn't work, force update
npm install xlsx@latest --save

# Verify the fix
npm audit

# Run tests to ensure nothing broke
npm test
npm run build
```

### Backend Vulnerabilities

**Issue:** Multiple critical vulnerabilities in functions directory

### Steps to Fix:

```bash
# Navigate to functions directory
cd functions

# Check vulnerabilities
npm audit

# Attempt automatic fix
npm audit fix

# For vulnerabilities requiring breaking changes
npm audit fix --force

# WARNING: --force may break compatibility
# Test thoroughly after running

# Verify fixes
npm audit

# Run backend tests
npm test
npm run build
```

### Post-Fix Verification

After fixing npm vulnerabilities, verify:

1. **Frontend Build:** `npm run build` (should complete successfully)
2. **Backend Build:** `cd functions && npm run build` (should complete successfully)
3. **Type Checking:** No new TypeScript errors introduced
4. **Functionality:** Test critical features:
   - Excel export in reporting
   - All API endpoints
   - File uploads/downloads

### Rollback Plan

If updates break functionality:

```bash
# Revert package.json and package-lock.json
git checkout HEAD -- package.json package-lock.json

# Reinstall previous versions
npm install

# For backend
cd functions
git checkout HEAD -- package.json package-lock.json
npm install
```

---

## 2. Additional Security Hardening

### Content Security Policy (CSP)

Add CSP headers to `index.html`:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https://res.cloudinary.com; 
               connect-src 'self' https://*.googleapis.com https://*.firebaseio.com;">
```

### HTTPS Enforcement

Ensure Firebase hosting config enforces HTTPS in `firebase.json`:

```json
{
  "hosting": {
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Strict-Transport-Security",
            "value": "max-age=31536000; includeSubDomains"
          }
        ]
      }
    ]
  }
}
```

---

## 3. Monitoring Setup (Sentry)

### Installation

```bash
npm install @sentry/react @sentry/tracing
```

### Configuration

Create `src/config/sentry.ts`:

```typescript
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

export function initSentry() {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [new BrowserTracing()],
      tracesSampleRate: 0.1,
      environment: import.meta.env.MODE,
    });
  }
}
```

Add to `src/main.tsx`:

```typescript
import { initSentry } from './config/sentry';

initSentry();
```

---

## 4. Environment Variables

Add to `.env.local`:

```env
VITE_SENTRY_DSN=your_sentry_dsn_here
```

---

## 5. Firebase Security Rules Update

Deploy updated Firestore rules:

```bash
firebase deploy --only firestore:rules
```

---

## 6. Verification Checklist

After completing manual fixes:

- [ ] All npm vulnerabilities resolved (run `npm audit`)
- [ ] Frontend builds successfully
- [ ] Backend builds successfully  
- [ ] No new TypeScript errors
- [ ] Critical features tested
- [ ] Sentry initialized (if applicable)
- [ ] CSP headers added
- [ ] Firebase rules deployed
- [ ] Production deployment tested

---

## Support

If you encounter issues:
1. Check error messages carefully
2. Verify Node.js version compatibility
3. Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
4. Check Firebase console for deployment errors
5. Review commit history for recent changes

---

**Last Updated:** 2025-11-21  
**Status:** Ready for implementation
