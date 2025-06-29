const XLSX = require('xlsx');
const fs = require('fs');

try {
    const filePath = '/Users/arnaudgrunwald/Downloads/Analyst Distribution List (1).xlsx';
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        console.log('File not found:', filePath);
        process.exit(1);
    }
    
    // Read the workbook
    const workbook = XLSX.readFile(filePath);
    console.log('Sheet names:', workbook.SheetNames);
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log('\n=== ALL COLUMN NAMES (including sparse) ===');
    if (jsonData.length > 0) {
        // Get all unique column names from all rows
        const allColumns = new Set();
        jsonData.forEach(row => {
            Object.keys(row).forEach(col => allColumns.add(col));
        });
        const columns = Array.from(allColumns);
        columns.forEach((col, index) => {
            console.log(`${index + 1}. "${col}"`);
        });
        
        console.log('\n=== FIRST 3 ROWS ===');
        jsonData.slice(0, 3).forEach((row, index) => {
            console.log(`\nRow ${index + 1}:`);
            Object.keys(row).forEach(col => {
                console.log(`  ${col}: "${row[col]}"`);
            });
        });
        
        console.log('\n=== SAMPLE DATA FOR MAPPING ANALYSIS ===');
        columns.forEach(col => {
            const sampleValues = jsonData.slice(0, 5)
                .map(row => row[col])
                .filter(val => val && val.toString().trim())
                .slice(0, 3);
            console.log(`${col}: [${sampleValues.map(v => `"${v}"`).join(', ')}]`);
        });
        
        console.log('\n=== TESTING MAPPING LOGIC ===');
        
        // Test the mapping logic from the app
        const fieldMappings = {
            firstName: ['first name', 'firstname', 'fname', 'given name', 'first_name', 'first'],
            lastName: ['last name', 'lastname', 'lname', 'surname', 'family name', 'last_name', 'last'],
            email: ['email', 'email address', 'e-mail', 'mail', 'contact email'],
            company: ['company', 'organization', 'firm', 'employer', 'corp', 'org', 'organisation'],
            linkedIn: ['linkedin', 'linkedin url', 'linkedin profile', 'linkedin_url', 'linkedin link', 'linkedin.com'],
            twitter: ['twitter', 'twitter handle', 'twitter url', 'twitter_handle', '@', 'x.com'],
            coveredTopics: ['covered topics', 'topics', 'expertise', 'skills', 'specialization', 'focus areas', 'domains', 'coverage', 'covered_topics', 'focus_areas'],
            type: ['type', 'analyst type', 'category', 'classification'],
        };
        
        const mapping = {};
        columns.forEach(column => {
            const normalizedColumn = column.toLowerCase().trim();
            let mapped = false;
            
            // First try header-based matching
            for (const [field, variants] of Object.entries(fieldMappings)) {
                if (variants.some(variant => normalizedColumn.includes(variant))) {
                    mapping[column] = field;
                    mapped = true;
                    break;
                }
            }
            
            if (!mapped) {
                mapping[column] = 'UNMAPPED';
            }
        });
        
        console.log('Expected mappings:');
        Object.entries(mapping).forEach(([col, field]) => {
            console.log(`  "${col}" -> ${field}`);
        });
    } else {
        console.log('No data found in the Excel file');
    }
    
} catch (error) {
    console.error('Error reading Excel file:', error);
}
