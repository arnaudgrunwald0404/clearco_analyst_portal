// Test the bulk upload API directly with sample data from our CSV
const testData = {
  awards: [
    {
      awardName: "Best HR Technology Innovation 2024",
      publicationDate: "2024-06-15",
      processStartDate: "2024-04-01", 
      contactInfo: "awards@hrtech.com",
      organizer: "HR Tech Conference",
      priority: "HIGH",
      topics: "AI, Machine Learning, Automation",
      notes: "Leading innovation award in HR technology space"
    },
    {
      awardName: "Workplace Excellence Award",
      publicationDate: "2024-08-20",
      processStartDate: "2024-05-15",
      contactInfo: "info@workplaceexcellence.org", 
      organizer: "Workplace Excellence Institute",
      priority: "MEDIUM",
      topics: "Employee Experience, Culture, Engagement",
      notes: "Recognizes outstanding workplace culture initiatives"
    }
  ]
};

async function testDirectAPI() {
  try {
    console.log('🧪 Testing Direct API Call...');
    console.log('📊 Sending data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch('http://localhost:3001/api/awards/bulk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Body:', JSON.stringify(result, null, 2));
    
    if (response.ok && result.success) {
      console.log('✅ Direct API test PASSED!');
      console.log(`✅ Created ${result.data.created?.length || 0} awards`);
      if (result.data.errors?.length > 0) {
        console.log('⚠️ Warnings/Errors:', result.data.errors);
      }
    } else {
      console.log('❌ Direct API test FAILED!');
      console.log('❌ Error:', result.error || 'Unknown error');
      if (result.details) {
        console.log('❌ Details:', result.details);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error.message);
  }
}

// Run the test
testDirectAPI();












