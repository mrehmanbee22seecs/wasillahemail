# Subscription System Documentation

## Overview

The Wasilah platform now includes a freemium subscription model that allows organizations to manage their projects and events with tiered access based on their subscription plan.

## Subscription Plans

### Free Plan
- **Cost**: Free forever
- **Limits**:
  - 1 Active Project
  - 2 Events per Project (2 total events)
- **Features**:
  - Basic Analytics
  - Community Support
  - Access to Knowledge Base
  - Basic project and event management

### Premium Plan
- **Cost**: Coming soon (optimized for Pakistan market)
- **Limits**: Unlimited projects and events
- **Features**:
  - All Free Plan features
  - Unlimited Projects
  - Unlimited Events
  - Advanced Analytics & Reports
  - Priority Email Support
  - Custom Branding
  - Data Export (CSV, Excel)
  - Early Access to New Features
  - Remove Wasilah Watermark

## Technical Implementation

### Architecture

1. **SubscriptionContext** (`src/contexts/SubscriptionContext.tsx`)
   - Manages subscription state globally
   - Tracks usage statistics
   - Provides quota checking functions
   - Handles plan upgrades/downgrades

2. **Feature Flags** (`src/utils/featureFlags.ts`)
   - Defines available features per plan
   - Provides feature availability checking
   - Centralized feature configuration

3. **UI Components** (`src/components/Subscription/`)
   - `PlanSelector.tsx`: Plan comparison and selection
   - `UsageDashboard.tsx`: Usage tracking and quota display
   - `UpgradePrompt.tsx`: Upgrade prompts and modals
   - `FeatureGate.tsx`: Conditional rendering based on plan

### Database Schema

#### Firestore Collections

**subscriptions** collection:
```typescript
{
  userId: string;
  plan: 'free' | 'premium';
  status: 'active' | 'inactive' | 'cancelled' | 'trial';
  startDate: Timestamp;
  endDate?: Timestamp;
  trialEndDate?: Timestamp;
  usage: {
    projectsCreated: number;
    eventsCreated: number;
    lastUpdated: Timestamp;
  };
  billingHistory: BillingRecord[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Usage Tracking

Usage is automatically tracked when:
- Projects are created (status = 'approved')
- Events are created (status = 'approved')
- Users access the usage dashboard

The system refreshes usage statistics:
- On subscription context initialization
- After successful project/event creation
- When manually triggered via refresh button

### Quota Enforcement

Limits are enforced at submission time in `CreateSubmission.tsx`:

1. **Project Creation**: Checks `canCreateProject`
2. **Event Creation**: Checks `canCreateEvent(projectId)`
3. **Admins**: Bypass all quota checks
4. **Drafts**: Not counted toward quotas

When limits are reached, an upgrade prompt is displayed.

## Integration Guide

### Using Subscription Context

```typescript
import { useSubscription } from '../contexts/SubscriptionContext';

function MyComponent() {
  const {
    subscription,      // Current subscription data
    planConfig,       // Current plan configuration
    usage,            // Usage statistics
    canCreateProject, // Boolean: can create project
    canCreateEvent,   // Function: check event creation
    checkFeature,     // Check feature availability
    getQuotaAlerts,   // Get quota warnings
    refreshUsage,     // Refresh usage stats
    upgradeToPremium, // Upgrade function
  } = useSubscription();
  
  // Use the values...
}
```

### Feature Gating

```typescript
import { FeatureGate } from '../components/FeatureGate';
import { FEATURES } from '../utils/featureFlags';

<FeatureGate feature={FEATURES.ADVANCED_ANALYTICS}>
  <AdvancedAnalytics />
</FeatureGate>
```

### Checking Quotas Before Actions

```typescript
// Check project quota
if (!canCreateProject) {
  setShowUpgradePrompt(true);
  return;
}

// Check event quota
const canCreate = await canCreateEvent(projectId);
if (!canCreate) {
  setShowUpgradePrompt(true);
  return;
}
```

## User Experience

### For Free Users

1. **Clear Limits**: Usage displayed on NGO Dashboard
2. **Progress Bars**: Visual indication of quota usage
3. **Warnings**: Alerts when approaching limits (80%+)
4. **Upgrade Prompts**: Clear CTAs when limits reached
5. **Graceful Degradation**: Existing projects/events remain accessible

### For Premium Users

1. **Unlimited Access**: No quotas on projects/events
2. **Premium Badge**: Visual indicator of premium status
3. **Advanced Features**: Access to premium-only features
4. **Priority Support**: Enhanced support options

## Payment Integration (Future)

Payment processing will be integrated with Pakistan-friendly options:
- JazzCash
- EasyPaisa
- Local bank transfers
- International credit/decard cards

Current implementation focuses on feature gating and usage tracking, with payment integration planned for future releases.

## Security

### Firestore Rules

Subscription data is protected by Firestore security rules:

```javascript
match /subscriptions/{userId} {
  // Users can read their own subscription
  allow read: if request.auth.uid == userId || isAdmin();
  
  // Users can create their own subscription
  allow create: if request.auth.uid == userId;
  
  // Users can update their own subscription
  allow update: if request.auth.uid == userId || isAdmin();
  
  // Only admins can delete
  allow delete: if isAdmin();
}
```

### Client-Side Validation

All quota checks are performed client-side first, then validated by Firestore rules:
- Usage counts verified via queries
- Admin bypass respected
- Draft submissions excluded from quotas

## Monitoring

### Usage Analytics

Track subscription metrics:
- Plan distribution (Free vs Premium)
- Conversion rates
- Quota utilization
- Upgrade triggers

### Performance

- Usage refresh optimized with Firebase queries
- Cached values prevent excessive reads
- Batch updates for usage statistics

## Testing

To test the subscription system:

1. **Free Plan Testing**:
   - Create 1 project (should succeed)
   - Try to create 2nd project (should show upgrade prompt)
   - Create 2 events under 1 project (should succeed)
   - Try to create 3rd event (should show upgrade prompt)

2. **Premium Plan Testing**:
   - Upgrade to premium via `/upgrade` page
   - Create unlimited projects (should succeed)
   - Create unlimited events (should succeed)

3. **Admin Testing**:
   - Admins bypass all quotas regardless of plan

## Troubleshooting

### Usage Not Updating

- Check Firestore indexes are deployed
- Verify queries have proper permissions
- Call `refreshUsage()` manually

### Quota Checks Not Working

- Ensure SubscriptionProvider wraps app
- Check that user is authenticated
- Verify subscription document exists

### Upgrade Not Working

- Check Firestore rules allow updates
- Verify user authentication
- Check browser console for errors

## Future Enhancements

1. **Payment Integration**: Add payment gateway
2. **Trial Periods**: Implement free trials for premium
3. **Annual Plans**: Add yearly subscription option
4. **Team Plans**: Multi-user organization plans
5. **Usage Analytics**: Enhanced tracking dashboard
6. **Webhooks**: Payment status notifications
7. **Invoice Generation**: Automated billing

## Support

For questions or issues related to subscriptions:
- Check the FAQ on `/upgrade` page
- Contact support via `/contact` page
- Premium users: priority support available

---

Last Updated: November 2024
