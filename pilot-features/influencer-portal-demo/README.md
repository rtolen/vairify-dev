# Influencer/Affiliate Portal

## Feature Description

Complete influencer and affiliate portal with separate entrance, application flow, access code system, custom code generation, QR codes, performance tracking, and admin management.

## Features

- **Separate Entrance**: Route `/influencers` (or subdomain)
- **Public Application Flow**: Anyone can apply to become an influencer
- **Access Code Flow**: Admin-generated codes for recruited advocates
- **3-Step Onboarding**: Account verification, profile setup, dashboard intro
- **Custom Code Generator**: Create branded referral codes (e.g., "VAI-YourName")
- **QR Code Manager**: Auto-generate QR codes for each custom code
- **Performance Dashboard**: Track signups, conversions, earnings
- **Marketing Materials**: Download assets, templates, brand guidelines
- **Earnings & Payouts**: Request payouts (minimum $50), view history
- **Admin Management**: Approve/reject applications, manage influencers, generate access codes

## Database Schema

### Migration: `20251205000005_create_influencer_tables.sql`

Creates tables:
- `influencers` - Influencer accounts with commission tracking
- `influencer_applications` - Public applications
- `influencer_custom_codes` - Custom referral codes
- `influencer_payouts` - Payout requests and history
- `influencer_access_codes` - Admin-generated access codes

## Components

### Pages
- `InfluencerLanding.tsx` - Landing page with application/access code options
- `InfluencerApplication.tsx` - Public application form
- `AccessCodeFlow.tsx` - Access code validation and account creation
- `onboarding/InfluencerOnboarding.tsx` - 3-step onboarding flow
- `dashboard/InfluencerDashboard.tsx` - Main dashboard with 6 sections
- `admin/InfluencerManagement.tsx` - Admin management dashboard

### Dashboard Components
- `CustomCodeGenerator.tsx` - Create and manage custom codes
- `QRCodeManager.tsx` - View and download QR codes
- `PerformanceDashboard.tsx` - Analytics and performance metrics
- `MarketingMaterials.tsx` - Download marketing assets
- `EarningsPayouts.tsx` - Earnings tracking and payout requests
- `InfluencerSettings.tsx` - Profile and account settings

### Edge Functions
- `validate-access-code/index.ts` - Validates access codes
- `create-influencer-from-access-code/index.ts` - Creates account from access code
- `generate-qr-code/index.ts` - Generates QR codes for custom codes
- `process-influencer-payout/index.ts` - Processes payout requests

## Setup Instructions

1. **Run Database Migration**:
   ```bash
   supabase migration up
   ```

2. **Create Storage Bucket**:
   ```sql
   -- Create bucket for influencer assets (QR codes, etc.)
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('influencer-assets', 'influencer-assets', true);
   ```

3. **Deploy Edge Functions**:
   ```bash
   supabase functions deploy validate-access-code
   supabase functions deploy create-influencer-from-access-code
   supabase functions deploy generate-qr-code
   supabase functions deploy process-influencer-payout
   ```

4. **Integration**:
   - Add routes for influencer portal
   - Set up separate auth if needed (or use existing Supabase Auth)
   - Add admin route: `/admin/influencers`

## Usage

### For Applicants

1. Navigate to `/influencers`
2. Click "Apply Now"
3. Fill out application form (email, username, password, social links, niche, etc.)
4. Submit application
5. Receive email confirmation
6. Wait for admin review (48 hours)
7. Receive approval/rejection email

### For Access Code Users

1. Navigate to `/influencers`
2. Click "Have an Access Code?"
3. Enter access code
4. System validates code
5. Create account (email, username, password)
6. Account automatically approved
7. Redirected to onboarding

### For Influencers

1. Complete 3-step onboarding
2. Access dashboard with 6 sections:
   - **Custom Codes**: Create branded referral codes
   - **QR Codes**: View/download QR codes
   - **Performance**: Track signups, conversions, earnings
   - **Materials**: Download marketing assets
   - **Earnings**: View balance, request payouts
   - **Settings**: Update profile, payment info

### For Admins

1. Navigate to `/admin/influencers`
2. **Applications Tab**: Review and approve/reject applications
3. **Influencers Tab**: View all active influencers, manage accounts
4. **Access Codes Tab**: Generate codes for recruited advocates
5. **Payouts Tab**: Review and process payout requests
6. **Analytics Tab**: View performance metrics

## Test Scenarios

### Scenario 1: Public Application
1. Navigate to landing page
2. Click "Apply Now"
3. Fill out application
4. Submit
5. Verify application saved with status 'pending'
6. Admin approves
7. Verify approval email sent
8. Influencer can log in

### Scenario 2: Access Code Flow
1. Admin generates access code
2. User navigates to landing page
3. Enters access code
4. Code validated
5. User creates account
6. Account auto-approved
7. User completes onboarding

### Scenario 3: Custom Code Generation
1. Influencer logs in
2. Navigate to Custom Codes section
3. Enter custom code (e.g., "TimmyDoesDallas")
4. Check availability
5. Generate code
6. Verify QR code generated
7. Verify code saved to database

### Scenario 4: Payout Request
1. Influencer has $50+ earnings
2. Navigate to Earnings section
3. Request payout
4. Verify payout request created
5. Admin reviews and approves
6. Payout processed

### Scenario 5: Admin Management
1. View pending applications
2. Approve application with custom commission rate
3. Generate access code
4. View influencer performance
5. Process payout request

## Demo Data

See `demo/seed_data.sql` for:
- Sample influencer applications
- Active influencers with custom codes
- Access codes (used/unused)
- Payout requests
- Performance data

## Security

- Separate influencer auth (or use existing Supabase Auth)
- RLS policies restrict data access
- Admin-only access to management functions
- Access codes expire and can be deactivated
- Minimum payout threshold ($50)

## Future Enhancements

- Influencer leaderboard
- Monthly performance reports
- Tiered commission structure
- Bonus incentives
- Influencer-only community forum
- Advanced analytics and reporting


