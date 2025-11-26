# PILOT FEATURES - Standalone Exportable Modules

This directory contains 4 pilot features implemented as independent, exportable modules:

1. **Feature 1: Profile Wizard** - Client/Provider role support ✅
2. **Feature 2: VAI CHECK** - Manual verification fallback ⏳
3. **Feature 3: TrueRevu** - Backend completion ⏳
4. **Feature 4: Referrals** - Email/SMS sending ⏳

Each feature is self-contained with:
- Components/pages
- Database migrations
- Edge functions (where applicable)
- Demo/seed data
- README with setup instructions

---

## Structure

```
pilot-features/
├── feature-1-profile-wizard/     ✅ Complete
├── feature-2-vai-check-manual/   ⏳ In Progress
├── feature-3-truerevu/           ⏳ In Progress
└── feature-4-referrals/          ⏳ In Progress
```

---

## Export Requirements

Each feature exports as standalone module:

```
feature-name/
├── components/
│   └── [feature components]
├── pages/
│   └── [feature pages]
├── supabase/
│   ├── functions/
│   │   └── [edge functions]
│   └── migrations/
│       └── [database migrations]
├── demo/
│   └── [seed data files]
├── README.md
├── package.json
└── .env.example
```

---

## Usage

Each feature includes a README with:
- Feature overview
- Setup instructions
- Database setup
- API key configuration
- Demo data loading
- Running standalone
- Integration with main app (optional)

---

**Status:** Feature 1 Complete ✅ | Features 2-4 In Progress ⏳


