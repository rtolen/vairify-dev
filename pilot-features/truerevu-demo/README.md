# TrueRevu - Backend Completion

## Feature Description

Complete backend implementation for the TrueRevu review system. Enables users to submit verified reviews after completing VAI Check encounters, with mutual verification requirements and immutable reviews.

## Features

- **Encounter Creation**: Automatically creates encounter when VAI Check completes
- **Mutual Verification**: Both parties must complete encounter before reviews allowed
- **Review Submission**: Fixed review form with proper data binding
- **Review Display**: Review cards with star ratings and verified badges
- **Immutable Reviews**: Reviews cannot be edited/deleted after submission
- **Admin Dashboard**: Monitor all reviews with filtering and flagging

## Database Schema

### Migration: `20251205000003_add_review_fields.sql`

Adds to `reviews` table:
- `reviewer_vai_number` (VARCHAR)
- `reviewee_vai_number` (VARCHAR)
- `is_verified` (BOOLEAN, default true)
- `mutual_completion_verified` (BOOLEAN, default false)

Also creates `can_submit_review()` function for mutual verification check.

## Components

### Pages
- `ReviewFormFixed.tsx` - Fixed review submission form with proper data binding
- `CompleteWithEncounter.tsx` - Updated complete page that creates encounters
- `admin/ReviewsAdmin.tsx` - Admin dashboard for monitoring reviews

### Components
- `ReviewCard.tsx` - Display component for individual reviews
- `ReviewList.tsx` - List component for displaying multiple reviews

### Edge Functions
- `create-encounter/index.ts` - Creates encounter when VAI Check completes
- `submit-review/index.ts` - Validates mutual verification and submits review

## Setup Instructions

1. **Run Database Migration**:
   ```bash
   supabase migration up
   ```

2. **Deploy Edge Functions**:
   ```bash
   supabase functions deploy create-encounter
   supabase functions deploy submit-review
   ```

3. **Integration**:
   - Replace `ReviewForm.tsx` with `ReviewFormFixed.tsx`
   - Replace `Complete.tsx` with `CompleteWithEncounter.tsx`
   - Add admin route: `/admin/reviews`
   - Use `ReviewCard` and `ReviewList` components where needed

## Usage

### For Users

1. Complete VAI Check session
2. System automatically creates encounter
3. Both parties must complete encounter (status = 'completed')
4. Navigate to review page
5. System checks mutual verification requirement
6. Submit review (ratings + optional text)
7. Review is immutable once submitted

### For Admins

1. Navigate to `/admin/reviews`
2. View all reviews with filtering
3. Filter by rating, verified status, or search
4. Flag inappropriate content (legal violations only)
5. View encounter verification status
6. See both parties' VAI numbers

## Test Scenarios

### Scenario 1: Encounter Creation
1. Complete VAI Check session
2. Verify encounter is created automatically
3. Verify encounter_id is linked to session

### Scenario 2: Mutual Verification
1. User A completes encounter
2. User B tries to submit review → should fail
3. User B completes encounter
4. Both users can now submit reviews

### Scenario 3: Review Submission
1. Submit review with all ratings
2. Verify review is saved with VAI numbers
3. Verify is_verified = true
4. Verify review is immutable (cannot edit/delete)

### Scenario 4: Review Display
1. View reviews using ReviewList component
2. Verify verified badges display
3. Verify VAI numbers are anonymized
4. Verify ratings and text display correctly

### Scenario 5: Admin Dashboard
1. View all reviews
2. Filter by rating (5 stars, 4+, etc.)
3. Filter by verified status
4. Search by VAI number or review text
5. Flag inappropriate content

## Demo Data

See `demo/seed_data.sql` for:
- Sample encounters
- Sample reviews with various ratings
- Encounter completion statuses

## Security

- Reviews require verified encounters
- Mutual verification prevents fake reviews
- VAI numbers stored but displayed anonymized
- Admin-only access to full VAI numbers
- Reviews are immutable once submitted

## Future Enhancements

- Review moderation queue
- Automatic flagging for keyword violations
- Review helpfulness voting
- Review response feature
- Review analytics dashboard


