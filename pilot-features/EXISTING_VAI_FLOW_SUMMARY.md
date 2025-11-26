# Existing VAI Number Flow - Implementation Summary

## ✅ COMPLETE

### Files Created/Modified:

1. **Database Migration**: `supabase/migrations/20251205000007_add_existing_vai_fields.sql`
   - Adds fields to `signup_sessions` table for existing VAI tracking

2. **Edge Function**: `supabase/functions/check-vai-requirements/index.ts`
   - Calls ChainPass API `/check-vai-requirements`
   - Handles test mode when API key not configured
   - Stores response in session

3. **Registration Page**: `src/pages/onboarding/Registration.tsx`
   - Added checkbox: "I have a VAI number from another platform"
   - Conditional VAI input field
   - Integrated ChainPass API check on submit
   - Routes based on VAI status

4. **VerifyOTP Page**: `src/pages/onboarding/VerifyOTP.tsx`
   - Updated to handle existing VAI flow routing

5. **VAICallback Page**: `src/pages/onboarding/VAICallback.tsx`
   - Handles existing VAI linking for fully qualified VAIs
   - Skips ChainPass when VAI is fully qualified

6. **Documentation**: `EXISTING_VAI_FLOW_README.md`
   - Complete setup and usage instructions

## Flow Summary

### Fully Qualified VAI:
1. User checks box + enters VAI
2. System calls ChainPass API
3. Response: `fully_qualified`
4. User verifies email (OTP)
5. System links existing VAI to account
6. Redirect to profile setup (skips ChainPass)

### Missing Requirements:
1. User checks box + enters VAI
2. System calls ChainPass API
3. Response: `missing_requirements`
4. Redirect to ChainPass: `/complete-requirements?session_id=X&vai=Y`
5. User completes LE disclosure + signature
6. Returns to Vairify callback
7. VAI linked, continue to profile

### Invalid VAI:
1. User checks box + enters VAI
2. System calls ChainPass API
3. Response: `invalid`
4. Proceeds with normal new VAI creation flow

## Environment Variables Needed

```env
CHAINPASS_API_URL=https://api.chainpass.com
CHAINPASS_API_KEY=your_api_key_here
```

## Testing

- Test mode available when `CHAINPASS_API_KEY` not set
- Mock responses for development
- Full integration ready for production


