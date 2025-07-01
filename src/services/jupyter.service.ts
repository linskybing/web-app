import {
  JupyterNotebook,
  createJupyterNotebook,
  deleteJupyterNotebook,
  deleteJupyterNotebooksByUserId,
  findJupyterNotebookById,
  findJupyterNotebooksByUserId,
  getAllJupyterNotebooks,
} from '../models/jupyter.model';

export async function createNotebookForUser(user_id: number, url: string): Promise<number> {
  const data: JupyterNotebook = { user_id, url };
  return await createJupyterNotebook(data);
}

export async function getUserNotebooks(user_id: number): Promise<JupyterNotebook[]> {
  return await findJupyterNotebooksByUserId(user_id);
}

export async function getAllNotebooks(): Promise<JupyterNotebook[]> {
  return await getAllJupyterNotebooks();
}

export async function getNotebookById(id: number): Promise<JupyterNotebook | null> {
  return await findJupyterNotebookById(id);
}

export async function removeNotebook(id: number): Promise<boolean> {
  return await deleteJupyterNotebook(id);
}

export async function removeAllNotebooksByUser(user_id: number): Promise<number> {
  return await deleteJupyterNotebooksByUserId(user_id);
}