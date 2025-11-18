# Resend Email Rollout - Deployment Guide

This guide covers deploying the hardened Resend email functionality according to the rollout plan.

## Prerequisites

1. **Firebase CLI** installed and logged in
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

2. **Resend API Key** from https://resend.com/api-keys

3. **Verified sender email** in Resend dashboard (e.g., `noreply@wasillah.live`)

## Step 1: Configure Environment Variables

### Local Development (Emulator)

1. Copy the example file:
   ```bash
   cd functions
   cp .env.example .env
   ```

2. Edit `functions/.env` with your values:
   ```env
   RESEND_API_KEY=re_your_api_key_here
   RESEND_SENDER=noreply@wasillah.live
   APP_URL=http://localhost:5173
   ```

### Production (Firebase Functions)

Set configuration using Firebase CLI:

```bash
firebase functions:config:set resend.api_key="re_your_api_key_here"
firebase functions:config:set resend.sender="noreply@wasillah.live"
```

**Important**: Use quotes around values containing special characters.

Verify configuration:
```bash
firebase functions:config:get
```

Expected output:
```json
{
  "resend": {
    "api_key": "re_xxx",
    "sender": "noreply@wasillah.live"
  }
}
```

## Step 2: Build and Deploy Functions

### Install Dependencies

```bash
cd functions
npm install
cd ..
```

### Deploy Functions

```bash
firebase deploy --only functions
```

Or deploy specific function:
```bash
firebase deploy --only functions:sendTransactionalEmail
```

## Step 3: Verify Deployment

### Check Functions Status

```bash
firebase functions:list
```

You should see `sendTransactionalEmail` in the list.

### Check Function Logs

```bash
firebase functions:log --only sendTransactionalEmail
```

Look for:
- ✅ "Resend config loaded successfully" on cold start
- ✅ "sendTransactionalEmail called" when invoked
- ✅ "sendTransactionalEmail: success" when email sent

### Test Email Function

From your frontend or using Firebase Console, test sending an email:

```javascript
// Frontend example
import { sendWelcomeEmail } from './services/resendEmailService';

const result = await sendWelcomeEmail({
  email: 'test@example.com',
  name: 'Test User',
  role: 'volunteer'
});

if (!result.success) {
  console.error('Email failed:', result.error);
}
```

## Step 4: Monitor Production

### View Logs

```bash
# Real-time logs
firebase functions:log --only sendTransactionalEmail

# Filter for errors
firebase functions:log --only sendTransactionalEmail | grep ERROR
```

### Check Rate Limits

Monitor the `email_throttle` collection in Firestore:
- Collection: `email_throttle`
- Documents: `uid:{userId}` or `email:{hash}`
- Rate limit: 5 emails per hour per user/email

### Set Up Alerts (Optional)

1. Go to Firebase Console → Functions → sendTransactionalEmail
2. Click "Alerts" tab
3. Create alert for:
   - Error rate > 5%
   - Execution time > 25s
   - Invocation count spikes

## Troubleshooting

### Issue: "RESEND_CONFIG_MISSING" on cold start

**Solution**: 
1. Verify config is set: `firebase functions:config:get`
2. Re-deploy functions after setting config
3. Check logs for exact error message

### Issue: Rate limit errors

**Cause**: User exceeded 5 emails/hour limit

**Solution**: 
- Inform user to wait 1 hour
- Check Firestore `email_throttle` collection
- Clear throttle document if needed (admin only)

### Issue: Email not sending

**Check**:
1. Resend API key is valid
2. Sender email is verified in Resend dashboard
3. Function logs for errors
4. Resend dashboard for delivery status

### Issue: CORS errors (frontend)

**Note**: Firebase Functions v2 `onCall` handles CORS automatically. If you see CORS errors:
1. Ensure using `httpsCallable` from `firebase/functions`
2. Check Firebase Functions region matches frontend region
3. Verify function name matches: `sendTransactionalEmail`

## Configuration Reference

### Environment Variables

| Variable | Local (.env) | Production (config:set) | Required |
|----------|-------------|------------------------|----------|
| `RESEND_API_KEY` | `RESEND_API_KEY` | `resend.api_key` | Yes |
| `RESEND_SENDER` | `RESEND_SENDER` | `resend.sender` | Yes |
| `APP_URL` | `APP_URL` | `app.url` | No (defaults to `https://wasilah-new.web.app`) |

### Function Configuration

- **Timeout**: 30 seconds
- **Memory**: 256MB
- **Min Instances**: 0 (scales to zero)
- **Rate Limit**: 5 emails/hour per user/email
- **Retry Logic**: Automatic retry on transient errors (429, 5xx, network)

## Security Notes

1. **API Key**: Never commit API keys to repository. Use `.env` locally and `functions:config:set` in production.

2. **Email Validation**: 
   - Authenticated users can only send to their own email
   - Unauthenticated verification requests require explicit email parameter
   - Rate limiting prevents abuse

3. **Cost Safety**:
   - Short timeout (30s) prevents runaway executions
   - Minimal dependencies keep cold start fast
   - All Resend calls guarded by validation and throttling

## Support

- **Resend Docs**: https://resend.com/docs
- **Firebase Functions**: https://firebase.google.com/docs/functions
- **Function Logs**: `firebase functions:log`
- **Local Emulator**: `firebase emulators:start --only functions`

