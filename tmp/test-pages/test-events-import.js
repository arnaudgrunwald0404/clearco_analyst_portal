const XLSX = require('xlsx');
const path = require('path');

// Load and read the Excel file
function readEventsFile() {
  const filePath = '/Users/arnaudgrunwald/Downloads/Events Tracker.xlsx';
  
  try {
    console.log('📊 Reading Excel file:', filePath);
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    console.log('📋 Sheet name:', sheetName);
    
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`📈 Found ${data.length} rows of data\n`);
    
    // Display first few rows to understand structure
    console.log('🔍 Data structure (first 3 rows):');
    data.slice(0, 3).forEach((row, index) => {
      console.log(`Row ${index + 1}:`, Object.keys(row));
    });
    
    console.log('\n📋 All column headers found:');
    if (data.length > 0) {
      Object.keys(data[0]).forEach((col, index) => {
        console.log(`  ${index + 1}. "${col}"`);
      });
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error reading file:', error.message);
    return [];
  }
}

// Validation logic based on our Events API
function validateEventData(events) {
  console.log('\n🔍 Starting validation...\n');
  
  const validEvents = [];
  const errors = [];
  
  // Field mappings from our Events system
  const typeMapping = {
    'conference': 'CONFERENCE',
    'conf': 'CONFERENCE',
    'convention': 'CONFERENCE',
    'summit': 'CONFERENCE',
    'symposium': 'CONFERENCE',
    'meeting': 'CONFERENCE',
    'workshop': 'CONFERENCE',
    'seminar': 'CONFERENCE',
    'networking': 'CONFERENCE',
    'training': 'CONFERENCE',
    'networking or training event': 'CONFERENCE',
    'training event': 'CONFERENCE',
    'networking event': 'CONFERENCE',
    
    'exhibition': 'EXHIBITION',
    'exhibit': 'EXHIBITION',
    'expo': 'EXHIBITION',
    'show': 'EXHIBITION',
    'fair': 'EXHIBITION',
    'trade show': 'EXHIBITION',
    'tradeshow': 'EXHIBITION',
    
    'webinar': 'WEBINAR',
    'online event': 'WEBINAR',
    'virtual event': 'WEBINAR',
    'online seminar': 'WEBINAR',
    'virtual seminar': 'WEBINAR'
  };
  
  const statusMapping = {
    'evaluating': 'EVALUATING',
    'evaluation': 'EVALUATING',
    'under evaluation': 'EVALUATING',
    'considering': 'EVALUATING',
    'pending': 'EVALUATING',
    'reviewing': 'EVALUATING',
    'declined': 'NOT_GOING',
    'rejected': 'NOT_GOING',
    'cancelled': 'NOT_GOING',
    'not going': 'NOT_GOING',
    'not attending': 'NOT_GOING',
    
    'committed': 'COMMITTED',
    'confirmed': 'COMMITTED',
    'approved': 'COMMITTED',
    'accepted': 'COMMITTED',
    'going': 'COMMITTED',
    
    'contracted': 'CONTRACTED',
    'signed': 'CONTRACTED',
    'finalized': 'CONTRACTED',
    'booked': 'CONTRACTED'
  };
  
  const validAudienceGroups = ['Partners', 'Prospects', 'Analysts', 'Clients'];
  const validParticipationTypes = ['Attending Only', 'Exhibiting', 'Sponsoring'];
  
  events.forEach((event, index) => {
    const rowNum = index + 1;
    const rowErrors = [];
    
    console.log(`\n🔍 Validating Row ${rowNum}:`);
    
    // Map common column names to our expected fields
    const eventData = {};
    for (const [key, value] of Object.entries(event)) {
      const lowerKey = key.toLowerCase().trim();
      
      // Map event name variations
      if (lowerKey.includes('event') && lowerKey.includes('name') || 
          lowerKey === 'name' || lowerKey === 'title') {
        eventData.eventName = value;
      }
      // Map start date variations
      else if (lowerKey.includes('start') && lowerKey.includes('date') || 
               lowerKey.includes('event') && lowerKey.includes('date') ||
               lowerKey === 'date') {
        eventData.startDate = value;
      }
      // Map type variations
      else if (lowerKey.includes('type') || lowerKey === 'category') {
        eventData.type = value;
      }
      // Map status variations
      else if (lowerKey.includes('status') || lowerKey === 'state') {
        eventData.status = value;
      }
      // Map other fields
      else if (lowerKey.includes('link') || lowerKey.includes('url')) {
        eventData.link = value;
      }
      else if (lowerKey.includes('audience')) {
        eventData.audienceGroups = value;
      }
      else if (lowerKey.includes('participation')) {
        eventData.participationTypes = value;
      }
      else if (lowerKey.includes('owner') || lowerKey.includes('responsible')) {
        eventData.owner = value;
      }
      else if (lowerKey.includes('location') || lowerKey.includes('venue')) {
        eventData.location = value;
      }
      else if (lowerKey.includes('notes') || lowerKey.includes('comments')) {
        eventData.notes = value;
      }
    }
    
    console.log(`   📝 Event Name: "${eventData.eventName || 'MISSING'}"`);
    console.log(`   📅 Start Date: "${eventData.startDate || 'MISSING'}"`);
    console.log(`   🏷️  Type: "${eventData.type || 'MISSING'}"`);
    console.log(`   📊 Status: "${eventData.status || 'MISSING'}"`);
    
    // Validate required fields
    if (!eventData.eventName || eventData.eventName.toString().trim() === '') {
      rowErrors.push(`Event name is required`);
    }
    
    if (!eventData.startDate || eventData.startDate.toString().trim() === '') {
      rowErrors.push(`Start date is required`);
    } else {
      // Validate date format
      const date = new Date(eventData.startDate);
      if (isNaN(date.getTime())) {
        rowErrors.push(`Invalid start date format: "${eventData.startDate}"`);
      }
    }
    
    // Validate event type
    if (eventData.type) {
      const typeString = eventData.type.toString().trim();
      let mappedType = null;
      
      if (typeString.includes(',')) {
        const types = typeString.split(',').map(t => t.trim().toLowerCase());
        for (const type of types) {
          if (typeMapping[type]) {
            mappedType = typeMapping[type];
            break;
          }
        }
      } else {
        const normalizedType = typeString.toLowerCase();
        mappedType = typeMapping[normalizedType];
      }
      
      if (!mappedType) {
        rowErrors.push(`Invalid event type: "${eventData.type}". Will be mapped to CONFERENCE by default.`);
      } else {
        console.log(`   ✅ Type mapped: "${eventData.type}" → ${mappedType}`);
      }
    }
    
    // Validate status
    if (eventData.status) {
      const statusString = eventData.status.toString().trim();
      let mappedStatus = null;
      
      if (statusString.includes('/') || statusString.includes(',')) {
        const statuses = statusString.split(/[/,]/).map(s => s.trim().toLowerCase());
        for (const status of statuses) {
          if (statusMapping[status]) {
            mappedStatus = statusMapping[status];
            break;
          }
        }
      } else {
        const normalizedStatus = statusString.toLowerCase();
        mappedStatus = statusMapping[normalizedStatus];
      }
      
      if (!mappedStatus) {
        rowErrors.push(`Invalid status: "${eventData.status}". Will be set to EVALUATING by default.`);
      } else {
        console.log(`   ✅ Status mapped: "${eventData.status}" → ${mappedStatus}`);
      }
    }
    
    // Validate audience groups
    if (eventData.audienceGroups) {
      const audienceString = eventData.audienceGroups.toString();
      const audienceArray = audienceString.split(',').map(ag => ag.trim()).filter(ag => ag);
      const invalidAudiences = audienceArray.filter(ag => !validAudienceGroups.includes(ag));
      
      if (invalidAudiences.length > 0) {
        rowErrors.push(`Invalid audience groups: ${invalidAudiences.join(', ')}`);
      } else if (audienceArray.length > 0) {
        console.log(`   ✅ Audience groups: ${audienceArray.join(', ')}`);
      }
    }
    
    // Validate participation types
    if (eventData.participationTypes) {
      const participationString = eventData.participationTypes.toString();
      const participationArray = participationString.split(',').map(pt => pt.trim()).filter(pt => pt);
      const invalidParticipation = participationArray.filter(pt => !validParticipationTypes.includes(pt));
      
      if (invalidParticipation.length > 0) {
        rowErrors.push(`Invalid participation types: ${invalidParticipation.join(', ')}`);
      } else if (participationArray.length > 0) {
        console.log(`   ✅ Participation types: ${participationArray.join(', ')}`);
      }
    }
    
    if (rowErrors.length > 0) {
      console.log(`   ❌ Errors found:`);
      rowErrors.forEach(error => console.log(`      - ${error}`));
      errors.push(`Row ${rowNum}: ${rowErrors.join('; ')}`);
    } else {
      console.log(`   ✅ Row ${rowNum} is valid!`);
      validEvents.push(eventData);
    }
  });
  
  return { validEvents, errors };
}

// Generate summary report
function generateReport(totalRows, validEvents, errors) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 VALIDATION SUMMARY REPORT');
  console.log('='.repeat(60));
  
  console.log(`📈 Total rows processed: ${totalRows}`);
  console.log(`✅ Valid events: ${validEvents.length}`);
  console.log(`❌ Invalid events: ${errors.length}`);
  console.log(`📊 Success rate: ${((validEvents.length / totalRows) * 100).toFixed(1)}%`);
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS FOUND:');
    console.log('-'.repeat(40));
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  if (validEvents.length > 0) {
    console.log('\n✅ SAMPLE VALID EVENTS:');
    console.log('-'.repeat(40));
    validEvents.slice(0, 3).forEach((event, index) => {
      console.log(`${index + 1}. ${event.eventName || 'Unnamed Event'}`);
      console.log(`   Date: ${event.startDate || 'No date'}`);
      console.log(`   Type: ${event.type || 'No type'}`);
      console.log(`   Status: ${event.status || 'No status'}`);
    });
    
    if (validEvents.length > 3) {
      console.log(`   ... and ${validEvents.length - 3} more valid events`);
    }
  }
  
  console.log('\n🚀 IMPORT READINESS:');
  console.log('-'.repeat(40));
  if (validEvents.length === 0) {
    console.log('❌ File is NOT ready for import - no valid events found');
  } else if (errors.length === 0) {
    console.log('✅ File is READY for import - all events are valid!');
  } else {
    console.log(`⚠️  File is PARTIALLY ready - ${validEvents.length} events can be imported`);
    console.log(`   ${errors.length} events will be skipped due to errors`);
  }
  
  console.log('\n📋 FIELD MAPPING GUIDE:');
  console.log('-'.repeat(40));
  console.log('Required fields for import:');
  console.log('• Event Name (required)');
  console.log('• Start Date (required)');
  console.log('• Type → Conference/Exhibition/Webinar');
  console.log('• Status → Evaluating/Committed/Contracted/Not Going');
  console.log('• Audience Groups → Partners/Prospects/Analysts/Clients');
  console.log('• Participation → Attending Only/Exhibiting/Sponsoring');
}

// Main execution
function main() {
  console.log('🎯 EVENTS TRACKER VALIDATION TEST');
  console.log('='.repeat(60));
  
  const events = readEventsFile();
  
  if (events.length === 0) {
    console.log('❌ No data found or file could not be read.');
    return;
  }
  
  const { validEvents, errors } = validateEventData(events);
  generateReport(events.length, validEvents, errors);
  
  console.log('\n' + '='.repeat(60));
  console.log('🏁 Test completed!');
  console.log('='.repeat(60));
}

// Run the test
main();
