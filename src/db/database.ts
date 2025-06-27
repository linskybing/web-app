import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value ?? defaultValue!;
}

export const db = mysql.createPool({
  host: getEnvVar('DB_HOST'),
  port: Number(getEnvVar('DB_PORT', '3306')),
  user: getEnvVar('DB_USER'),
  password: getEnvVar('DB_PASSWORD'),
  database: getEnvVar('DB_NAME'),
  waitForConnections: process.env.DB_WAIT_FOR_CONNECTIONS === 'true',
  connectionLimit: Number(getEnvVar('DB_CONNECTION_LIMIT', '10')),
  queueLimit: 0,
});

export async function testConnection() {
  try {
    const connection = await db.getConnection();
    console.log('MySQL connected');
    connection.release();
  } catch (err) {
    console.error('MySQL connection failed:', err);
    process.exit(1);
  }
}
