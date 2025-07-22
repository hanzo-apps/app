import { test } from '@playwright/test'

test('Manual showcase of all features', async ({ page }) => {
  console.log('🚀 Starting manual showcase...\n')
  
  // Helper to take screenshot
  let index = 1
  const snap = async (name: string, wait = 1000) => {
    await page.waitForTimeout(wait)
    const filename = `test-results/showcase/manual-${String(index).padStart(2, '0')}-${name}.png`
    await page.screenshot({ path: filename, fullPage: true })
    console.log(`📸 ${index}. ${name}`)
    index++
  }
  
  // Start fresh
  await page.goto('http://localhost:5173')
  await snap('initial-load', 2000)
  
  // Bypass onboarding
  await page.evaluate(() => {
    localStorage.setItem('@ui.store', JSON.stringify({
      onboardingStep: 'v1_completed',
      focusedWidget: 'SEARCH',
      query: '',
      selectedIndex: 0,
      theme: 'dark',
      fontFamily: 'system',
      fontSize: 14,
      colorScheme: 'monochrome'
    }))
  })
  
  await page.reload()
  await snap('launcher-dark', 2000)
  
  // Type search query
  await page.type('input[placeholder="Search apps, files and quick links"]', 'calculator')
  await snap('search-calculator')
  
  // Clear search
  await page.keyboard.press('Escape')
  await snap('launcher-cleared')
  
  // Open settings with Meta+Comma
  console.log('\n🔧 Opening Settings...')
  await page.keyboard.press('Meta+Comma')
  await snap('settings-general', 2000)
  
  // Click Appearance tab
  console.log('\n🎨 Testing Appearance Settings...')
  const tabs = await page.$$('button')
  for (const tab of tabs) {
    const text = await tab.textContent()
    if (text?.includes('Appearance')) {
      await tab.click()
      break
    }
  }
  await snap('appearance-dark', 1500)
  
  // Switch to light theme
  const radios = await page.$$('input[type="radio"]')
  for (const radio of radios) {
    const value = await radio.getAttribute('value')
    if (value === 'light') {
      await radio.click()
      break
    }
  }
  await snap('appearance-light', 1500)
  
  // Switch back to dark
  for (const radio of radios) {
    const value = await radio.getAttribute('value')
    if (value === 'dark') {
      await radio.click()
      break
    }
  }
  await page.waitForTimeout(500)
  
  // Click Local AI tab
  console.log('\n🤖 Testing Local AI Settings...')
  for (const tab of tabs) {
    const text = await tab.textContent()
    if (text?.includes('Local AI')) {
      await tab.click()
      break
    }
  }
  await snap('local-ai-models', 1500)
  
  // Click download on first model
  const buttons = await page.$$('button')
  for (const button of buttons) {
    const text = await button.textContent()
    if (text?.includes('Download')) {
      await button.click()
      break
    }
  }
  await snap('local-ai-downloading', 2000)
  
  // Go back to launcher
  console.log('\n🏠 Returning to launcher...')
  await page.keyboard.press('Escape')
  await snap('launcher-return')
  
  // Test AI Chat with Tab
  console.log('\n💬 Testing AI Chat...')
  await page.keyboard.press('Tab')
  await snap('ai-chat', 2000)
  
  // Back to launcher
  await page.keyboard.press('Meta+k')
  await snap('final-launcher', 1500)
  
  console.log('\n✅ Showcase complete!')
  console.log('📁 All screenshots saved to: test-results/showcase/')
  console.log(`📸 Total screenshots: ${index - 1}`)
})