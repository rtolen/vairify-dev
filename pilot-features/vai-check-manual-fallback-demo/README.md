# VAI CHECK - Manual Verification Fallback

## Feature Description

This module implements a manual verification fallback system for VAI Check when automatic facial recognition fails. It allows users to request manual verification by another VAI-verified party, with complete consent tracking, liability waivers, and audit trails.

## Features

- **Automatic Failure Detection**: Detects when facial recognition fails (system error, individual unable, or verification failed)
- **Manual Review Request**: Owner can initiate manual review process
- **VAI-Verified Reviewer Requirement**: Only VAI-verified users can review manual verifications
- **Consent & Liability Waiver**: Both parties must explicitly consent with understanding of terms
- **Complete Audit Trail**: All actions, timestamps, photos, and decisions are logged
- **Admin Monitoring**: Admin dashboard shows all manual verification sessions with filtering

## Database Schema

### Migration: `20251205000001_add_manual_verification_fields.sql`

Adds the following columns to `vai_check_sessions`:
- `verification_method` (ENUM: 'automated', 'manual_fallback')
- `manual_review_reason` (ENUM: 'system_failure', 'individual_issue', 'failed_verification')
- `manual_reviewer_vai_number` (VARCHAR)
- `manual_review_sent_at` (TIMESTAMP)
- `manual_review_decision` (ENUM: 'approved', 'rejected', 'pending')
- `manual_review_decided_at` (TIMESTAMP)
- `owner_consent_timestamp` (TIMESTAMP)
- `reviewer_consent_timestamp` (TIMESTAMP)
- `liability_waiver_accepted` (BOOLEAN)
- `manual_review_vai_photo_url` (TEXT)
- `manual_review_live_selfie_url` (TEXT)
- `manual_review_notes` (TEXT)

Also creates `manual_verification_audit_log` table for complete audit trail.

## Components

### `ManualVerificationWarningModal.tsx`
Modal component that displays failure reason, liability waiver, and requires explicit consent from both parties.

### `ManualVerificationRequestFlow.tsx`
Flow component for the owner (initiator) to request manual verification. Shows failure reason, photo previews, and handles consent.

### `ManualVerificationReviewFlow.tsx`
Flow component for the reviewer to review manual verification requests. Shows both photos side-by-side, allows approve/reject decision, and requires consent.

### `FaceScanProviderWithManualFallback.tsx`
Updated face scan component that integrates manual verification fallback when automatic verification fails.

### `ManualVerificationReviewPage.tsx`
Page component that wraps the review flow for routing.

### `VAISessionsAdmin.tsx`
Admin dashboard page showing all VAI check sessions with manual verification columns, filtering, and search.

## Setup Instructions

1. **Run Database Migration**:
   ```bash
   supabase migration up
   ```

2. **Install Dependencies** (if not already installed):
   ```bash
   npm install
   ```

3. **Environment Variables**:
   No additional environment variables required. Uses existing Supabase configuration.

4. **Integration**:
   - Copy components to your main app's component directory
   - Copy pages to your main app's pages directory
   - Add route for manual verification review page:
     ```tsx
     <Route path="/vai-check/manual-review/:sessionId" element={<ManualVerificationReviewPage />} />
     ```
   - Update admin routes to include VAISessionsAdmin:
     ```tsx
     <Route path="/admin/vai-sessions" element={<VAISessionsAdmin />} />
     ```

## Usage

### For Users (Initiators)

1. When automatic face verification fails, the system will show the manual verification request flow
2. User selects failure reason and provides optional details
3. User must accept liability waiver and consent
4. System sends photos to the other party (reviewer)
5. User is notified when reviewer makes a decision

### For Reviewers

1. Reviewer receives notification about manual verification request
2. Reviewer navigates to review page (via notification or `/vai-check/manual-review/:sessionId`)
3. Reviewer must accept liability waiver and consent
4. Reviewer compares VAI photo with live selfie
5. Reviewer makes approve/reject decision with optional notes
6. Both parties are notified of the decision

### For Admins

1. Navigate to `/admin/vai-sessions`
2. View all sessions with verification method column
3. Filter by verification method (Automated/Manual Fallback)
4. Search by session code, VAI number, or email
5. View consent timestamps, reviewer VAI, and decision status

## Test Scenarios

### Scenario 1: System Failure
1. Simulate system failure in face verification
2. User should see "System Failure" as reason
3. User can request manual verification
4. Reviewer can approve/reject

### Scenario 2: Failed Verification
1. Simulate failed face match
2. User should see "Failed Verification" as reason
3. User can request manual verification
4. Reviewer compares photos and makes decision

### Scenario 3: Individual Issue
1. Simulate user unable to complete verification
2. User should see "Individual Issue" as reason
3. User can request manual verification
4. Reviewer can approve/reject

### Scenario 4: Consent Flow
1. Verify both parties must accept liability waiver
2. Verify consent timestamps are recorded
3. Verify audit log entries are created

### Scenario 5: Admin Monitoring
1. Create multiple sessions (automated and manual)
2. Filter by verification method
3. Verify all columns display correctly
4. Test search functionality

## Demo Data

See `demo/seed_data.sql` for sample data including:
- Sample VAI check sessions with manual verification
- Audit log entries
- Various failure reasons and decisions

## Security Considerations

- Only VAI-verified users can review manual verifications
- Both parties must explicitly consent
- All actions are logged in audit trail
- Photos are stored securely in Supabase Storage
- Liability waiver protects platform from manual verification decisions

## Future Enhancements

- Email/SMS notifications for manual verification requests
- Time limits for manual verification requests (expiration)
- Multiple reviewer option for high-stakes verifications
- Reviewer rating system
- Automated reviewer assignment based on availability


