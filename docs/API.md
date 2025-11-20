# Wasilah Platform REST API Documentation

**Version:** 1.0.0  
**Base URL:** `https://us-central1-[your-project].cloudfunctions.net/api`  
**Authentication:** Firebase Auth ID Token (Bearer)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Rate Limiting](#rate-limiting)
3. [Error Handling](#error-handling)
4. [Projects API](#projects-api)
5. [Events API](#events-api)
6. [NGOs API](#ngos-api)
7. [Users API](#users-api)
8. [Analytics API](#analytics-api)
9. [Webhooks API](#webhooks-api)
10. [Admin API](#admin-api)

---

## Authentication

All API requests require authentication using Firebase Auth ID tokens.

### Getting an ID Token

```javascript
const user = firebase.auth().currentUser;
const token = await user.getIdToken();
```

### Including the Token

Add the token to the `Authorization` header:

```
Authorization: Bearer <your-id-token>
```

### Token Expiration

ID tokens expire after 1 hour. Refresh tokens automatically in your client.

---

## Rate Limiting

Rate limits are enforced per user role:

| Role | Requests per Hour | Burst |
|------|-------------------|-------|
| Volunteer | 100 | 10 |
| NGO | 500 | 50 |
| Admin | 1000 | 100 |

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1637251200
```

### Rate Limit Exceeded

**Status:** `429 Too Many Requests`

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 60 seconds.",
    "retryAfter": 60
  }
}
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {},
    "statusCode": 400
  }
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Projects API

### List Projects

**GET** `/projects`

Retrieve a paginated list of projects.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1) |
| `perPage` | number | No | Items per page (default: 10, max: 100) |
| `status` | string[] | No | Filter by status: draft, pending, approved, rejected |
| `search` | string | No | Search in title and description |
| `category` | string | No | Filter by category |
| `location` | string | No | Filter by location |

**Example Request:**

```bash
curl -X GET "https://api.wasilah.com/projects?page=1&perPage=20&status=approved" \
  -H "Authorization: Bearer <token>"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "proj_123",
        "title": "Beach Cleanup Drive",
        "description": "Join us for a beach cleanup event",
        "category": "Environment",
        "location": "Karachi",
        "status": "approved",
        "submittedBy": "user_456",
        "submittedAt": "2024-11-20T10:00:00Z",
        "startDate": "2024-12-01T09:00:00Z",
        "endDate": "2024-12-01T15:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "perPage": 20,
      "total": 45,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### Get Project by ID

**GET** `/projects/:id`

Retrieve a single project by ID.

**Example Request:**

```bash
curl -X GET "https://api.wasilah.com/projects/proj_123" \
  -H "Authorization: Bearer <token>"
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "proj_123",
    "title": "Beach Cleanup Drive",
    "description": "Detailed description...",
    "category": "Environment",
    "location": "Karachi",
    "status": "approved",
    "requirements": ["Gloves", "Garbage bags"],
    "contactInfo": {
      "email": "contact@example.com",
      "phone": "+92-300-1234567"
    },
    "submittedBy": "user_456",
    "submittedAt": "2024-11-20T10:00:00Z"
  }
}
```

---

### Create Project

**POST** `/projects`

Create a new project. Requires authentication.

**Request Body:**

```json
{
  "title": "Beach Cleanup Drive",
  "description": "Join us for a beach cleanup event",
  "category": "Environment",
  "location": "Karachi",
  "startDate": "2024-12-01T09:00:00Z",
  "endDate": "2024-12-01T15:00:00Z",
  "requirements": ["Gloves", "Garbage bags"],
  "contactInfo": {
    "email": "contact@example.com",
    "phone": "+92-300-1234567"
  }
}
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "id": "proj_789",
    "title": "Beach Cleanup Drive",
    "status": "pending",
    "submittedAt": "2024-11-20T10:00:00Z"
  },
  "message": "Project created successfully. Pending approval."
}
```

---

### Update Project

**PATCH** `/projects/:id`

Update an existing project. Only owner or admin can update.

**Request Body:**

```json
{
  "title": "Updated Beach Cleanup Drive",
  "description": "Updated description"
}
```

---

### Delete Project

**DELETE** `/projects/:id`

Delete a project. Only owner or admin can delete.

**Example Response:**

```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

---

### Approve Project

**POST** `/projects/:id/approve`

Approve a pending project. Admin only.

**Request Body:**

```json
{
  "reason": "Meets all requirements"
}
```

---

### Reject Project

**POST** `/projects/:id/reject`

Reject a pending project. Admin only.

**Request Body:**

```json
{
  "reason": "Missing required information"
}
```

---

## Events API

### List Events

**GET** `/events`

Similar to projects API with event-specific filters.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number |
| `perPage` | number | No | Items per page |
| `status` | string[] | No | Filter by status |
| `projectId` | string | No | Filter by project |
| `dateFrom` | string | No | Filter events from date (ISO 8601) |
| `dateTo` | string | No | Filter events to date (ISO 8601) |

---

### Get Event by ID

**GET** `/events/:id`

---

### Create Event

**POST** `/events`

**Request Body:**

```json
{
  "title": "Beach Cleanup Event",
  "description": "Event description",
  "eventType": "cleanup",
  "location": "Clifton Beach, Karachi",
  "startTime": "2024-12-01T09:00:00Z",
  "endTime": "2024-12-01T15:00:00Z",
  "capacity": 50,
  "projectId": "proj_123"
}
```

---

### Update Event

**PATCH** `/events/:id`

---

### Delete Event

**DELETE** `/events/:id`

---

### Approve Event

**POST** `/events/:id/approve`

---

### Reject Event

**POST** `/events/:id/reject`

---

## NGOs API

### List NGOs

**GET** `/ngos`

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number |
| `perPage` | number | No | Items per page |
| `isVerified` | boolean | No | Filter by verification status |
| `location` | string | No | Filter by location |

---

### Get NGO by ID

**GET** `/ngos/:id`

---

### Create NGO

**POST** `/ngos`

**Request Body:**

```json
{
  "organizationName": "Pakistan Relief Foundation",
  "description": "NGO description",
  "registrationNumber": "REG-12345",
  "contactInfo": {
    "email": "info@prf.org",
    "phone": "+92-21-1234567"
  },
  "address": {
    "street": "123 Main St",
    "city": "Karachi",
    "province": "Sindh",
    "country": "Pakistan"
  }
}
```

---

### Update NGO

**PATCH** `/ngos/:id`

---

### Delete NGO

**DELETE** `/ngos/:id`

---

### Verify NGO

**POST** `/ngos/:id/verify`

Verify an NGO. Admin only.

---

## Users API

### List Users

**GET** `/users`

Admin only.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number |
| `perPage` | number | No | Items per page |
| `role` | string | No | Filter by role: volunteer, ngo, admin |
| `isActive` | boolean | No | Filter by active status |

---

### Get User by ID

**GET** `/users/:id`

Users can view their own profile. Admin can view all.

---

### Get Current User

**GET** `/users/me`

Get the authenticated user's profile.

---

### Update User

**PATCH** `/users/:id`

Users can update their own profile. Admin can update all.

**Request Body:**

```json
{
  "displayName": "John Doe",
  "bio": "Passionate about volunteering",
  "skills": ["Teaching", "Community Work"]
}
```

---

### Delete User

**DELETE** `/users/:id`

Admin only.

---

## Analytics API

### Platform Statistics

**GET** `/analytics/platform`

Get platform-wide statistics. Admin only.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dateFrom` | string | No | Start date (ISO 8601) |
| `dateTo` | string | No | End date (ISO 8601) |
| `groupBy` | string | No | Group by: day, week, month |

**Example Response:**

```json
{
  "success": true,
  "data": {
    "totalUsers": 1250,
    "totalProjects": 145,
    "totalEvents": 87,
    "totalNgos": 32,
    "activeProjects": 28,
    "completedProjects": 98,
    "upcomingEvents": 15,
    "totalVolunteers": 1100,
    "growthMetrics": {
      "usersGrowth": 12.5,
      "projectsGrowth": 8.3,
      "eventsGrowth": 15.2
    }
  }
}
```

---

### Project Analytics

**GET** `/analytics/projects`

Get project-specific analytics.

---

### Event Analytics

**GET** `/analytics/events`

Get event-specific analytics.

---

### User Analytics

**GET** `/analytics/users`

Get user engagement analytics.

---

### Custom Analytics

**GET** `/analytics/custom/:metric`

Get custom metric analytics.

---

## Webhooks API

### List Webhooks

**GET** `/webhooks`

List all webhooks configured by the authenticated user.

---

### Get Webhook by ID

**GET** `/webhooks/:id`

---

### Create Webhook

**POST** `/webhooks`

**Request Body:**

```json
{
  "url": "https://your-server.com/webhook",
  "events": [
    "project.created",
    "project.approved",
    "event.created"
  ],
  "isActive": true
}
```

**Supported Events:**

- `project.created`, `project.updated`, `project.deleted`, `project.approved`, `project.rejected`
- `event.created`, `event.updated`, `event.deleted`, `event.approved`, `event.rejected`
- `application.submitted`, `application.approved`, `application.rejected`
- `registration.submitted`, `registration.approved`, `registration.rejected`
- `user.created`, `user.updated`, `user.deleted`
- `donation.received`
- `subscription.created`, `subscription.updated`

---

### Update Webhook

**PATCH** `/webhooks/:id`

---

### Delete Webhook

**DELETE** `/webhooks/:id`

---

### Get Webhook Deliveries

**GET** `/webhooks/:id/deliveries`

Get delivery history for a webhook.

**Example Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "del_123",
        "webhookId": "wh_456",
        "event": "project.created",
        "status": "delivered",
        "attemptCount": 1,
        "deliveredAt": "2024-11-20T10:00:00Z",
        "responseCode": 200
      }
    ],
    "pagination": {
      "page": 1,
      "perPage": 20,
      "total": 50
    }
  }
}
```

---

### Test Webhook

**POST** `/webhooks/:id/test`

Send a test payload to the webhook URL.

---

## Admin API

### Platform Statistics

**GET** `/admin/stats`

Get comprehensive platform statistics. Admin only.

---

### System Health

**GET** `/admin/health`

Check system health status. Admin only.

**Example Response:**

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 99.99,
    "lastCheck": "2024-11-20T10:00:00Z",
    "services": {
      "firestore": "operational",
      "auth": "operational",
      "storage": "operational",
      "functions": "operational"
    }
  }
}
```

---

### Moderation Queue

**GET** `/admin/moderation`

Get pending moderation items. Admin only.

**Example Response:**

```json
{
  "success": true,
  "data": {
    "projects": 12,
    "events": 8,
    "users": 3,
    "reports": 5
  }
}
```

---

### Bulk Operations

**POST** `/admin/bulk`

Perform bulk operations on resources. Admin only.

**Request Body:**

```json
{
  "operation": "approve",
  "resourceType": "project",
  "resourceIds": ["proj_123", "proj_456", "proj_789"],
  "reason": "Batch approval"
}
```

---

## Webhook Payload Format

All webhook deliveries include:

```json
{
  "event": "project.created",
  "timestamp": "2024-11-20T10:00:00Z",
  "data": {
    "id": "proj_123",
    "title": "Beach Cleanup Drive",
    "status": "pending"
  },
  "signature": "sha256=abc123..."
}
```

### Verifying Webhook Signatures

Webhooks are signed using HMAC-SHA256:

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}
```

---

## Pagination

All list endpoints support pagination:

**Query Parameters:**
- `page` - Page number (default: 1, min: 1)
- `perPage` - Items per page (default: 10, min: 1, max: 100)

**Response includes:**
```json
{
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Filtering and Sorting

**Query Parameters:**
- `sortBy` - Field to sort by
- `sortOrder` - Sort order: `asc` or `desc`
- `search` - Search query (searches title, description)
- `status` - Filter by status (comma-separated for multiple)
- `dateFrom` - Filter from date (ISO 8601)
- `dateTo` - Filter to date (ISO 8601)
- `tags` - Filter by tags (comma-separated)
- `categories` - Filter by categories (comma-separated)

---

## Client Libraries

### JavaScript/TypeScript

```bash
npm install @wasilah/api-client
```

```typescript
import { ApiClient } from '@wasilah/api-client';

const client = new ApiClient({
  baseURL: 'https://api.wasilah.com',
  auth: firebaseAuth
});

const projects = await client.projects.list({
  page: 1,
  perPage: 20,
  status: ['approved']
});
```

### Python

```bash
pip install wasilah-api
```

```python
from wasilah import WasilahClient

client = WasilahClient(
    base_url='https://api.wasilah.com',
    token='your-firebase-token'
)

projects = client.projects.list(
    page=1,
    per_page=20,
    status=['approved']
)
```

---

## Best Practices

1. **Authentication**: Always include valid Firebase Auth tokens
2. **Rate Limiting**: Implement exponential backoff for rate limit errors
3. **Error Handling**: Handle all error codes appropriately
4. **Pagination**: Use pagination for large datasets
5. **Webhooks**: Verify webhook signatures to ensure authenticity
6. **Caching**: Cache responses when appropriate to reduce API calls
7. **Idempotency**: Use idempotent operations for critical actions

---

## Support

- **Documentation**: https://docs.wasilah.com
- **API Status**: https://status.wasilah.com
- **Support Email**: support@wasilah.com
- **GitHub Issues**: https://github.com/wasilah/api/issues

---

**Last Updated:** November 20, 2024  
**Version:** 1.0.0
