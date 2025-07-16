import * as UserService from '../services/user.service';
import { Request, Response } from 'express';

export const UserController = {
  async getUsers(req: Request, res: Response) {
    try {
      const users = await UserService.getAllUsers();
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
  async getUser(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const target = await UserService.getTargetUser(id);
      res.json(target);
    } catch (err) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
  async register(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      const id = await UserService.registerUser( {
        username,
        password
      });
      res.status(201).json({ id: id, username: username});
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  },
  async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      const data = await UserService.loginUser(username, password);
      res.status(200).json(data);
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
      const { oldPassword, newPassword } = req.body;
      if (!newPassword) {
        res.status(400).json({ error: 'Missing newPassword' });
      }
      if (!oldPassword) {
        res.status(400).json({ error: 'Missing oldPassword' });
      }
      await UserService.updateUserPassword(id, oldPassword, newPassword);
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