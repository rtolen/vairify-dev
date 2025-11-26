# PILOT FEATURES - IMPLEMENTATION STATUS

**Date:** December 2024  
**Goal:** Complete all 4 features as independent, exportable modules

---

## ✅ FEATURE 1: PROFILE WIZARD - Client Role Support

**Status:** ✅ **COMPLETE**

### Implementation Complete:
- ✅ Role detection (provider/client)
- ✅ Client flow: 3 steps (Language, Personal Info, Settings)
- ✅ Provider flow: 5 steps (Language, Personal Info, Appearance, Services, Pricing)
- ✅ Conditional rendering
- ✅ Role-specific data storage

### Files:
- `src/pages/ProfileWizard.tsx`
- `src/components/profile/ClientSettingsStep.tsx`
- `src/components/profile/PersonalInfoStep.tsx`

**Location:** Already in main codebase, ready for export

---

## ⏳ FEATURE 2: VAI CHECK - Manual Verification Fallback

**Status:** ⏳ **IN PROGRESS**

### Current State Analysis:

**Face Verification Points:**
1. `FaceScanProvider.tsx` (line 61) - TODO: Implement actual face verification
2. `FaceScanLogin.tsx` (line 44-57) - Calls `verify-vai-login` edge function
3. `verify-vai-login/index.ts` - Uses Lovable AI for face comparison
4. `FinalVerification.tsx` - Final face scan before completion

**Failure Handling:**
- Currently shows toast error on failure
- No manual fallback option
- No failure reason tracking
- No consent flow

### What Needs Implementation:

1. **Database Migration:**
   - `manual_verifications` table
   - `verification_audit_log` table

2. **Components:**
   - `ManualVerificationRequest.tsx` - Initiate manual review
   - `ManualVerificationReview.tsx` - Review other party's photos
   - `ConsentModal.tsx` - Consent with failure reason warnings

3. **Edge Functions:**
   - `initiate-manual-verification` - Create manual verification request
   - `submit-manual-verification-review` - Submit review decision

4. **Updates:**
   - Update `FaceScanProvider.tsx` - Add manual fallback button
   - Update `FaceScanLogin.tsx` - Add manual fallback option
   - Update `verify-vai-login` - Return failure reason
   - Update `MutualProfileView.tsx` - Show manual verification status

5. **T&C Updates:**
   - Add liability waiver for manual verification

---

## ⏳ FEATURE 3: TRUEREVU - Backend Completion

**Status:** ⏳ **IN PROGRESS**

### Current State Analysis:

**ReviewForm.tsx Issues:**
- Line 93-95: TODO - Get encounter_id from session
- Line 103: TODO - Get reviewed_user_id from session
- Currently uses `sessionId` as `encounterId` (incorrect)
- Currently uses `user.id` as `reviewed_user_id` (wrong - should be other party)

**Encounter Creation:**
- `Complete.tsx` (line 24-27) - Mock encounter ID
- No encounter creation when VAI Check completes
- No link between `vai_check_sessions` and `encounters`

**Review Display:**
- No `ReviewDisplay.tsx` component
- No `ReviewList.tsx` component
- No `ReviewSummary.tsx` component
- Reviews not displayed on profiles

### What Needs Implementation:

1. **Fix ReviewForm:**
   - Get encounter_id from `vai_check_sessions.encounter_id`
   - Get reviewed_user_id from encounter (other party's ID)
   - Add mutual verification check

2. **Encounter Creation:**
   - Create encounter when VAI Check session completes
   - Link `vai_check_sessions` to `encounters`
   - Update `Complete.tsx` to use real encounter data

3. **Review Display Components:**
   - `ReviewDisplay.tsx` - Show individual review
   - `ReviewList.tsx` - List all reviews
   - `ReviewSummary.tsx` - Aggregated ratings

4. **Database:**
   - Add `vai_check_session_id` to `encounters` table
   - Add `mutual_verification_complete` flag

5. **Edge Functions:**
   - `create-encounter-from-session` - Create encounter when VAI Check completes
   - `check-mutual-verification` - Verify both parties are verified

---

## ⏳ FEATURE 4: REFERRALS - Email/SMS Sending

**Status:** ⏳ **IN PROGRESS**

### Current State Analysis:

**InviteEmail.tsx:**
- Line 79-94: Only inserts into database, doesn't send email
- No actual email sending
- Success message misleading (says "sent" but not sent)

**InviteSMS.tsx:**
- Line 57-58: Hardcoded referral code `9I7T35L`
- Line 79-94: Only inserts into database, doesn't send SMS
- No actual SMS sending
- Success message misleading

**Missing:**
- No edge functions for email/SMS sending
- No contact picker integration
- No VAI code pulling from database

### What Needs Implementation:

1. **Edge Functions:**
   - `send-referral-email` - Send email via Resend API
   - `send-referral-sms` - Send SMS via Twilio

2. **Fix Hardcoded Codes:**
   - Get user's VAI from `vai_verifications` table
   - Get referral code from `referral_codes` table
   - Generate dynamic referral links

3. **Contact Picker:**
   - Add Browser Contact Picker API
   - Multi-select contacts
   - Extract email/phone numbers
   - Pre-fill forms

4. **Fix Success Messages:**
   - Only show success if email/SMS actually sent
   - Show test mode indicator
   - Track delivery status

5. **Update ReferralEarningsCard:**
   - Fix routing issues

---

## 📦 EXPORT STRUCTURE

Each feature exports as:

```
pilot-features/
└── feature-X-name/
    ├── components/
    ├── pages/
    ├── supabase/
    │   ├── functions/
    │   └── migrations/
    ├── demo/
    ├── README.md
    └── .env.example
```

---

## 🎯 IMPLEMENTATION PRIORITY

1. **Feature 2: VAI CHECK Manual Verification** ⏳
   - Database migrations
   - Manual verification flow
   - Consent modal

2. **Feature 3: TrueRevu Backend** ⏳
   - Fix ReviewForm data binding
   - Encounter creation
   - Review display components

3. **Feature 4: Referrals Email/SMS** ⏳
   - Edge functions
   - Fix hardcoded codes
   - Contact picker

---

**Last Updated:** December 2024  
**Next Action:** Start Feature 2 implementation


