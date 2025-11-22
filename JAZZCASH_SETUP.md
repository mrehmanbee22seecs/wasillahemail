# JazzCash Payment Gateway Integration

## Overview
This implementation adds JazzCash payment gateway integration for subscription upgrades in Pakistan. Users can now pay for premium subscriptions using JazzCash mobile wallets, bank accounts, and cards.

## Features Added

### 1. Payment Infrastructure
- **Payment Types** (`src/types/payment.ts`)
  - Transaction tracking
  - Payment status management
  - JazzCash-specific request/response types

- **JazzCash Service** (`src/services/jazzCashPaymentService.ts`)
  - Payment initiation
  - Secure hash generation (HMAC SHA256)
  - Payment verification
  - Transaction management

### 2. UI Components
- **PaymentCheckout** (`src/components/Payment/PaymentCheckout.tsx`)
  - Professional checkout interface
  - Order summary display
  - Security notices
  - Error handling

- **PaymentReturn** (`src/pages/PaymentReturn.tsx`)
  - Handles return from JazzCash gateway
  - Verifies payment response
  - Shows success/failure status
  - Auto-redirects to dashboard

### 3. Integration Updates
- **PlanSelector** - Opens payment modal for premium upgrades
- **App.tsx** - Added `/payment/return` route
- **SubscriptionContext** - Added `refreshSubscription` method

## Setup Instructions

### Step 1: Install Dependencies

```bash
npm install crypto-js
npm install --save-dev @types/crypto-js
```

### Step 2: Get JazzCash Merchant Credentials

1. Apply for JazzCash Merchant Account:
   - Visit: https://www.jazzcash.com.pk/
   - Apply for Merchant Services
   - Complete KYC and documentation

2. You will receive:
   - **Merchant ID** (e.g., MC12345)
   - **Password**
   - **Integrity Salt** (for hash generation)

### Step 3: Configure Environment Variables

Create or update `.env` file:

```env
# JazzCash Configuration
VITE_JAZZCASH_MERCHANT_ID=your_merchant_id
VITE_JAZZCASH_PASSWORD=your_password_here
VITE_JAZZCASH_SALT=your_integrity_salt_here
VITE_JAZZCASH_SANDBOX=true  # Set to false for production
```

**IMPORTANT SECURITY NOTE:**
In production, `VITE_JAZZCASH_PASSWORD` and `VITE_JAZZCASH_SALT` should **NEVER** be in client-side code. These should only exist on your backend server.

### Step 4: Set Up Pricing

Update plan pricing in `src/contexts/SubscriptionContext.tsx`:

```typescript
premium: {
  id: 'premium',
  name: 'premium',
  displayName: 'Premium',
  price: 2999, // Set your price in PKR
  currency: 'PKR',
  interval: 'monthly',
  // ... rest of config
}
```

### Step 5: Backend Setup (REQUIRED for Production)

For production, you **MUST** move sensitive operations to a backend server:

####  Create Backend API Endpoints

```javascript
// Example: POST /api/payment/create
app.post('/api/payment/create', async (req, res) => {
  const { amount, userId, plan } = req.body;
  
  // Generate secure hash server-side
  // Create payment transaction
  // Return payment URL
  
  res.json({ paymentUrl, transactionId });
});

// Example: POST /api/payment/webhook
app.post('/api/payment/webhook', async (req, res) => {
  // Verify JazzCash callback
  // Update transaction status
  // Update user subscription
  
  res.json({ success: true });
});
```

#### Update Client Code

Replace `initiateJazzCashPayment` calls with API calls:

```typescript
// Instead of:
const paymentIntent = await initiateJazzCashPayment(params);

// Use:
const response = await fetch('/api/payment/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(params)
});
const paymentIntent = await response.json();
```

### Step 6: Configure Firebase Security Rules

Add Firestore rules for payment transactions:

```javascript
match /payment_transactions/{transactionId} {
  allow read: if request.auth != null && 
              resource.data.userId == request.auth.uid;
  allow create: if request.auth != null && 
                request.resource.data.userId == request.auth.uid;
  allow update: if false; // Only backend can update
}
```

### Step 7: Test in Sandbox Mode

1. Set `VITE_JAZZCASH_SANDBOX=true`
2. Use JazzCash sandbox credentials
3. Test payment flow:
   - Click "Upgrade" in dashboard
   - Select Premium plan
   - Click "Proceed to Payment"
   - Complete payment on JazzCash sandbox
   - Verify return to success page

### Step 8: Go Live

1. Get production credentials from JazzCash
2. Update environment variables with production credentials
3. Set `VITE_JAZZCASH_SANDBOX=false`
4. Ensure backend is properly secured
5. Test with real transactions
6. Monitor payment transactions in Firebase

## Payment Flow

### User Journey:
1. User clicks "Upgrade" button → Opens payment modal
2. User reviews order → Clicks "Proceed to Payment"
3. Redirected to JazzCash → Completes payment
4. Redirected back to `/payment/return` → Verification
5. Success page shown → Auto-redirect to dashboard
6. Subscription activated → Premium features unlocked

### Technical Flow:
```
Client → initiatePayment() → Create Transaction in Firebase
      → Generate Secure Hash → Redirect to JazzCash
      → User Pays → JazzCash Callback
      → Verify Hash → Update Transaction
      → Update Subscription → Refresh UI
```

## Pricing Tiers

Current configuration:
- **Free Plan**: PKR 0/month
  - 1 Active Project
  - 2 Events per Project
  - Basic Features

- **Premium Plan**: PKR 2999/month (customize as needed)
  - Unlimited Projects
  - Unlimited Events
  - All Features

## Security Considerations

### Current Implementation (Development Only):
⚠️ **Hash generation happens in client** - This is for development/testing only

### Production Requirements:
✅ **Must implement**:
1. Backend API for payment initiation
2. Server-side hash generation
3. Webhook endpoint for payment verification
4. Secure credential storage (environment variables on server)
5. SSL/TLS certificates
6. Input validation and sanitization
7. Rate limiting on payment endpoints
8. Transaction logging and monitoring

## Testing

### Test Cards (Sandbox):
- Test Card: 4111111111111111
- CVV: Any 3 digits
- Expiry: Any future date

### Test Mobile Wallets:
- Use JazzCash sandbox test accounts provided by JazzCash

## Troubleshooting

### Common Issues:

1. **Hash Mismatch Error**
   - Ensure field order matches JazzCash documentation
   - Check integrity salt is correct
   - Verify all required fields are present

2. **Payment Not Completing**
   - Check return URL is accessible
   - Verify webhook endpoint is reachable
   - Check Firebase security rules

3. **Transaction Not Updating**
   - Verify payment verification logic
   - Check Firebase permissions
   - Review browser console for errors

## Support

- JazzCash Merchant Support: support@jazzcash.com.pk
- JazzCash Developer Portal: https://sandbox.jazzcash.com.pk/
- Technical Documentation: Contact JazzCash for API docs

## Files Modified

- ✅ `src/types/payment.ts` - Payment type definitions
- ✅ `src/services/jazzCashPaymentService.ts` - Payment service
- ✅ `src/components/Payment/PaymentCheckout.tsx` - Checkout UI
- ✅ `src/pages/PaymentReturn.tsx` - Return handler
- ✅ `src/components/Subscription/PlanSelector.tsx` - Payment integration
- ✅ `src/App.tsx` - Added payment route
- ✅ `src/contexts/SubscriptionContext.tsx` - Added refresh method

## Next Steps

1. ✅ Install crypto-js dependency
2. ⏳ Apply for JazzCash merchant account
3. ⏳ Get merchant credentials
4. ⏳ Configure environment variables
5. ⏳ Test in sandbox mode
6. ⏳ Implement backend API (CRITICAL for production)
7. ⏳ Go live with production credentials

## License & Compliance

Ensure compliance with:
- Payment Card Industry Data Security Standard (PCI DSS)
- State Bank of Pakistan regulations
- JazzCash merchant terms and conditions
- Local tax laws for digital services

---

**Note**: This implementation provides the foundation for JazzCash integration. Backend implementation is REQUIRED before going to production for security reasons.
