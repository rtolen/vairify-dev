# Profile Wizard - Client Role Support

## Feature Description

Multi-step profile wizard that supports both provider and client roles. Providers complete 5 steps (Language, Personal Info, Appearance, Services, Pricing), while clients complete 3 steps (Language, Personal Info, Settings). The wizard automatically detects user role and conditionally renders appropriate steps.

## Features

- **Role Detection**: Automatically detects user role from profiles table or sessionStorage
- **Provider Flow (5 steps)**:
  1. Language Selection
  2. Personal Info (username required)
  3. Appearance (optional)
  4. Services (from database)
  5. Pricing (Included/Extra toggles)
- **Client Flow (3 steps)**:
  1. Language Selection
  2. Personal Info (all optional)
  3. Settings (visibility, notifications, profile links)
- **Auto-save**: Progress saved every 30 seconds and on step navigation
- **Database Integration**: Services pulled from `service_categories` and `service_options` tables
- **Shared Components**: Common steps (Language, Personal Info) shared between roles

## Components

### Main Component
- `ProfileWizard.tsx` - Main orchestrator component with role detection

### Step Components
- `LanguageStep.tsx` - Language selection (shared)
- `PersonalInfoStep.tsx` - Personal info with role-based username requirement
- `AppearanceStep.tsx` - Physical appearance (provider only)
- `ServicesStep.tsx` - Service selection from database (provider only)
- `PricingStep.tsx` - Service pricing with Included/Extra toggles (provider only)
- `ClientSettingsStep.tsx` - Client settings (client only)

### Supporting Components
- `ProfilePhotoUpload.tsx` - Avatar upload component
- `TierBadge.tsx` - Provider tier badge display

## Database Schema

### Required Tables

1. **service_categories** - Service categories
   - `id`, `name`, `display_name`, `description`, `icon`, `display_order`, `is_active`, `parent_category_id`

2. **service_options** - Individual services
   - `id`, `category_id`, `name`, `display_name`, `description`, `base_price`, `duration_minutes`, `is_active`, `display_order`

3. **provider_service_pricing** - Provider pricing
   - `id`, `user_id`, `service_option_id`, `price_type` ('included'/'extra'), `custom_price`, `is_active`

4. **profiles** - User profiles
   - `id`, `user_id`, `username` (provider only), `avatar_url`, `bio`, etc.

5. **provider_profiles** - Provider-specific data
   - `user_id`, `username`, `height`, `weight`, `hair_color`, `hair_length`, `eye_color`, `body_type`, `ethnicity`, `age_range`, `services_offered`

## Setup Instructions

1. **Run Database Migration**:
   ```bash
   # Migration file: 20251205000000_create_service_tables.sql
   supabase migration up
   ```

2. **Install Dependencies**:
   ```bash
   npm install react-hook-form zod @hookform/resolvers
   ```

3. **Integration**:
   - Copy `ProfileWizard.tsx` to your pages directory
   - Copy all step components to `components/profile/`
   - Add route:
     ```tsx
     <Route path="/profile-wizard" element={<ProfileWizard />} />
     ```

## Usage

### For Providers

1. Navigate to `/profile-wizard`
2. System detects provider role (from `provider_profiles` table or sessionStorage)
3. Complete 5 steps:
   - Select languages
   - Enter username (required) and optional bio/avatar
   - Add appearance details (all optional)
   - Select services from database
   - Set pricing (Included/Extra for each service)
4. Profile saved to `provider_profiles` and `provider_service_pricing` tables

### For Clients

1. Navigate to `/profile-wizard`
2. System detects client role (default if no provider profile)
3. Complete 3 steps:
   - Select languages
   - Add personal info (all optional)
   - Configure settings (visibility, notifications, profile links)
4. Profile saved to `profiles` table

## Role Detection Logic

1. Check `sessionStorage.getItem('vairify_role')` (set during onboarding)
2. If not found, check if user has entry in `provider_profiles` table
3. If provider profile exists → provider role
4. Otherwise → client role (default)

## Auto-save

- Progress saved to `localStorage` every 30 seconds
- Progress saved to database on step navigation
- Draft restored on component mount
- Draft cleared on successful completion

## Test Scenarios

### Scenario 1: Provider Profile Creation
1. User with provider role navigates to wizard
2. Verify all 5 steps are shown
3. Username is required in step 2
4. Services loaded from database
5. Pricing saved correctly

### Scenario 2: Client Profile Creation
1. User with client role navigates to wizard
2. Verify only 3 steps shown (Language, Personal Info, Settings)
3. No username required
4. Settings saved to profiles table

### Scenario 3: Auto-save
1. Fill out form partially
2. Navigate away
3. Return to wizard
4. Verify draft is restored

### Scenario 4: Role Detection
1. Provider user → should see 5 steps
2. Client user → should see 3 steps
3. New user → defaults to client (3 steps)

## Demo Data

See `demo/seed_data.sql` for:
- Sample service categories
- Sample service options
- Sample provider pricing

## Design

- Blue-to-cyan gradient background
- Rounded corners (rounded-lg, rounded-xl)
- Progress indicator at top
- Step indicators with checkmarks
- Sticky footer with navigation
- Responsive design (mobile/desktop)

## Future Enhancements

- Profile photo cropping/editing
- Service category management UI
- Bulk pricing import/export
- Profile preview before saving
- Social media link validation


