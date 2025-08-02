const http = require('http');

async function checkPort(port) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: port,
      path: '/api/settings/general',
      method: 'GET',
      timeout: 1000
    }, (res) => {
      resolve(true);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.on('timeout', () => {
      resolve(false);
    });
    
    req.end();
  });
}

async function findActivePort() {
  console.log('🔍 Checking which port your Next.js dev server is running on...\n');
  
  const portsToCheck = [3000, 3001, 3002, 3003];
  
  for (const port of portsToCheck) {
    const isActive = await checkPort(port);
    if (isActive) {
      console.log(`✅ Server is running on port ${port}`);
      console.log(`📋 Your calendar redirect URI should be: http://localhost:${port}/api/auth/google-calendar/callback\n`);
      
      console.log('🔧 To update your Google OAuth configuration:');
      console.log('1. Go to https://console.cloud.google.com/');
      console.log('2. Navigate to APIs & Services > Credentials');
      console.log('3. Edit your OAuth 2.0 Client ID');
      console.log(`4. Add this redirect URI: http://localhost:${port}/api/auth/google-calendar/callback`);
      console.log('5. Save the changes');
      
      return;
    } else {
      console.log(`❌ No server found on port ${port}`);
    }
  }
  
  console.log('\n⚠️  No active Next.js server found. Please start your dev server first with:');
  console.log('npm run dev');
}

findActivePort().catch(console.error);
