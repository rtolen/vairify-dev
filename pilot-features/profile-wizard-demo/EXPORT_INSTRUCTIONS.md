# Profile Wizard Export Instructions

## Files to Export

### Main Component
- `src/pages/ProfileWizard.tsx`

### Step Components
- `src/components/profile/LanguageStep.tsx`
- `src/components/profile/PersonalInfoStep.tsx`
- `src/components/profile/AppearanceStep.tsx`
- `src/components/profile/ServicesStep.tsx`
- `src/components/profile/PricingStep.tsx`
- `src/components/profile/ClientSettingsStep.tsx`

### Supporting Components
- `src/components/profile/ProfilePhotoUpload.tsx`
- `src/components/profile/TierBadge.tsx`

### Database Migration
- `supabase/migrations/20251205000000_create_service_tables.sql`

### Hooks (if needed)
- `src/hooks/useProviderProfile.ts`

## Dependencies

```json
{
  "react-hook-form": "^7.x",
  "zod": "^3.x",
  "@hookform/resolvers": "^3.x",
  "sonner": "^1.x"
}
```

## Integration Steps

1. Copy all files to your project
2. Run database migration
3. Ensure Supabase client is configured
4. Add route to your router
5. Test role detection logic

## Standalone Demo Setup

To create a standalone demo:

1. Create new React app
2. Install dependencies
3. Copy components
4. Set up Supabase connection
5. Seed demo data
6. Test both provider and client flows


