import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app';
import { config } from '../src/config/config';
import * as UserService from '../src/services/user.service';

jest.mock('../src/services/user.service', () => ({
  registerUser: jest.fn(),
  loginUser: jest.fn(),
  updateUser: jest.fn(),
  updateUserPassword: jest.fn(),
  deleteUser: jest.fn(),
}));

const token = jwt.sign({ username: 'admin', role: 'admin' }, config.jwtSecret, { expiresIn: '1h' });

describe('UserController', () => {
  const mockedRegisterUser = UserService.registerUser as jest.Mock;
  const mockedLoginUser = UserService.loginUser as jest.Mock;
  const mockedUpdateUser = UserService.updateUser as jest.Mock;
  const mockedUpdateUserPassword = UserService.updateUserPassword as jest.Mock;
  const mockedDeleteUser = UserService.deleteUser as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      mockedRegisterUser.mockResolvedValueOnce(99);

      const res = await request(app)
        .post('/api/users/register')
        .send({ username: 'newuser', password: '123456' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ id: 99, username: 'newuser' });
    });
  });

  describe('login', () => {
    it('should return a token', async () => {
      mockedLoginUser.mockResolvedValueOnce('fake-token');

      const res = await request(app)
        .post('/api/users/login')
        .send({ username: 'admin', password: 'admin' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBe('fake-token');
    });

    it('should return 401 on error', async () => {
      mockedLoginUser.mockRejectedValueOnce(new Error('Invalid login'));

      const res = await request(app)
        .post('/api/users/login')
        .send({ username: 'admin', password: 'wrong' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid login');
    });
  });

  describe('update', () => {
    it('should update user info', async () => {
      mockedUpdateUser.mockResolvedValueOnce(undefined);

      const res = await request(app)
        .patch('/api/users/1')
        .set('Authorization', `Bearer ${token}`)
        .send({ full_name: 'New Name' });

      expect(mockedUpdateUser).toHaveBeenCalledWith(1, { full_name: 'New Name' });
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User updated');
    });
  });

  describe('changeUserPassword', () => {
    it('should return 400 if newPassword missing', async () => {
      const res = await request(app)
        .patch('/api/users/1/password')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Missing newPassword');
    });

    it('should return 200 and success message when password updated', async () => {
      mockedUpdateUserPassword.mockResolvedValueOnce(undefined);

      const res = await request(app)
        .patch('/api/users/1/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ newPassword: 'newpass123' });

      expect(mockedUpdateUserPassword).toHaveBeenCalledWith(1, 'newpass123');
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Password updated');
    });

    it('should return 400 on service error', async () => {
      mockedUpdateUserPassword.mockRejectedValueOnce(new Error('Update failed'));

      const res = await request(app)
        .patch('/api/users/1/password')
        .set('Authorization', `Bearer ${token}`)
        .send({ newPassword: 'failpass' });

      expect(mockedUpdateUserPassword).toHaveBeenCalledWith(1, 'failpass');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Update failed');
    });
  });

  describe('deleteUser', () => {
    it('should return 200 on successful delete', async () => {
      mockedDeleteUser.mockResolvedValueOnce(true);

      const res = await request(app)
        .delete('/api/users/1')
        .set('Authorization', `Bearer ${token}`);

      expect(mockedDeleteUser).toHaveBeenCalledWith(1);
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('User deleted');
    });

    it('should return 404 if user not found', async () => {
      mockedDeleteUser.mockRejectedValueOnce(new Error('User not found'));

      const res = await request(app)
        .delete('/api/users/1')
        .set('Authorization', `Bearer ${token}`);

      expect(mockedDeleteUser).toHaveBeenCalledWith(1);
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });

    it('should return 500 if delete failed', async () => {
      mockedDeleteUser.mockRejectedValueOnce(new Error('Delete failed'));

      const res = await request(app)
        .delete('/api/users/1')
        .set('Authorization', `Bearer ${token}`);

      expect(mockedDeleteUser).toHaveBeenCalledWith(1);
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Delete failed');
    });
  });
});
