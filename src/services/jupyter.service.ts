import {
  ServiceToken,
  createServiceToken,
  deleteServiceToken,
  findServiceTokenById,
  findServiceTokensByUserIdAndType,
  getAllServiceTokensByType,
} from '../models/service.model';


export async function createNotebookForUser(user_id: number, token: string): Promise<number> {
  const data: ServiceToken = {
    user_id,
    token: token,
    type: 'jupyter',
  };
  return await createServiceToken(data);
}

export async function getUserNotebooks(user_id: number): Promise<ServiceToken[]> {
  return await findServiceTokensByUserIdAndType(user_id, 'jupyter');
}

export async function getAllNotebooks(): Promise<ServiceToken[]> {
  return await getAllServiceTokensByType('jupyter');
}

export async function getNotebookById(id: number): Promise<ServiceToken | null> {
  const token = await findServiceTokenById(id);
  return token?.type === 'jupyter' ? token : null;
}

export async function removeNotebook(id: number): Promise<boolean> {
  const token = await findServiceTokenById(id);
  if (token?.type !== 'jupyter') return false;
  return await deleteServiceToken(id);
}

export async function removeAllNotebooksByUser(user_id: number): Promise<number> {
  const jupyterTokens = await findServiceTokensByUserIdAndType(user_id, 'jupyter');
  let count = 0;
  for (const token of jupyterTokens) {
    if (await deleteServiceToken(token.id!)) count++;
  }
  return count;
}