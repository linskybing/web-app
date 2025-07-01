import { db } from '../db/database';

export interface JupyterNotebook {
  id?: number;
  user_id: number;
  url: string;
  created_at?: Date;
  updated_at?: Date;
}

export async function getAllJupyterNotebooks(): Promise<JupyterNotebook[]> {
  const [rows] = await db.query('SELECT * FROM jupyter_notebooks');
  return rows as JupyterNotebook[];
}

export async function createJupyterNotebook(data: JupyterNotebook): Promise<number> {
  const [result] = await db.execute(
    `INSERT INTO jupyter_notebooks (user_id, url) VALUES (?, ?)`,
    [data.user_id, data.url || null]
  );
  // @ts-ignore
  return (result as any).insertId;
}

export async function findJupyterNotebookById(id: number): Promise<JupyterNotebook | null> {
  const [rows] = await db.execute(`SELECT * FROM jupyter_notebooks WHERE id = ? LIMIT 1`, [id]);
  const notebooks = rows as JupyterNotebook[];
  return notebooks.length > 0 ? notebooks[0] : null;
}

export async function findJupyterNotebooksByUserId(user_id: number): Promise<JupyterNotebook[]> {
  const [rows] = await db.execute(`SELECT * FROM jupyter_notebooks WHERE user_id = ?`, [user_id]);
  return rows as JupyterNotebook[];
}


export async function deleteJupyterNotebook(id: number): Promise<boolean> {
  const [result] = await db.execute(`DELETE FROM jupyter_notebooks WHERE id = ?`, [id]);
  // @ts-ignore
  return (result as any).affectedRows > 0;
}

export async function deleteJupyterNotebooksByUserId(user_id: number): Promise<number> {
  const [result] = await db.execute(`DELETE FROM jupyter_notebooks WHERE user_id = ?`, [user_id]);
  // @ts-ignore
  return (result as any).affectedRows;
}