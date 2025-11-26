# E2E Tests with Playwright

This directory contains end-to-end tests for the Vairify platform using Playwright.

## Setup

1. Install Playwright:
```bash
npm install -D @playwright/test
npx playwright install
```

2. Make sure the dev server is running (or it will start automatically):
```bash
npm run dev
```

## Running Tests

### Run all tests:
```bash
npm run test:e2e
```

### Run with UI (interactive):
```bash
npm run test:e2e:ui
```

### Run in headed mode (see browser):
```bash
npm run test:e2e:headed
```

### Run specific test file:
```bash
npx playwright test e2e/auth.spec.ts
npx playwright test e2e/security.spec.ts
```

### View HTML report:
```bash
npm run test:e2e:report
```

## Test Files

- **`auth.spec.ts`** - Authentication flows (registration, login, protected routes)
- **`vai-check.spec.ts`** - VAI-CHECK feature testing
- **`dateguard.spec.ts`** - DateGuard feature testing
- **`security.spec.ts`** - Security vulnerability checks

## Test Results

Screenshots and test results are saved to `test-results/` directory.

## Notes

- Tests are designed to be resilient (won't fail if test accounts don't exist)
- Tests check for security issues and report them
- Some tests may require actual authentication to complete fully
- Tests will automatically start the dev server if not running


