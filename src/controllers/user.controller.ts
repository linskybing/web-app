import * as UserService from '../services/user.service';
import { Request, Response } from 'express';

export const UserController = {
  async register(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      const id = await UserService.registerUser( {
        username: username,
        password: password
      });
      res.status(201).json({ id: id, username: username});
    } catch (err: any) {
      res.status(400).json({ error: err.message});
    }
  },
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      const token = await UserService.loginUser(username, password);
      res.status(200).json({ token });
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  },
  async update(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await UserService.updateUser(id, req.body);
      res.status(200).json({ message: 'User updated' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
  async changeUserPassword(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { newPassword } = req.body;
      if (!newPassword) {
        res.status(400).json({ error: 'Missing newPassword' });
      }
      await UserService.updateUserPassword(id, newPassword);
      res.status(200).json({ message: 'Password updated' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
  async deleteUser(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const deleted = await UserService.deleteUser(id);
      if (!deleted) {
        res.status(404).json({ error: 'User not found' });
      }
      res.status(200).json({ message: 'User deleted' });
    } catch (err: any) {
      if (err.message === 'User not found') {
        res.status(404).json({ error: err.message });
      } else {
        res.status(500).json({ error: err.message });
      }
    }
  },
};