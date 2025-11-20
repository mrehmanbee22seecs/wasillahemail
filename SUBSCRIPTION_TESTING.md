# Subscription System Testing Guide

## Prerequisites

1. Firebase project configured with Blaze plan
2. Firestore rules deployed
3. Firestore indexes deployed
4. Application running (dev or production)

## Test Scenarios

### Scenario 1: Free Plan User - Project Limits

**Setup**
1. Create or use an NGO account
2. Verify user is on Free plan (default)

**Test Steps**
1. Navigate to NGO Dashboard
   - ✅ Verify subscription card shows "Free Plan"
   - ✅ Verify usage shows "0 projects · 0 events"
   - ✅ Verify "Upgrade" button is visible

2. Create First Project
   - Navigate to `/create-submission?type=project`
   - Fill in project details
   - Click "Submit for Review"
   - ✅ Project should be created successfully
   - ✅ No upgrade prompt should appear

3. Check Usage Update
   - Return to NGO Dashboard
   - ✅ Usage should show "1 project · 0 events"
   - ✅ Progress bar should show 100% (1/1 projects)
   - ✅ Red warning indicator should appear

4. Try to Create Second Project
   - Navigate to `/create-submission?type=project`
   - Fill in project details
   - Click "Submit for Review"
   - ✅ Upgrade prompt modal should appear
   - ✅ Modal should show "Project Limit Reached"
   - ✅ Modal should indicate current usage: 1/1 projects

5. Upgrade to Premium
   - Click "Upgrade Now" in modal OR
   - Navigate to `/upgrade` page
   - Click "Upgrade to Premium" button
   - ✅ Plan should change to Premium
   - ✅ Modal should close

6. Create Second Project (After Upgrade)
   - Navigate to `/create-submission?type=project`
   - Fill in project details
   - Click "Submit for Review"
   - ✅ Project should be created successfully
   - ✅ No upgrade prompt should appear

### Scenario 2: Free Plan User - Event Limits

**Setup**
1. User on Free plan with 1 project created

**Test Steps**
1. Create First Event
   - Navigate to `/create-submission?type=event`
   - Fill in event details
   - Link to existing project (optional)
   - Click "Submit for Review"
   - ✅ Event should be created successfully

2. Create Second Event
   - Navigate to `/create-submission?type=event`
   - Fill in event details
   - Click "Submit for Review"
   - ✅ Event should be created successfully

3. Check Usage Update
   - Return to NGO Dashboard
   - ✅ Usage should show "1 project · 2 events"
   - ✅ Progress bar for events should show 100% (2/2)

4. Try to Create Third Event
   - Navigate to `/create-submission?type=event`
   - Fill in event details
   - Click "Submit for Review"
   - ✅ Upgrade prompt modal should appear
   - ✅ Modal should show "Event Limit Reached"
   - ✅ Modal should indicate current usage: 2/2 events

### Scenario 3: Premium Plan User

**Setup**
1. User upgraded to Premium plan

**Test Steps**
1. Check Dashboard
   - Navigate to NGO Dashboard
   - ✅ Subscription card shows "Premium Plan" with purple/gradient styling
   - ✅ No usage progress bars (unlimited)
   - ✅ "Upgrade" button is hidden or shows "Manage"

2. Create Multiple Projects
   - Create 3+ projects
   - ✅ All projects should be created successfully
   - ✅ No upgrade prompts appear

3. Create Multiple Events
   - Create 5+ events
   - ✅ All events should be created successfully
   - ✅ No upgrade prompts appear

4. Check Usage
   - Navigate to NGO Dashboard
   - ✅ Usage shows correct counts
   - ✅ No limit warnings or alerts

### Scenario 4: Admin User

**Setup**
1. Login as admin (admin@wasilah.org)

**Test Steps**
1. Check Bypass
   - Admin should be on Free plan by default
   - Create unlimited projects and events
   - ✅ No upgrade prompts appear (admin bypass)

2. Verify Admin Dashboard
   - NGO Dashboard should still show subscription info
   - ✅ Admin can see their plan
   - ✅ Admin can upgrade for testing

### Scenario 5: Upgrade Page

**Test Steps**
1. Navigate to `/upgrade`
   - ✅ Page loads without errors
   - ✅ Current plan is highlighted
   - ✅ Usage dashboard displays correctly
   - ✅ Plan comparison shows all features
   - ✅ FAQ section is visible

2. Test Upgrade Flow
   - Click "Upgrade to Premium"
   - ✅ Plan changes immediately
   - ✅ UI updates to reflect new plan
   - ✅ Success message appears

3. Test Downgrade Flow
   - Click "Switch to Free" (when on Premium)
   - ✅ Confirmation or warning appears
   - ✅ Plan changes to Free
   - ✅ Existing content remains accessible

### Scenario 6: Usage Dashboard Features

**Test Steps**
1. Navigate to `/upgrade`
   - Scroll to Usage Dashboard section

2. Check Refresh Button
   - Click refresh button
   - ✅ Loading spinner appears
   - ✅ Usage updates
   - ✅ Button becomes enabled again

3. Check Alerts
   - For Free plan at 80%+ usage:
     - ✅ Yellow warning alert appears
     - ✅ Alert message is helpful
   - For Free plan at 100% usage:
     - ✅ Red limit reached alert appears
     - ✅ Upgrade link is present

## Success Criteria

Implementation is successful when:
- ✅ Free users limited to 1 project, 2 events
- ✅ Premium users have unlimited access
- ✅ Upgrade prompts appear at limits
- ✅ Plan changes work smoothly
- ✅ Usage tracking is accurate
- ✅ Dashboard integration is seamless
- ✅ No security vulnerabilities
- ✅ Performance is acceptable

---

**Ready for Testing**: Yes
**Test Duration**: 1-2 hours for complete test suite
