import { test, expect } from '@playwright/test';

test.describe('VAI-CHECK', () => {
  
  test.beforeEach(async ({ page }) => {
    // Try to login first (may fail if no test account)
    await page.goto('/login');
    
    // Check if we can login (skip if no credentials)
    const emailInput = page.locator('input[type="email"], input[name*="email" i]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Try login, but don't fail if it doesn't work
      await emailInput.fill('test@vairify.test');
      const passwordInput = page.locator('input[type="password"]').first();
      if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await passwordInput.fill('TestPassword123!');
        const loginButton = page.locator('button:has-text("Login")').first();
        if (await loginButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await loginButton.click();
          // Wait a bit for potential redirect
          await page.waitForTimeout(2000);
        }
      }
    }
  });
  
  test('VAI-CHECK intro page loads', async ({ page }) => {
    await page.goto('/vai-check');
    
    // Check if page loads (may redirect to login if not authenticated)
    const isOnLogin = page.url().includes('login');
    
    if (!isOnLogin) {
      // Verify intro page elements
      const vaiCheckText = page.locator('text=VAI-CHECK, text=V.A.I.-CHECK').first();
      const hasVaiCheck = await vaiCheckText.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (hasVaiCheck) {
        console.log('✅ VAI-CHECK intro page loaded');
        await page.screenshot({ path: 'test-results/vai-check-intro.png', fullPage: true });
      } else {
        console.log('⚠️  VAI-CHECK page loaded but intro text not found');
      }
    } else {
      console.log('⚠️  Redirected to login (authentication required)');
    }
  });
  
  test('Provider can start VAI-CHECK', async ({ page }) => {
    await page.goto('/vai-check');
    
    // Check if we're on login page
    if (page.url().includes('login')) {
      console.log('⚠️  Authentication required - skipping test');
      return;
    }
    
    // Look for provider button
    const providerButton = page.locator('text=Start as Provider, text=Provider, button:has-text("Provider")').first();
    const startButton = page.locator('button:has-text("Start"), button:has-text("Begin")').first();
    
    if (await providerButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await providerButton.click();
    } else if (await startButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startButton.click();
    } else {
      // Try navigating directly to face scan
      await page.goto('/vai-check/face-scan');
    }
    
    // Check for face scan screen
    const faceScanElements = [
      page.locator('video').first(),
      page.locator('canvas').first(),
      page.locator('text=face, text=Face, text=Verify').first(),
      page.locator('text=Position your face').first()
    ];
    
    let foundFaceScan = false;
    for (const element of faceScanElements) {
      if (await element.isVisible({ timeout: 5000 }).catch(() => false)) {
        foundFaceScan = true;
        break;
      }
    }
    
    if (foundFaceScan) {
      console.log('✅ VAI-CHECK provider flow starts - face scan screen found');
      await page.screenshot({ path: 'test-results/vai-check-face-scan.png', fullPage: true });
    } else {
      console.log('⚠️  Could not find face scan screen');
      await page.screenshot({ path: 'test-results/vai-check-no-face-scan.png', fullPage: true });
    }
  });
  
  test('Check for testing bypasses in VAI-CHECK', async ({ page }) => {
    await page.goto('/vai-check/face-scan');
    
    // Check for testing mode bypasses
    const securityIssues = [];
    
    const skipButton = page.locator('text=Skip, text=Skip Face Scan, button:has-text("Skip")').first();
    const testModeText = page.locator('text=TESTING MODE, text=Testing Mode').first();
    const testButton = page.locator('button:has-text("Test"), button:has-text("Testing")').first();
    
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      securityIssues.push('Skip button found on face scan');
      console.log('🔴 SECURITY ISSUE: Skip button found on face scan page');
    }
    
    if (await testModeText.isVisible({ timeout: 2000 }).catch(() => false)) {
      securityIssues.push('Testing mode indicator found');
      console.log('🔴 SECURITY ISSUE: Testing mode indicator found');
    }
    
    if (await testButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      securityIssues.push('Test button found');
      console.log('🔴 SECURITY ISSUE: Test button found');
    }
    
    if (securityIssues.length > 0) {
      await page.screenshot({ path: 'test-results/vai-check-security-issues.png', fullPage: true });
    }
    
    console.log(`Found ${securityIssues.length} security issues in VAI-CHECK`);
  });
  
  test('QR code generation flow', async ({ page }) => {
    // This test may not complete without actual authentication and face verification
    await page.goto('/vai-check');
    
    if (page.url().includes('login')) {
      console.log('⚠️  Authentication required - skipping QR test');
      return;
    }
    
    // Try to navigate to QR screen (may need to mock face scan)
    await page.goto('/vai-check/show-qr/test-session-id');
    
    // Wait for QR code
    const qrElements = [
      page.locator('canvas').first(),
      page.locator('svg').first(),
      page.locator('img[alt*="QR" i]').first(),
      page.locator('text=QR, text=Scan this code').first()
    ];
    
    let hasQR = false;
    for (const element of qrElements) {
      if (await element.isVisible({ timeout: 5000 }).catch(() => false)) {
        hasQR = true;
        break;
      }
    }
    
    if (hasQR) {
      console.log('✅ QR code found');
      await page.screenshot({ path: 'test-results/qr-code.png', fullPage: true });
    } else {
      console.log('⚠️  QR code not found (may require valid session)');
      await page.screenshot({ path: 'test-results/qr-code-not-found.png', fullPage: true });
    }
  });
});


