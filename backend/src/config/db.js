import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const { Pool } = pg;

const isTest = process.env.NODE_ENV === 'test';
const fallbackSupabaseUrl = 'postgresql://postgres.vblhexkxtenpermjasml:Ajo2829121314@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true';
const connectionString = (isTest && process.env.DATABASE_URL_LOCAL)
  ? process.env.DATABASE_URL_LOCAL
  : (process.env.DATABASE_URL || fallbackSupabaseUrl);

const isRemote = connectionString && (connectionString.includes('supabase.com') || connectionString.includes('pooler.supabase.com') || connectionString.includes('sslmode=require'));

export const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
  ssl: isRemote ? { rejectUnauthorized: false } : undefined,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export const checkDatabaseConnection = async () => {
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT current_database(), current_user, version()');
    client.release();
    return {
      connected: true,
      database: res.rows[0].current_database,
      user: res.rows[0].current_user,
      version: res.rows[0].version,
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message,
    };
  }
};
