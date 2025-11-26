-- Add early_access to referral_tier enum
ALTER TYPE referral_tier ADD VALUE IF NOT EXISTS 'early_access';