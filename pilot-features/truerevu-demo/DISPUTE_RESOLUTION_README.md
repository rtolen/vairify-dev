# Dispute Resolution System - TrueRevu

## Feature Description

Complete dispute resolution system for TrueRevu reviews. Allows users to dispute reviews they believe are inaccurate, false, or defamatory. Disputes are reviewed by a randomly selected panel of 6 community members (3 clients + 3 providers) who vote on the outcome.

## Features

- **Dispute Filing**: "Dispute this Review" button on review cards
- **Dispute Form**: Select reason, upload statement + evidence, auto-attach relevant DMs
- **Random Panel Selection**: 3 clients + 3 providers randomly selected
- **Panel Invitations**: Email invitations sent to panel members
- **Private Case Review**: Panel members review evidence privately
- **Voting System**: Encrypted votes (Favor Complainant/Respondent/No Decision)
- **Vote Tallies**: Admin-visible vote counts
- **Admin Resolution**: Dismiss, remove review, or issue warning
- **Outcome Notifications**: Sent to both parties

## Database Schema

### Migration: `20251205000006_add_dispute_resolution.sql`

Creates tables:
- `review_disputes` - Dispute records
- `dispute_panel_members` - Panel member assignments
- `dispute_votes` - Encrypted votes
- `dispute_vote_tallies` - Vote tallies (admin-visible)
- `dispute_notifications` - Notification records

## Components

### Pages
- `PanelDisputeReview.tsx` - Panel member case review and voting interface
- `TrueRevuDashboard.tsx` - Dashboard with "Pending Disputes to Review" tab
- `admin/DisputesAdmin.tsx` - Admin dispute management dashboard

### Components
- `DisputeButton.tsx` - Button to file dispute on review cards
- `DisputeFormDialog.tsx` - Dispute filing form
- `ReviewCardWithDispute.tsx` - Review card with dispute button

### Edge Functions
- `create-dispute/index.ts` - Creates dispute, selects panel, sends invitations
- `select-dispute-panel/index.ts` - Randomly selects 3 clients + 3 providers
- `send-panel-invitations/index.ts` - Sends email invitations to panel members
- `record-dispute-vote/index.ts` - Records encrypted vote, updates tallies

## Setup Instructions

1. **Run Database Migration**:
   ```bash
   supabase migration up
   ```

2. **Create Storage Bucket**:
   ```sql
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('disputes', 'disputes', true);
   ```

3. **Deploy Edge Functions**:
   ```bash
   supabase functions deploy create-dispute
   supabase functions deploy select-dispute-panel
   supabase functions deploy send-panel-invitations
   supabase functions deploy record-dispute-vote
   ```

4. **Environment Variables**:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxx  # For panel invitation emails
   ```

5. **Integration**:
   - Replace `ReviewCard` with `ReviewCardWithDispute` where reviews are displayed
   - Add route: `/truerevu/disputes/:disputeId` for panel review
   - Add route: `/truerevu` for TrueRevu dashboard
   - Add admin route: `/admin/disputes`

## Usage

### For Users (Filing Disputes)

1. View a review about you
2. Click "Dispute this Review" button
3. Select dispute reason (inaccurate/false/defamatory)
4. Write statement explaining why review should be disputed
5. Upload evidence (optional)
6. Relevant DMs auto-attached
7. Submit dispute
8. Panel is selected and invitations sent
9. Wait for panel decision
10. Receive outcome notification

### For Panel Members

1. Receive email invitation
2. Log in to TrueRevu dashboard
3. See "Pending Disputes to Review" tab
4. Click "Review Case" on assigned dispute
5. Review all evidence privately:
   - Review in question
   - Complainant's statement
   - Evidence documents/images
   - Relevant DMs
6. Cast vote:
   - Favor Complainant (review should be removed)
   - Favor Respondent (review is valid)
   - No Decision (insufficient evidence)
7. Vote is encrypted and recorded
8. Cannot change vote after submission

### For Admins

1. Navigate to `/admin/disputes`
2. View all disputes with vote tallies
3. Filter by status
4. Review vote counts:
   - Favor Complainant
   - Favor Respondent
   - No Decision
5. Take resolution action:
   - **Dismiss**: Dispute is invalid, no action
   - **Remove Review**: Delete the disputed review
   - **Issue Warning**: Warn reviewer about content
   - **No Action**: Review stays as-is
6. Add resolution notes
7. System sends outcome notifications to both parties

## Test Scenarios

### Scenario 1: File Dispute
1. User views review about them
2. Clicks "Dispute this Review"
3. Fills out dispute form
4. Uploads evidence
5. Submits dispute
6. Verify dispute created
7. Verify panel selected (3 clients + 3 providers)
8. Verify invitations sent

### Scenario 2: Panel Review
1. Panel member receives email
2. Logs in to dashboard
3. Sees dispute in "Pending Disputes" tab
4. Clicks "Review Case"
5. Reviews all evidence
6. Casts vote
7. Verify vote recorded and encrypted
8. Verify cannot vote again

### Scenario 3: Admin Resolution
1. All 6 panel members vote
2. Admin views dispute
3. Sees vote tallies (e.g., 4 favor complainant, 2 favor respondent)
4. Admin selects "Remove Review"
5. Review is deleted
6. Both parties receive outcome notification

### Scenario 4: Tie Breaking
1. Vote tallies are tied (3-3)
2. Admin reviews case
3. Admin makes final decision
4. Resolution action taken
5. Outcome notification sent

## Security

- Votes are encrypted before storage
- Panel members can only see disputes they're assigned to
- Users can only dispute reviews about themselves
- One vote per panel member per dispute
- Votes cannot be changed after submission
- Admin-only access to vote tallies
- Evidence stored securely in Supabase Storage

## Future Enhancements

- Automated outcome processing based on majority vote
- Panel member reputation system
- Dispute appeal process
- Anonymous panel voting (further anonymization)
- Panel member compensation/incentives
- Advanced evidence verification
- AI-assisted case summarization


