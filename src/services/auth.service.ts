import jwt from 'jsonwebtoken';
import { config } from '../config/config';

export function authenticateUser(username: string, password: string): { token: string } | null {
  if (username === 'admin' && password === 'password') {
    const token = jwt.sign({ username }, config.jwtSecret, { expiresIn: '1h' });
    return { token };
  }
  return null;
}
