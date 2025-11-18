# Resend Email QA Testing Guide

This guide provides a manual testing checklist and test script for verifying the Resend email rollout implementation.

## Pre-Testing Setup

### 1. Local Development Testing

```bash
# 1. Start Firebase emulators
firebase emulators:start --only functions,firestore

# 2. Set up local environment
cd functions
cp .env.example .env
# Edit .env with your test Resend API key
cd ..

# 3. Build functions
cd functions
npm run build
cd ..
```

### 2. Production Testing

Ensure production config is set:
```bash
firebase functions:config:get
```

## Manual Test Checklist

### Test 1: Verification Email (Unauthenticated)

- [ ] **Setup**: Use a test email address
- [ ] **Action**: Trigger verification email without authentication
- [ ] **Expected**: 
  - Email sent successfully
  - Rate limit tracked in Firestore `email_throttle/email:{hash}`
  - Logs show "sendTransactionalEmail: success"
- [ ] **Verify**: Check email inbox for verification link
- [ ] **Security Check**: Cannot send to different email than request body

**Test Command** (via frontend):
```javascript
const result = await sendVerificationEmail({ email: 'test@example.com' });
console.log(result); // Should show success: true
```

### Test 2: Welcome Email (Authenticated)

- [ ] **Setup**: Create test user account
- [ ] **Action**: Send welcome email after signup
- [ ] **Expected**:
  - Email sent to authenticated user's email
  - Role-specific content in email
  - Logs show template type "welcome"
- [ ] **Verify**: Check email inbox

**Test Command**:
```javascript
const result = await sendWelcomeEmail({
  email: user.email,
  name: user.displayName,
  role: 'volunteer'
});
```

### Test 3: Forgot Password Email

- [ ] **Setup**: Use test email (can be unauthenticated)
- [ ] **Action**: Request password reset
- [ ] **Expected**:
  - Email sent with reset link
  - Rate limit enforced
- [ ] **Verify**: Reset link works

### Test 4: Project Submission Confirmation

- [ ] **Setup**: Authenticated user submits project/event
- [ ] **Action**: Submit project or event
- [ ] **Expected**:
  - Confirmation email sent
  - Template type "project-submission"
  - Email includes project name
- [ ] **Verify**: Email content matches submission

### Test 5: Project Approval Email

- [ ] **Setup**: Admin approves a submission
- [ ] **Action**: Admin approves project/event
- [ ] **Expected**:
  - Approval email sent to submitter
  - Template type "project-approval"
- [ ] **Verify**: Email includes approval message

### Test 6: Rate Limiting

- [ ] **Setup**: Use test user or email
- [ ] **Action**: Send 6 emails in quick succession (within 1 hour)
- [ ] **Expected**:
  - First 5 emails succeed
  - 6th email fails with "resource-exhausted" error
  - Error message: "Email limit exceeded. Please try again in an hour."
  - Firestore `email_throttle` shows count: 5
- [ ] **Wait**: Wait 1 hour (or manually clear throttle document)
- [ ] **Retry**: Should succeed again

**Test Command**:
```javascript
for (let i = 0; i < 6; i++) {
  const result = await sendWelcomeEmail({
    email: 'test@example.com',
    name: 'Test User'
  });
  console.log(`Email ${i + 1}:`, result);
}
```

### Test 7: Error Handling - Invalid Email

- [ ] **Action**: Send email with empty or invalid email
- [ ] **Expected**:
  - Error: "Invalid email request. Please check your information and try again."
  - Error code: "invalid-argument"
  - No email sent

### Test 8: Error Handling - Unauthenticated Protected Template

- [ ] **Action**: Send "welcome" email without authentication
- [ ] **Expected**:
  - Error: "Please sign in to send this email."
  - Error code: "unauthenticated"
  - No email sent

### Test 9: Error Handling - Email Mismatch

- [ ] **Setup**: Authenticated user
- [ ] **Action**: Try to send email to different address than auth email
- [ ] **Expected**:
  - Error: "You do not have permission to send this email."
  - Error code: "permission-denied"
  - No email sent

### Test 10: Retry Logic

- [ ] **Setup**: Simulate transient error (temporarily block Resend API)
- [ ] **Action**: Send email
- [ ] **Expected**:
  - First attempt fails with transient error
  - Automatic retry after ~500-750ms backoff
  - Success on retry (if API recovers)
  - Logs show "Transient error detected, retrying once"

**Note**: This test requires simulating network issues or Resend API 429/5xx responses.

### Test 11: Logging and Monitoring

- [ ] **Check Function Logs**: `firebase functions:log --only sendTransactionalEmail`
- [ ] **Verify Logs Include**:
  - "sendTransactionalEmail called" with template, auth info
  - "Resend config loaded successfully" on cold start
  - "rate limit check passed"
  - "template built"
  - "Resend email sent successfully" with messageId
  - "sendTransactionalEmail: success" with duration
- [ ] **Check Firestore**: 
  - `email_throttle` collection populated
  - Documents have `count`, `windowStart`, `expiresAt`

### Test 12: All Template Types

Test each template type:
- [ ] `verification` - Email verification link
- [ ] `welcome` - Welcome email with role content
- [ ] `forgot-password` - Password reset link
- [ ] `project-submission` - Submission confirmation
- [ ] `project-approval` - Approval notification
- [ ] `reminder` - Reminder email
- [ ] `volunteer-confirmation` - Volunteer confirmation
- [ ] `edit-request-submitted` - Edit request received
- [ ] `edit-request-status` - Edit request approved/rejected
- [ ] `notification` - Custom notification

### Test 13: Frontend Error Display

- [ ] **Rate Limit**: Verify user sees "Email limit exceeded. Please try again in an hour."
- [ ] **Permission Denied**: Verify user sees "You do not have permission to send this email."
- [ ] **Network Error**: Verify user sees "Email service temporarily unavailable. Please try again later."
- [ ] **Generic Error**: Verify user sees friendly error message

### Test 14: Cost Safety

- [ ] **Verify**: Function timeout is 30 seconds
- [ ] **Verify**: Minimal dependencies (check `functions/package.json`)
- [ ] **Verify**: Rate limiting prevents excessive calls
- [ ] **Verify**: Validation happens before Resend API calls

## Automated Test Script

Create a test file `test-resend-email.js`:

```javascript
const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

const firebaseConfig = {
  // Your Firebase config
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);
const sendTransactionalEmail = httpsCallable(functions, 'sendTransactionalEmail');

async function testEmail(template, data) {
  try {
    console.log(`\nTesting ${template}...`);
    const result = await sendTransactionalEmail({ template, ...data });
    console.log(`✅ Success:`, result.data);
    return true;
  } catch (error) {
    console.error(`❌ Failed:`, error.code, error.message);
    return false;
  }
}

async function runTests() {
  const testEmail = 'your-test-email@example.com';
  
  console.log('Starting Resend Email Tests...\n');
  
  // Test 1: Verification (unauthenticated)
  await testEmail('verification', { email: testEmail });
  
  // Test 2: Welcome (requires auth - skip if not authenticated)
  // await testEmail('welcome', { email: testEmail, name: 'Test User', role: 'volunteer' });
  
  // Test 3: Forgot Password
  await testEmail('forgot-password', { email: testEmail });
  
  // Test 4: Rate Limiting (send 6 times)
  console.log('\nTesting rate limiting...');
  for (let i = 1; i <= 6; i++) {
    const success = await testEmail('verification', { email: testEmail });
    if (!success && i === 6) {
      console.log('✅ Rate limit working correctly');
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between
  }
  
  console.log('\n✅ All tests complete!');
}

runTests();
```

## Production Validation Steps

### Cost-Aware Testing

1. **Monitor Email Count**: Check Resend dashboard for daily email usage
2. **Function Invocations**: Check Firebase Console → Functions → Usage
3. **Cold Start Performance**: Monitor function execution time in logs
4. **Error Rate**: Check function error percentage in Firebase Console

### Production Checklist

- [ ] Config variables set via `firebase functions:config:set`
- [ ] Functions deployed successfully
- [ ] At least one email sent successfully
- [ ] Rate limiting working (test with non-critical email)
- [ ] Error handling working (test with invalid input)
- [ ] Logs showing structured logging
- [ ] Firestore throttle collection populated
- [ ] Frontend error messages user-friendly
- [ ] All templates tested at least once
- [ ] Monitoring/alerting configured (if available)

## Test Results Template

```
Test Date: _______________
Tester: _______________
Environment: [ ] Local [ ] Production

Template Tests:
- Verification: [ ] Pass [ ] Fail
- Welcome: [ ] Pass [ ] Fail
- Forgot Password: [ ] Pass [ ] Fail
- Project Submission: [ ] Pass [ ] Fail
- Project Approval: [ ] Pass [ ] Fail
- Reminder: [ ] Pass [ ] Fail
- Volunteer Confirmation: [ ] Pass [ ] Fail
- Edit Request Submitted: [ ] Pass [ ] Fail
- Edit Request Status: [ ] Pass [ ] Fail
- Notification: [ ] Pass [ ] Fail

Security Tests:
- Rate Limiting: [ ] Pass [ ] Fail
- Email Mismatch: [ ] Pass [ ] Fail
- Unauthenticated Protected: [ ] Pass [ ] Fail

Error Handling:
- Invalid Input: [ ] Pass [ ] Fail
- Network Errors: [ ] Pass [ ] Fail
- User-Friendly Messages: [ ] Pass [ ] Fail

Performance:
- Function Execution Time: _____ ms
- Cold Start Time: _____ ms
- Email Delivery Time: _____ s

Issues Found:
1. _______________
2. _______________

Overall Status: [ ] Ready for Production [ ] Needs Fixes
```

## Troubleshooting Common Test Failures

### "RESEND_CONFIG_MISSING"
- Check `.env` file exists and has correct values
- Verify `firebase functions:config:get` shows config
- Rebuild and redeploy functions

### Rate Limit Not Working
- Check Firestore `email_throttle` collection exists
- Verify function has Firestore read/write permissions
- Check function logs for rate limit errors

### Email Not Received
- Check Resend dashboard for email status
- Verify sender email is verified in Resend
- Check spam folder
- Verify email address is correct

### Frontend Shows Generic Error
- Check browser console for full error
- Verify error mapping in `resendEmailService.ts`
- Check function logs for actual error code

