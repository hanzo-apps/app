// Test voice functionality
const { invoke } = require('@tauri-apps/api/core');

async function testVoice() {
  try {
    console.log('Testing voice output...');
    
    // Test basic speech
    await invoke('speak_text', { 
      text: 'Hello! Voice functionality is now working in the Hanzo app!',
      voice: 'Samantha',
      rate: 1.0
    });
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test available voices
    const voices = await invoke('get_available_voices');
    console.log('Available voices:', voices);
    
    // Test voice demo
    await invoke('voice_demo_hello');
    
  } catch (error) {
    console.error('Voice test error:', error);
  }
}

// Run the test
testVoice();