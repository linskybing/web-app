import {
  ServiceToken,
  createServiceToken,
  deleteServiceToken,
  findServiceTokenById,
  findServiceTokensByUserIdAndType,
  getAllServiceTokensByType,
} from '../models/service.model';


export async function createCodeServerForUser(user_id: number, token: string): Promise<number> {
  const data: ServiceToken = {
    user_id,
    token: token,
    type: 'code-server',
  };
  return await createServiceToken(data);
}

export async function getUserCodeServer(user_id: number): Promise<ServiceToken[]> {
  return await findServiceTokensByUserIdAndType(user_id, 'code-server');
}

export async function getAllCodeServer(): Promise<ServiceToken[]> {
  return await getAllServiceTokensByType('code-server');
}

export async function getCodeServerById(id: number): Promise<ServiceToken | null> {
  const token = await findServiceTokenById(id);
  return token?.type === 'code-server' ? token : null;
}

export async function removeCodeServer(id: number): Promise<boolean> {
  const token = await findServiceTokenById(id);
  if (token?.type !== 'code-server') return false;
  return await deleteServiceToken(id);
}

export async function removeAllCodeServerByUser(user_id: number): Promise<number> {
  const jupyterTokens = await findServiceTokensByUserIdAndType(user_id, 'code-server');
  let count = 0;
  for (const token of jupyterTokens) {
    if (await deleteServiceToken(token.id!)) count++;
  }
  return count;
}