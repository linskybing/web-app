import { db } from '../db/database'

export interface User {
    id?: number;
    username: string;
    password: string;
    email?: string;
    full_name?: string;
    role?: 'user' | 'admin' | 'manager';
    created_at?: Date;
    updated_at?: Date;
}

export async function getAllUsers(): Promise<User[]> {
  const [rows] = await db.query('SELECT * FROM users');
  return rows as User[];
}

export async function createUser(user: User): Promise<number> {
  const [result] = await db.execute(
    `INSERT INTO users (username, password, email, full_name, role) VALUES (?, ?, ?, ?, ?)`,
    [user.username, user.password, user.email || null, user.full_name || null, user.role || 'user']
  );
  // @ts-ignore
  return (result as any).insertId;
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const [rows] = await db.execute(`SELECT * FROM users WHERE username = ? LIMIT 1`, [username]);
  const users = rows as User[];
  return users.length > 0 ? users[0] : null;
}

export async function findUserById(id: number): Promise<User | null> {
  const [rows] = await db.execute(`SELECT * FROM users WHERE id = ? LIMIT 1`, [id]);
  const users = rows as User[];
  return users.length > 0 ? users[0] : null;
}

export async function updateUser(
  id: number,
  data: Partial<Omit<User, 'id' | 'password' | 'created_at' | 'updated_at'>>
): Promise<boolean> {
  const fields = [];
  const values: any[] = [];

  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }

  if (fields.length === 0) return false;

  values.push(id);

  const [result] = await db.execute(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
  // @ts-ignore
  return (result as any).affectedRows > 0;
}

export async function updatePassword(id: number, password: string): Promise<boolean> {
  const [result] = await db.execute(
    `UPDATE users SET password = ? WHERE id = ?`,
    [password, id]
  );
  // @ts-ignore
  return (result as any).affectedRows > 0;
}

export async function deleteUser(id: number): Promise<boolean> {
  const [result] = await db.execute(`DELETE FROM users WHERE id = ?`, [id]);
  if ((result as any).affectedRows === 0) {
    throw new Error('Delete failed');
  }
  // @ts-ignore
  return (result as any).affectedRows > 0;
}
