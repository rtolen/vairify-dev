# Referrals - Email/SMS Sending

## Feature Description

Complete email and SMS sending functionality for referral invitations with delivery tracking, contact picker integration, and accurate success/failure reporting.

## Features

- **Email Sending**: Professional email templates via Resend API
- **SMS Sending**: SMS invitations via Twilio API
- **Contact Picker**: Browser Contact Picker API integration
- **Delivery Tracking**: Track sent, failed, bounced, opened, clicked
- **Real VAI Codes**: Pulls actual referral codes from database (no hardcoded values)
- **Influencer Support**: Supports both user and influencer referral codes
- **Accurate Messaging**: Shows actual send results with success/failure counts
- **Admin Dashboard**: Monitor all invitations with delivery status

## Database Schema

### Migration: `20251205000004_add_referral_delivery_tracking.sql`

Adds to `referral_invitations` table:
- `delivery_status` (ENUM: 'pending', 'sent', 'failed', 'bounced')
- `sent_at` (TIMESTAMP)
- `delivery_error` (TEXT)
- `opened_at` (TIMESTAMP)
- `clicked_at` (TIMESTAMP)
- `referrer_type` (ENUM: 'user', 'influencer')
- `custom_code` (VARCHAR) - for influencer codes

## Components

### Pages
- `InviteEmailFixed.tsx` - Fixed email invitation page with contact picker and real codes
- `InviteSMSFixed.tsx` - Fixed SMS invitation page with contact picker and real codes
- `admin/ReferralManagementUpdated.tsx` - Admin dashboard with delivery tracking

### Components
- `ReferralEarningsCardFixed.tsx` - Fixed routing to use correct paths

### Edge Functions
- `send-referral-email/index.ts` - Sends emails via Resend API with tracking
- `send-referral-sms/index.ts` - Sends SMS via Twilio API with tracking

## Setup Instructions

1. **Run Database Migration**:
   ```bash
   supabase migration up
   ```

2. **Deploy Edge Functions**:
   ```bash
   supabase functions deploy send-referral-email
   supabase functions deploy send-referral-sms
   ```

3. **Environment Variables**:
   ```env
   # Resend API (for emails)
   RESEND_API_KEY=re_xxxxxxxxxxxxx

   # Twilio API (for SMS)
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

4. **Integration**:
   - Replace `InviteEmail.tsx` with `InviteEmailFixed.tsx`
   - Replace `InviteSMS.tsx` with `InviteSMSFixed.tsx`
   - Replace `ReferralEarningsCard.tsx` with `ReferralEarningsCardFixed.tsx`
   - Update admin route to use `ReferralManagementUpdated.tsx`

## Usage

### For Users

1. Navigate to `/referrals/invite/email` or `/referrals/invite/sms`
2. System loads your actual referral code from database
3. Add contacts manually or use Contact Picker button
4. Personalize message (optional)
5. Send invitations
6. See real-time results (sent/failed counts)
7. View delivery status in referrals dashboard

### For Admins

1. Navigate to `/admin/referrals`
2. View all invitations with delivery status
3. Filter by delivery status (Pending/Sent/Failed/Bounced)
4. Filter by referrer type (User/Influencer)
5. Search by email, phone, or code
6. View opened/clicked timestamps (when tracking enabled)
7. Resend failed invitations

## Test Scenarios

### Scenario 1: Email Invitations
1. User navigates to email invite page
2. System loads their referral code
3. User adds emails manually or via contact picker
4. User sends invitations
5. Verify emails are sent via Resend
6. Verify delivery_status updated to 'sent'
7. Verify success message shows correct count

### Scenario 2: SMS Invitations
1. User navigates to SMS invite page
2. System loads their referral code
3. User adds phone numbers manually or via contact picker
4. User sends invitations
5. Verify SMS sent via Twilio
6. Verify delivery_status updated
7. Verify cost calculation displayed

### Scenario 3: Contact Picker
1. Click "Contacts" button
2. Browser contact picker opens
3. Select multiple contacts
4. Verify emails/phones added to list
5. Verify duplicates are filtered

### Scenario 4: Delivery Tracking
1. Send invitations
2. Check admin dashboard
3. Verify delivery_status shows correctly
4. Verify sent_at timestamp recorded
5. Test failed delivery (invalid email/phone)
6. Verify delivery_error recorded

### Scenario 5: Influencer Codes
1. Influencer logs in
2. Navigate to invite page
3. Verify custom_code is used instead of referral_code
4. Verify referrer_type = 'influencer'
5. Send invitation
6. Verify custom_code in database

## Demo Data

See `demo/seed_data.sql` for:
- Sample referral invitations with various delivery statuses
- User and influencer referral codes
- Delivery tracking examples

## Security

- Only authenticated users can send invitations
- Users can only send from their own referral codes
- Delivery errors logged but not exposed to users
- Admin-only access to full delivery details

## Future Enhancements

- Email open/click tracking via Resend webhooks
- SMS delivery receipts via Twilio webhooks
- Bulk invitation templates
- Scheduled invitations
- A/B testing for message content


