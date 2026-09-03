import { initDatabase } from './db.js';

async function main() {
  try {
    await initDatabase();
    console.log('🎉 Successfully connected to Supabase PostgreSQL!');
    process.exit(0);
  } catch (e) {
    console.error('Failed to connect:', e);
    process.exit(1);
  }
}

main();
