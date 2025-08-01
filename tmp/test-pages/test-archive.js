// Simple test script to verify analyst archival functionality
const fetch = require('node-fetch');

async function testArchive() {
  try {
    // Test the API endpoint
    console.log('Testing analyst archive functionality...');
    
    const response = await fetch('http://localhost:3001/api/analysts/test-id', {
      method: 'DELETE',
    });
    
    const result = await response.json();
    console.log('Response:', result);
    
    if (response.ok && result.success) {
      console.log('✅ Archive functionality appears to be working');
    } else {
      console.log('❌ Archive functionality has issues:', result.error);
    }
  } catch (error) {
    console.error('❌ Error testing archive:', error.message);
  }
}

// Run the test
testArchive();
