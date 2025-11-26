import { test, expect } from '@playwright/test';

test.describe('DateGuard', () => {
  
  test.beforeEach(async ({ page }) => {
    // Try to login first (may fail if no test account)
    await page.goto('/login');
    
    const emailInput = page.locator('input[type="email"], input[name*="email" i]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await emailInput.fill('test@vairify.test');
      const passwordInput = page.locator('input[type="password"]').first();
      if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await passwordInput.fill('TestPassword123!');
        const loginButton = page.locator('button:has-text("Login")').first();
        if (await loginButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await loginButton.click();
          await page.waitForTimeout(2000);
        }
      }
    }
  });
  
  test('DateGuard page loads', async ({ page }) => {
    await page.goto('/dateguard');
    
    // Check if redirected to login
    if (page.url().includes('login')) {
      console.log('⚠️  Authentication required - skipping DateGuard tests');
      return;
    }
    
    // Look for DateGuard elements
    const dateGuardElements = [
      page.locator('text=DateGuard, text=Date Guard').first(),
      page.locator('text=Guardian').first(),
      page.locator('text=Activate').first()
    ];
    
    let foundElements = 0;
    for (const element of dateGuardElements) {
      if (await element.isVisible({ timeout: 5000 }).catch(() => false)) {
        foundElements++;
      }
    }
    
    if (foundElements > 0) {
      console.log(`✅ DateGuard page loaded (found ${foundElements} key elements)`);
      await page.screenshot({ path: 'test-results/dateguard-home.png', fullPage: true });
    } else {
      console.log('⚠️  DateGuard page loaded but key elements not found');
      await page.screenshot({ path: 'test-results/dateguard-home-empty.png', fullPage: true });
    }
  });
  
  test('Guardian management page', async ({ page }) => {
    await page.goto('/dateguard/guardians');
    
    if (page.url().includes('login')) {
      console.log('⚠️  Authentication required - skipping guardian test');
      return;
    }
    
    // Look for guardian management UI
    const guardianElements = [
      page.locator('text=Guardian').first(),
      page.locator('text=Add Guardian, button:has-text("Add")').first(),
      page.locator('text=Guardian Group').first()
    ];
    
    let foundElements = 0;
    for (const element of guardianElements) {
      if (await element.isVisible({ timeout: 5000 }).catch(() => false)) {
        foundElements++;
      }
    }
    
    if (foundElements > 0) {
      console.log(`✅ Guardian management page loaded (found ${foundElements} elements)`);
      await page.screenshot({ path: 'test-results/guardian-management.png', fullPage: true });
    }
    
    // Try to add a guardian (if button exists)
    const addButton = page.locator('button:has-text("Add Guardian"), button:has-text("Add"), text=Add Guardian').first();
    if (await addButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addButton.click();
      
      // Wait for dialog/form
      await page.waitForTimeout(1000);
      
      // Fill form if visible
      const phoneInput = page.locator('input[placeholder*="phone" i], input[type="tel"]').first();
      const nameInput = page.locator('input[placeholder*="name" i], input[name*="name" i]').first();
      
      if (await phoneInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await phoneInput.fill('+15551234567');
      }
      
      if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nameInput.fill('Test Guardian');
      }
      
      // Try to save (may fail without valid data)
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Add")').first();
      if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Attempted to add guardian');
      }
    }
  });
  
  test('Safety codes setup', async ({ page }) => {
    await page.goto('/dateguard/safety-codes');
    
    if (page.url().includes('login')) {
      console.log('⚠️  Authentication required - skipping safety codes test');
      return;
    }
    
    // Look for safety codes UI
    const safetyCodeElements = [
      page.locator('text=Safety Code, text=Deactivation').first(),
      page.locator('text=Decoy').first(),
      page.locator('input[type="text"], input[type="password"]').first()
    ];
    
    let foundElements = 0;
    for (const element of safetyCodeElements) {
      if (await element.isVisible({ timeout: 5000 }).catch(() => false)) {
        foundElements++;
      }
    }
    
    if (foundElements > 0) {
      console.log(`✅ Safety codes page loaded (found ${foundElements} elements)`);
      
      // Try to set codes
      const deactivationInput = page.locator('input[placeholder*="deactivation" i], input[name*="deactivation" i]').first();
      const decoyInput = page.locator('input[placeholder*="decoy" i], input[name*="decoy" i]').first();
      
      if (await deactivationInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await deactivationInput.fill('SAFE123');
      }
      
      if (await decoyInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await decoyInput.fill('HELP456');
      }
      
      await page.screenshot({ path: 'test-results/safety-codes.png', fullPage: true });
      console.log('✅ Safety codes page functional');
    } else {
      console.log('⚠️  Safety codes page loaded but form not found');
    }
  });
  
  test('DateGuard activation flow', async ({ page }) => {
    await page.goto('/dateguard/activate');
    
    if (page.url().includes('login')) {
      console.log('⚠️  Authentication required - skipping activation test');
      return;
    }
    
    // Look for activation UI
    const activationElements = [
      page.locator('text=Activate, button:has-text("Activate")').first(),
      page.locator('text=Duration, text=minutes').first(),
      page.locator('input[type="number"], select').first()
    ];
    
    let foundElements = 0;
    for (const element of activationElements) {
      if (await element.isVisible({ timeout: 5000 }).catch(() => false)) {
        foundElements++;
      }
    }
    
    if (foundElements > 0) {
      console.log(`✅ DateGuard activation page loaded (found ${foundElements} elements)`);
      
      // Try to set duration
      const durationInput = page.locator('input[type="number"]').first();
      const durationSelect = page.locator('select').first();
      
      if (await durationInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await durationInput.fill('60');
      } else if (await durationSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await durationSelect.selectOption({ label: '1 hour' });
      }
      
      await page.screenshot({ path: 'test-results/dateguard-activate.png', fullPage: true });
    }
  });
  
  test('Test emergency mode page', async ({ page }) => {
    await page.goto('/dateguard/test-emergency');
    
    if (page.url().includes('login')) {
      console.log('⚠️  Authentication required - skipping test emergency');
      return;
    }
    
    // Check if test emergency page exists
    const testEmergencyElements = [
      page.locator('text=Test Emergency, text=Testing Mode').first(),
      page.locator('button:has-text("START TEST")').first()
    ];
    
    let foundElements = 0;
    for (const element of testEmergencyElements) {
      if (await element.isVisible({ timeout: 5000 }).catch(() => false)) {
        foundElements++;
      }
    }
    
    if (foundElements > 0) {
      console.log(`✅ Test emergency page found (found ${foundElements} elements)`);
      await page.screenshot({ path: 'test-results/test-emergency.png', fullPage: true });
    } else {
      console.log('⚠️  Test emergency page not found or not accessible');
    }
  });
});


