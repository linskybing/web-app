import { db } from '../db/database';

export interface ServiceToken {
  id?: number;
  user_id: number;
  token: string;
  type?: 'jupyter' | 'code-server' | 'other';
  created_at?: Date;
  updated_at?: Date;
}

export async function getAllServiceTokens(): Promise<ServiceToken[]> {
  const [rows] = await db.query('SELECT * FROM service_tokens');
  return rows as ServiceToken[];
}

export async function getAllServiceTokensByType(type: string): Promise<ServiceToken[]> {
  const [rows] = await db.query(`SELECT * FROM service_tokens WHERE type = ?`, [type]);
  return rows as ServiceToken[];
}

export async function createServiceToken(data: ServiceToken): Promise<number> {
  const [result] = await db.execute(
    `INSERT INTO service_tokens (user_id, token, type) VALUES (?, ?, ?)`,
    [data.user_id, data.token, data.type || 'other']
  );
  // @ts-ignore
  return (result as any).insertId;
}

export async function findServiceTokenById(id: number): Promise<ServiceToken | null> {
  const [rows] = await db.execute(`SELECT * FROM service_tokens WHERE id = ? LIMIT 1`, [id]);
  const tokens = rows as ServiceToken[];
  return tokens.length > 0 ? tokens[0] : null;
}

export async function findServiceTokensByUserId(user_id: number): Promise<ServiceToken[]> {
  const [rows] = await db.execute(`SELECT * FROM service_tokens WHERE user_id = ?`, [user_id]);
  return rows as ServiceToken[];
}

export async function findServiceTokensByUserIdAndType(user_id: number, type: 'jupyter' | 'code-server' | 'other'): Promise<ServiceToken[]> {
  const [rows] = await db.execute(
    `SELECT * FROM service_tokens WHERE user_id = ? AND type = ?`,
    [user_id, type]
  );
  return rows as ServiceToken[];
}

export async function deleteServiceToken(id: number): Promise<boolean> {
  const [result] = await db.execute(`DELETE FROM service_tokens WHERE id = ?`, [id]);
  // @ts-ignore
  return (result as any).affectedRows > 0;
}

export async function deleteServiceTokensByUserId(user_id: number): Promise<number> {
  const [result] = await db.execute(`DELETE FROM service_tokens WHERE user_id = ?`, [user_id]);
  // @ts-ignore
  return (result as any).affectedRows;
}