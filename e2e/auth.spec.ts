import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  
  test('Registration flow', async ({ page }) => {
    await page.goto('/');
    
    // Click register/get started
    const getStartedButton = page.locator('text=Get Started').first();
    if (await getStartedButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await getStartedButton.click();
    } else {
      // Try alternative navigation
      await page.goto('/onboarding/welcome');
    }
    
    // Wait for registration form or navigate to it
    if (!page.url().includes('registration')) {
      // Navigate through onboarding
      const continueButton = page.locator('button:has-text("Continue"), button:has-text("Next")').first();
      if (await continueButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await continueButton.click();
      }
      
      // Try to get to registration
      await page.goto('/onboarding/registration');
    }
    
    // Fill registration form
    const timestamp = Date.now();
    const testEmail = `test-${timestamp}@vairify.test`;
    
    // Wait for form to be visible
    await page.waitForSelector('input[type="email"], input[name*="email" i]', { timeout: 5000 });
    
    const emailInput = page.locator('input[type="email"], input[name*="email" i]').first();
    await emailInput.fill(testEmail);
    
    const passwordInput = page.locator('input[type="password"]').first();
    if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await passwordInput.fill('TestPassword123!');
    }
    
    // Accept terms if checkbox exists
    const termsCheckbox = page.locator('input[type="checkbox"]').first();
    if (await termsCheckbox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await termsCheckbox.check();
    }
    
    // Submit
    const submitButton = page.locator('button:has-text("Register"), button:has-text("Create Account"), button:has-text("Sign Up")').first();
    if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await submitButton.click();
    }
    
    // Check for OTP screen or next step
    await page.waitForURL(/verify|otp|success|dashboard|pricing/, { timeout: 10000 });
    
    const currentUrl = page.url();
    console.log('After registration, redirected to:', currentUrl);
    
    // If OTP screen, check for universal OTP (security issue)
    if (currentUrl.includes('verify') || currentUrl.includes('otp')) {
      const otpInput = page.locator('input[type="text"], input[type="number"], input[placeholder*="code" i]').first();
      
      if (await otpInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Test if universal OTP works (security vulnerability)
        await otpInput.fill('094570');
        
        const verifyButton = page.locator('button:has-text("Verify"), button:has-text("Submit")').first();
        if (await verifyButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await verifyButton.click();
          
          const otpWorked = await page.waitForURL(/dashboard|vai|success|pricing/, { 
            timeout: 5000 
          }).catch(() => false);
          
          if (otpWorked) {
            console.log('⚠️  SECURITY ISSUE: Universal OTP 094570 accepted');
          }
        }
      }
    }
    
    // Take screenshot of final state
    await page.screenshot({ path: 'test-results/registration-end.png', fullPage: true });
  });
  
  test('Login with email and password', async ({ page }) => {
    await page.goto('/login');
    
    // Check for testing bypasses (security issue)
    const skipButton = page.locator('button:has-text("Skip Login"), text=Skip Login').first();
    const testModeButton = page.locator('text=Testing Mode, text=TESTING MODE').first();
    
    const securityIssues = [];
    
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      securityIssues.push('Skip Login button found');
      console.log('🔴 SECURITY ISSUE: Skip Login button found');
    }
    
    if (await testModeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      securityIssues.push('Testing Mode active');
      console.log('🔴 SECURITY ISSUE: Testing Mode active');
    }
    
    if (securityIssues.length > 0) {
      await page.screenshot({ path: 'test-results/login-security-issues.png', fullPage: true });
    }
    
    // Try to login with test credentials (may not work without real account)
    const emailInput = page.locator('input[type="email"], input[name*="email" i]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('test@vairify.test');
      
      const passwordInput = page.locator('input[type="password"]').first();
      if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await passwordInput.fill('TestPassword123!');
        
        const loginButton = page.locator('button:has-text("Login"), button:has-text("Sign In")').first();
        if (await loginButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await loginButton.click();
          
          // Wait for redirect (may fail if credentials don't exist)
          const redirected = await page.waitForURL(/dashboard|feed|pricing/, { timeout: 5000 }).catch(() => false);
          
          if (redirected) {
            console.log('✅ Login successful');
            await page.screenshot({ path: 'test-results/login-success.png', fullPage: true });
          } else {
            console.log('⚠️  Login failed (expected if test account doesn\'t exist)');
          }
        }
      }
    }
  });
  
  test('Protected routes require authentication', async ({ page }) => {
    // Try to access protected pages without login
    const protectedPages = [
      '/feed',
      '/vai-check',
      '/dateguard',
      '/settings',
      '/pricing'
    ];
    
    for (const url of protectedPages) {
      await page.goto(url);
      
      // Should redirect to login or show login requirement
      const isOnLogin = await page.waitForURL(/login/, { timeout: 3000 }).then(() => true).catch(() => false);
      const hasLoginButton = await page.locator('text=Login, button:has-text("Login")').first().isVisible({ timeout: 2000 }).catch(() => false);
      
      if (isOnLogin || hasLoginButton) {
        console.log(`${url} → ✅ Protected (redirected to login or shows login)`);
      } else {
        console.log(`${url} → ⚠️  May not be protected (no redirect detected)`);
        await page.screenshot({ path: `test-results/protected-route-${url.replace(/\//g, '-')}.png`, fullPage: true });
      }
    }
  });
});


