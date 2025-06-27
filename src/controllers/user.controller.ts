
import { authenticateUser } from '../services/auth.service';
import { Request, Response } from 'express';

interface AuthenticatedRequest extends Request {
  auth?: {
    username: string;
    [key: string]: any;
  };
};

export const login = (req: Request, res: Response) => {
  const { username, password } = req.body;
  const result = authenticateUser(username, password);
  if (!result) {
    res.status(401).json({ message: 'Invalid credentials' });
    return;
  }
  res.json(result);
};

export const getProfile = (req: AuthenticatedRequest, res: Response) => {
  if (!req.auth?.username) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  res.json({ message: `Welcome ${req.auth.username}` });
};
