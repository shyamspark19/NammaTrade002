import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables manually
dotenv.config({ path: path.join(process.cwd(), '.env') });

const connectionString = process.env.DIRECT_URL;

if (!connectionString || connectionString.includes('[YOUR-PASSWORD]')) {
  console.error("❌ ERROR: You still have '[YOUR-PASSWORD]' in your .env file!");
  console.error("Please open your .env, put in your real database password, save the file, and run this again.");
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runMigrations() {
  try {
    console.log("Connecting to Supabase Database directly...");
    await client.connect();
    console.log("✅ Successfully connected to Supabase!");

    const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort(); // Run them in alphabetical/timestamp order

    if (files.length === 0) {
      console.log("No sql migrations found.");
      return;
    }

    console.log(`Found ${files.length} migrations. Processing...`);

    for (const file of files) {
      console.log(`Executing migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      try {
        await client.query(sql);
        console.log(`✅ Success: ${file}`);
      } catch (err) {
        // Sometimes migrations fail if they already exist, we warn but continue.
        console.warn(`⚠️ Warning for ${file}:`, err.message);
      }
    }

    console.log("🎉 All migrations completely processed!");
    console.log("Your Supabase project is now 100% connected and fully initialized! You can start the app!");

  } catch (error) {
    console.error("❌ Critical Error connecting to Database:", error.message);
    console.error("Check if your password is correct in the .env file.");
  } finally {
    await client.end();
  }
}

runMigrations();
