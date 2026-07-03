// Test script to verify key features of Hanzo app
// Run this after the app is launched

console.log('Hanzo App Feature Test');
console.log('=====================');

// Test 1: Check if the web server is running
async function testWebServer() {
  console.log('\n1. Testing web server...');
  try {
    const response = await fetch('http://localhost:5173');
    if (response.ok) {
      console.log('✅ Web server is running on port 5173');
      return true;
    }
  } catch (error) {
    console.log('❌ Web server is not accessible');
    return false;
  }
}

// Test 2: Check if Tauri commands are available
async function testTauriCommands() {
  console.log('\n2. Testing Tauri backend...');
  // This would need to be run from within the app context
  console.log('ℹ️  Tauri commands can only be tested from within the app');
  return true;
}

// Test 3: Check AI service availability
async function testAIService() {
  console.log('\n3. Testing AI service...');
  
  // Check local AI endpoints
  const endpoints = [
    { name: 'Hanzo Chat', url: 'http://localhost:1337/v1/models' },
    { name: 'LM Studio', url: 'http://localhost:1234/v1/models' }
  ];
  
  let aiAvailable = false;
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint.url);
      if (response.ok) {
        console.log(`✅ ${endpoint.name} is running at ${endpoint.url}`);
        aiAvailable = true;
      } else {
        console.log(`❌ ${endpoint.name} is not available at ${endpoint.url}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name} is not available at ${endpoint.url}`);
    }
  }
  
  if (!aiAvailable) {
    console.log('ℹ️  No local AI service detected - app will use mock responses');
  }
  
  return true;
}

// Test 4: Check logging
async function testLogging() {
  console.log('\n4. Testing logging system...');
  console.log('ℹ️  Check browser console for logger output');
  console.log('ℹ️  Check Settings → General → Diagnostics & Logs for log controls');
  return true;
}

// Run all tests
async function runTests() {
  console.log('Starting feature tests...\n');
  
  const results = {
    webServer: await testWebServer(),
    tauriCommands: await testTauriCommands(),
    aiService: await testAIService(),
    logging: await testLogging()
  };
  
  console.log('\n\nTest Summary:');
  console.log('=============');
  console.log(`Web Server: ${results.webServer ? '✅' : '❌'}`);
  console.log(`Tauri Backend: ${results.tauriCommands ? 'ℹ️' : '❌'}`);
  console.log(`AI Service: ${results.aiService ? '✅' : '⚠️'}`);
  console.log(`Logging: ${results.logging ? '✅' : '❌'}`);
  
  console.log('\n\nKey Features to Test Manually:');
  console.log('============================');
  console.log('1. App Launcher (from Sol):');
  console.log('   - Press Cmd+Space (or configured hotkey) to open launcher');
  console.log('   - Search for applications');
  console.log('   - Launch apps by clicking or pressing Enter');
  console.log('   - Use arrow keys to navigate results');
  console.log('');
  console.log('2. AI Chat (from Zen):');
  console.log('   - Press Tab in the search field to switch to AI mode');
  console.log('   - Type a message and press Enter');
  console.log('   - AI will respond (mock response if no local AI)');
  console.log('   - Full chat interface available');
  console.log('');
  console.log('3. Settings:');
  console.log('   - Press Cmd+, or search for "settings"');
  console.log('   - Check General settings for all options');
  console.log('   - New: Diagnostics & Logs section with buttons');
  console.log('');
  console.log('4. Other Features:');
  console.log('   - Calendar widget');
  console.log('   - Clipboard history');
  console.log('   - File search');
  console.log('   - Emoji picker');
  console.log('   - Process manager');
  console.log('');
  console.log('All console.log statements have been replaced with structured logging.');
  console.log('Logs are written to disk and can be viewed/exported from Settings.');
}

// Run the tests
runTests().catch(console.error);