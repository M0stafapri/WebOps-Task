import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from './shared/schema';

// Required for Neon serverless
neonConfig.webSocketConstructor = ws;

// Exit if no DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is not set');
  process.exit(1);
}

async function main() {
  console.log('Connecting to database...');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log('Creating tables...');
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        image TEXT
      )
    `);
    console.log('Created users table');

    // Create posts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        author_id INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Created posts table');

    // Create tags table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE
      )
    `);
    console.log('Created tags table');

    // Create post_tags table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS post_tags (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL
      )
    `);
    console.log('Created post_tags table');

    // Create comments table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        body TEXT NOT NULL,
        author_id INTEGER NOT NULL,
        post_id INTEGER NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Created comments table');

    console.log('All tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    await pool.end();
  }
}

main().catch(console.error);