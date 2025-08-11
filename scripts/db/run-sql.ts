import postgres from 'postgres';
import fs from 'fs/promises';

async function main() {
  const connectionString = "postgresql://postgres:3tts3ttEasdfg@db.qimvwwfwakvgfvclqpue.supabase.co:5432/postgres";
  if (!connectionString) {
    console.error('Database connection string not found.');
    process.exit(1);
  }

  const sql = postgres(connectionString);

  try {
    console.log('Connecting to the database...');
    // The connection is lazy, so a simple query is needed to check it.
    await sql`SELECT 1`;
    console.log('Database connection successful.');

    console.log('Reading SQL file...');
    const query = await fs.readFile('create_newsletters.sql', 'utf-8');
    console.log('Executing SQL query...');
    await sql.unsafe(query);
    console.log('SQL query executed successfully.');

  } catch (error) {
    console.error('An error occurred:', error);
    process.exit(1);
  } finally {
    await sql.end();
    console.log('Database connection closed.');
  }
}

main();
