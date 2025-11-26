# Feature 2: VAI CHECK - Manual Verification Fallback

## Overview

Manual verification fallback flow when facial recognition fails. Provides an alternative verification method when automatic face verification encounters issues.

## Features

- ✅ Manual verification request creation
- ✅ Failure reason tracking (system glitch, can't verify, failed check)
- ✅ Consent flow with liability waiver
- ✅ VAI-verified reviewer requirement
- ✅ Audit trail for all verification actions
- ✅ Photo comparison interface

## Database Schema

### Tables

1. **manual_verifications** - Stores manual verification requests
2. **verification_audit_log** - Audit trail for all actions

See: `supabase/migrations/20251205000001_create_manual_verification_tables.sql`

## Components

- `ManualVerificationRequest.tsx` - Initiate manual review
- `ManualVerificationReview.tsx` - Review other party's photos
- `ConsentModal.tsx` - Consent with failure reason warnings

## Edge Functions

- `initiate-manual-verification` - Create manual verification request
- `submit-manual-verification-review` - Submit review decision

## Setup

1. Run database migration
2. Deploy edge functions
3. Update face verification components to show manual fallback option

## Usage

When face verification fails, users can:
1. Initiate manual verification
2. Send VAI photo + live selfie to other party
3. Other party reviews and approves/rejects
4. Both parties consent with failure reason warnings

---

**Status:** ⏳ In Progress


