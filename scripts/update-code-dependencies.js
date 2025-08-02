const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const replacements = {
  // Table name replacements
  'table: "analyst"': 'table: "analysts"',
  'from: "analyst"': 'from: "analysts"',
  'join: "analyst"': 'join: "analysts"',
  'table: "general_settings"': 'table: "settings"',
  'table: "GeneralSettings"': 'table: "settings"',
  'table: "analyst_portal_settings"': 'table: "settings"',
  'table: "CalendarConnection"': 'table: "calendar_connections"',
  'table: "User"': 'table: "user_profiles"',
  
  // Type replacements
  'type Analyst =': 'type Analyst =',
  'interface Analyst': 'interface Analyst',
  'type GeneralSettings =': 'type Settings =',
  'interface GeneralSettings': 'interface Settings',
  'type CalendarConnection =': 'type CalendarConnection =',
  'interface CalendarConnection': 'interface CalendarConnection'
};

const filesToSearch = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.js',
  '**/*.jsx',
  '**/*.sql'
];

const excludeDirs = [
  'node_modules',
  '.next',
  'dist',
  'build',
  'coverage'
];

async function findFiles(patterns) {
  const files = [];
  for (const pattern of patterns) {
    const { stdout } = await execAsync(`find . -type f -name "${pattern}" ${excludeDirs.map(dir => `-not -path "*/${dir}/*"`).join(' ')}`);
    files.push(...stdout.split('\n').filter(Boolean));
  }
  return [...new Set(files)];
}

async function updateFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let hasChanges = false;

    for (const [oldText, newText] of Object.entries(replacements)) {
      if (content.includes(oldText)) {
        content = content.replace(new RegExp(oldText, 'g'), newText);
        hasChanges = true;
        console.log(`✓ Replaced "${oldText}" with "${newText}" in ${filePath}`);
      }
    }

    if (hasChanges) {
      await fs.writeFile(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

async function main() {
  try {
    console.log('Finding files to update...');
    const files = await findFiles(filesToSearch);
    console.log(`Found ${files.length} files to check`);

    for (const file of files) {
      await updateFile(file);
    }

    console.log('Code dependencies update completed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();