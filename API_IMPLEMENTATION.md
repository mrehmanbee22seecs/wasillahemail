# REST API Implementation Guide

## Overview

This guide covers the complete implementation of the Wasilah Platform REST API using Firebase Cloud Functions. The API provides programmatic access to all platform resources with authentication, rate limiting, validation, and webhooks.

## Table of Contents

1. [Architecture](#architecture)
2. [Prerequisites](#prerequisites)
3. [Setup](#setup)
4. [Project Structure](#project-structure)
5. [Authentication](#authentication)
6. [Middleware](#middleware)
7. [Endpoints](#endpoints)
8. [Webhooks](#webhooks)
9. [Deployment](#deployment)
10. [Testing](#testing)
11. [Monitoring](#monitoring)

---

## Architecture

### Technology Stack

- **Runtime:** Node.js 20
- **Framework:** Express.js
- **Authentication:** Firebase Auth
- **Database:** Cloud Firestore
- **Hosting:** Firebase Cloud Functions (Gen 2)
- **Language:** TypeScript

### Request Flow

```
Client Request
    ↓
Firebase Functions (HTTPS Trigger)
    ↓
Authentication Middleware (verify Firebase token)
    ↓
Rate Limiting Middleware (check quotas)
    ↓
Validation Middleware (validate request data)
    ↓
Route Handler (business logic)
    ↓
Response (JSON)
```

### Webhook Flow

```
Firestore Trigger (document change)
    ↓
Webhook Service (find registered webhooks)
    ↓
Build Payload (event data + signature)
    ↓
HTTP POST to webhook URL
    ↓
Retry on Failure (exponential backoff)
    ↓
Log Delivery Status
```

---

## Prerequisites

1. **Firebase Project** with Blaze (Pay as you go) plan
2. **Node.js 20+** and npm
3. **Firebase CLI** installed globally
4. **TypeScript** knowledge
5. **Firestore** database enabled
6. **Firebase Auth** enabled

### Install Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

---

## Setup

### 1. Initialize Firebase Functions

```bash
cd /path/to/wasillahemail
firebase init functions
```

Select:
- Language: **TypeScript**
- ESLint: **Yes**
- Install dependencies: **Yes**

### 2. Update Functions Package.json

Edit `functions/package.json`:

```json
{
  "name": "functions",
  "description": "Cloud Functions for Wasilah API",
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "firebase functions:shell",
    "start": "npm run shell",
    "deploy": "npm run build && firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "20"
  },
  "main": "lib/index.js",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "firebase-admin": "^11.11.1",
    "firebase-functions": "^4.5.0",
    "express-rate-limit": "^7.1.5",
    "express-validator": "^7.0.1",
    "axios": "^1.6.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.10.6",
    "typescript": "^5.3.3",
    "firebase-functions-test": "^3.1.0"
  },
  "private": true
}
```

### 3. Install Dependencies

```bash
cd functions
npm install
```

### 4. Configure TypeScript

Update `functions/tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "outDir": "lib",
    "sourceMap": true,
    "strict": true,
    "target": "ES2020",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "compileOnSave": true,
  "include": ["src"]
}
```

---

## Project Structure

```
functions/
├── src/
│   ├── index.ts                 # Main entry point
│   ├── api/
│   │   ├── config/
│   │   │   ├── api.config.ts    # API configuration
│   │   │   └── webhooks.config.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts          # Authentication
│   │   │   ├── rateLimiter.ts   # Rate limiting
│   │   │   ├── validator.ts     # Request validation
│   │   │   └── errorHandler.ts  # Error handling
│   │   ├── routes/
│   │   │   ├── index.ts         # Route aggregator
│   │   │   ├── projects.routes.ts
│   │   │   ├── events.routes.ts
│   │   │   ├── ngos.routes.ts
│   │   │   ├── users.routes.ts
│   │   │   ├── admin.routes.ts
│   │   │   └── webhooks.routes.ts
│   │   ├── endpoints/
│   │   │   ├── projects.ts      # Project handlers
│   │   │   ├── events.ts        # Event handlers
│   │   │   ├── ngos.ts          # NGO handlers
│   │   │   ├── users.ts         # User handlers
│   │   │   ├── admin.ts         # Admin handlers
│   │   │   ├── analytics.ts     # Analytics handlers
│   │   │   └── webhooks.ts      # Webhook handlers
│   │   ├── services/
│   │   │   ├── webhookService.ts
│   │   │   └── webhookSecurity.ts
│   │   ├── triggers/
│   │   │   └── webhookTriggers.ts
│   │   ├── types/
│   │   │   └── api.types.ts     # TypeScript types
│   │   └── utils/
│   │       ├── apiHelpers.ts    # Helper functions
│   │       └── responses.ts     # Response utilities
│   └── firebase.ts              # Firebase admin init
├── package.json
├── tsconfig.json
└── .env.example
```

---

## Authentication

### Middleware Implementation

```typescript
// functions/src/api/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

export interface AuthRequest extends Request {
  user?: admin.auth.DecodedIdToken;
  userId?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or invalid authorization header',
          statusCode: 401
        }
      });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.user = decodedToken;
    req.userId = decodedToken.uid;
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid authentication token',
        statusCode: 401
      }
    });
  }
};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.userId) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        statusCode: 401
      }
    });
  }

  try {
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(req.userId)
      .get();
    
    if (!userDoc.exists || !userDoc.data()?.isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin privileges required',
          statusCode: 403
        }
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Error verifying admin status',
        statusCode: 500
      }
    });
  }
};
```

---

## Middleware

### Rate Limiting

```typescript
// functions/src/api/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import { AuthRequest } from './auth';

export const createRateLimiter = (
  windowMs: number,
  max: number
) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: AuthRequest) => {
      return req.userId || req.ip || 'anonymous';
    },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
          statusCode: 429,
          retryAfter: Math.ceil(windowMs / 1000)
        }
      });
    }
  });
};

// Role-based rate limiters
export const volunteerRateLimit = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  100 // 100 requests
);

export const ngoRateLimit = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  500 // 500 requests
);

export const adminRateLimit = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  1000 // 1000 requests
);
```

### Request Validation

```typescript
// functions/src/api/middleware/validator.ts
import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: errors.array(),
        statusCode: 400
      }
    });
  }
  
  next();
};

// Validation rules for projects
export const createProjectValidation = [
  body('title').trim().isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description').trim().isLength({ min: 20, max: 5000 })
    .withMessage('Description must be between 20 and 5000 characters'),
  body('category').trim().notEmpty()
    .withMessage('Category is required'),
  body('location').trim().notEmpty()
    .withMessage('Location is required'),
  body('startDate').isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  validateRequest
];

export const updateProjectValidation = [
  param('id').trim().notEmpty()
    .withMessage('Project ID is required'),
  body('title').optional().trim().isLength({ min: 5, max: 100 }),
  body('description').optional().trim().isLength({ min: 20, max: 5000 }),
  validateRequest
];
```

### Error Handler

```typescript
// functions/src/api/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);
  
  const statusCode = error.statusCode || 500;
  const code = error.code || 'INTERNAL_ERROR';
  const message = error.message || 'An unexpected error occurred';
  
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    }
  });
};
```

---

## Endpoints

### Projects Endpoint Example

```typescript
// functions/src/api/endpoints/projects.ts
import * as admin from 'firebase-admin';
import { AuthRequest } from '../middleware/auth';
import { Response } from 'express';

const db = admin.firestore();

export const listProjects = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      perPage = 10,
      status,
      search,
      category,
      location
    } = req.query;

    let query = db.collection('project_submissions')
      .orderBy('submittedAt', 'desc');

    // Apply filters
    if (status) {
      query = query.where('status', '==', status);
    }
    if (category) {
      query = query.where('category', '==', category);
    }

    // Pagination
    const pageNum = parseInt(page as string, 10);
    const perPageNum = Math.min(parseInt(perPage as string, 10), 100);
    const offset = (pageNum - 1) * perPageNum;

    const snapshot = await query.limit(perPageNum + 1).offset(offset).get();
    const items = snapshot.docs.slice(0, perPageNum).map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const hasNext = snapshot.docs.length > perPageNum;

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          page: pageNum,
          perPage: perPageNum,
          hasNext,
          hasPrev: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error('List projects error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch projects',
        statusCode: 500
      }
    });
  }
};

export const getProjectById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('project_submissions').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Project not found',
          statusCode: 404
        }
      });
    }

    res.json({
      success: true,
      data: {
        id: doc.id,
        ...doc.data()
      }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch project',
        statusCode: 500
      }
    });
  }
};

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const projectData = {
      ...req.body,
      submittedBy: req.userId,
      status: 'pending',
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      isVisible: false
    };

    const docRef = await db.collection('project_submissions').add(projectData);

    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        status: 'pending'
      },
      message: 'Project created successfully. Pending approval.'
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create project',
        statusCode: 500
      }
    });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('project_submissions').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Project not found',
          statusCode: 404
        }
      });
    }

    // Check permissions
    const projectData = doc.data();
    const userDoc = await db.collection('users').doc(req.userId!).get();
    const isAdmin = userDoc.data()?.isAdmin || false;

    if (projectData?.submittedBy !== req.userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Not authorized to update this project',
          statusCode: 403
        }
      });
    }

    await db.collection('project_submissions').doc(id).update({
      ...req.body,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'Project updated successfully'
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update project',
        statusCode: 500
      }
    });
  }
};

export const approveProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await db.collection('project_submissions').doc(id).update({
      status: 'approved',
      isVisible: true,
      approvedBy: req.userId,
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      approvalReason: reason
    });

    res.json({
      success: true,
      message: 'Project approved successfully'
    });
  } catch (error) {
    console.error('Approve project error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to approve project',
        statusCode: 500
      }
    });
  }
};
```

---

## Webhooks

### Webhook Service

```typescript
// functions/src/api/services/webhookService.ts
import * as admin from 'firebase-admin';
import axios from 'axios';
import * as crypto from 'crypto';

const db = admin.firestore();

export interface WebhookPayload {
  event: string;
  timestamp: Date;
  data: any;
  signature: string;
}

export const deliverWebhook = async (
  webhookId: string,
  event: string,
  data: any
): Promise<boolean> => {
  try {
    const webhookDoc = await db.collection('webhooks').doc(webhookId).get();
    
    if (!webhookDoc.exists || !webhookDoc.data()?.isActive) {
      return false;
    }

    const webhook = webhookDoc.data()!;
    
    // Check if webhook is subscribed to this event
    if (!webhook.events.includes(event)) {
      return false;
    }

    // Build payload
    const payload: WebhookPayload = {
      event,
      timestamp: new Date(),
      data,
      signature: ''
    };

    // Sign payload
    const payloadString = JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(payloadString)
      .digest('hex');
    
    payload.signature = `sha256=${signature}`;

    // Deliver webhook
    const response = await axios.post(webhook.url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': payload.signature,
        'X-Webhook-Event': event
      },
      timeout: 10000 // 10 seconds
    });

    // Log successful delivery
    await db.collection('webhook_deliveries').add({
      webhookId,
      event,
      status: 'delivered',
      responseCode: response.status,
      attemptCount: 1,
      deliveredAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Webhook delivery error:', error);
    
    // Log failed delivery
    await db.collection('webhook_deliveries').add({
      webhookId,
      event,
      status: 'failed',
      error: (error as Error).message,
      attemptCount: 1,
      lastAttemptAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return false;
  }
};
```

### Firestore Triggers

```typescript
// functions/src/api/triggers/webhookTriggers.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { deliverWebhook } from '../services/webhookService';

const db = admin.firestore();

export const onProjectCreated = functions.firestore
  .document('project_submissions/{projectId}')
  .onCreate(async (snap, context) => {
    const projectData = snap.data();
    
    // Find all webhooks subscribed to project.created
    const webhooksSnapshot = await db
      .collection('webhooks')
      .where('events', 'array-contains', 'project.created')
      .where('isActive', '==', true)
      .get();

    const deliveryPromises = webhooksSnapshot.docs.map(doc =>
      deliverWebhook(doc.id, 'project.created', {
        id: snap.id,
        ...projectData
      })
    );

    await Promise.all(deliveryPromises);
  });

export const onProjectApproved = functions.firestore
  .document('project_submissions/{projectId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if status changed to approved
    if (before.status !== 'approved' && after.status === 'approved') {
      const webhooksSnapshot = await db
        .collection('webhooks')
        .where('events', 'array-contains', 'project.approved')
        .where('isActive', '==', true)
        .get();

      const deliveryPromises = webhooksSnapshot.docs.map(doc =>
        deliverWebhook(doc.id, 'project.approved', {
          id: change.after.id,
          ...after
        })
      );

      await Promise.all(deliveryPromises);
    }
  });
```

---

## Deployment

### 1. Configure Firebase

Update `firebase.json`:

```json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs20",
    "predeploy": ["npm --prefix \"$RESOURCE_DIR\" run build"]
  },
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "/api/**",
        "function": "api"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### 2. Set Environment Variables

```bash
# Set Firebase config
firebase functions:config:set \
  api.version="1.0.0" \
  api.baseurl="https://your-domain.com"

# View config
firebase functions:config:get
```

### 3. Deploy Functions

```bash
# Build
cd functions
npm run build

# Deploy all functions
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:api
```

### 4. Deploy with GitHub Actions

Create `.github/workflows/deploy-functions.yml`:

```yaml
name: Deploy Functions

on:
  push:
    branches: [main]
    paths:
      - 'functions/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: |
          cd functions
          npm ci
          
      - name: Build
        run: |
          cd functions
          npm run build
          
      - name: Deploy to Firebase
        uses: w9jds/firebase-action@master
        with:
          args: deploy --only functions
        env:
          FIREBASE_TOKEN: ${{ secrets.FIREBASE_TOKEN }}
```

---

## Testing

### Local Testing with Emulator

```bash
# Start emulators
firebase emulators:start

# Test API endpoint
curl http://localhost:5001/your-project/us-central1/api/projects
```

### Unit Tests

```typescript
// functions/src/api/__tests__/projects.test.ts
import * as admin from 'firebase-admin';
import * as test from 'firebase-functions-test';

const testEnv = test();

describe('Projects API', () => {
  afterAll(() => {
    testEnv.cleanup();
  });

  it('should list projects', async () => {
    // Test implementation
  });
});
```

---

## Monitoring

### Logs

```bash
# View recent logs
firebase functions:log

# Follow logs in real-time
firebase functions:log --only api

# View specific function logs
firebase functions:log --only api.listProjects
```

### Metrics

Monitor in Firebase Console:
- Invocations
- Execution time
- Error rate
- Memory usage
- Active instances

---

## Best Practices

1. **Use TypeScript** for type safety
2. **Implement proper error handling** at all levels
3. **Validate all inputs** before processing
4. **Use connection pooling** for Firestore
5. **Implement rate limiting** per user/role
6. **Log all errors** with context
7. **Use environment variables** for configuration
8. **Test with emulators** before deploying
9. **Monitor function metrics** regularly
10. **Keep functions small and focused**

---

## Troubleshooting

### Common Issues

**Issue:** CORS errors
- **Solution:** Add CORS middleware with proper configuration

**Issue:** Cold start latency
- **Solution:** Use Firebase Functions Gen 2 with min instances

**Issue:** Rate limit errors
- **Solution:** Implement client-side retry with exponential backoff

**Issue:** Authentication failures
- **Solution:** Verify token freshness and Firebase config

---

**Last Updated:** November 20, 2024  
**Version:** 1.0.0
