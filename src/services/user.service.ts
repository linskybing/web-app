import bcrypt from 'bcrypt';
import * as userModel from '../models/user.model';
import { config } from '../config/config';
import jwt from 'jsonwebtoken';

export async function getAllUsers() {
  const users = await userModel.getAllUsers();

  return users.map(({ password, ...user }) => user);
}

export async function getTargetUser(id: number) {
  const user = await userModel.findUserById(id);
  if (user) {
    const { password, ...val } = user;
    return val;
  }
  return null;
}

export async function registerUser(data: userModel.User): Promise<number> {
  const existingUser = await userModel.findUserByUsername(data.username);
  
  if (existingUser) {
    throw new Error('Username already exists');
  }

  const password = await bcrypt.hash(data.password, 10);
  const userId = await userModel.createUser({
    username: data.username,
    password,
    email: data.email,
    full_name: data.full_name ?? '',
    role: data.role ?? 'user',
  });

  return userId;
}

export async function loginUser(username: string, password: string): Promise<string> {
  const user = await userModel.findUserByUsername(username);

  if (!user) {
    throw new Error('User not found');
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new Error('Invalid password');
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: '1h' }
  );

  return token;
}

export async function updateUser(
  id: number,
  updateData: Partial<Omit<userModel.User, 'id' | 'password' | 'created_at' | 'updated_at'>>
): Promise<boolean> {
  const user = await userModel.findUserById(id);
  if (!user) throw new Error('User not found');

  const success = await userModel.updateUser(id, updateData);
  if (!success) throw new Error('Update failed');
  return true;
}

export async function deleteUser(id: number): Promise<boolean> {
  const user = await userModel.findUserById(id);
  if (!user) throw new Error('User not found');

  const success = await userModel.deleteUser(id);
  if (!success) throw new Error('Delete failed');
  return true;
}

export async function updateUserPassword(id: number, oldPassword: string, newPassword: string): Promise<boolean> {
  const user = await userModel.findUserById(id);
  if (!user) {
    throw new Error('User not found');
  }
  const valid = await bcrypt.compare(oldPassword, user.password);
  if (!valid) {
    throw new Error('Invalid OldPassword');
  }
  const password = await bcrypt.hash(newPassword, 10);
  const success = await userModel.updatePassword(id, password);
  if (!success) {
    throw new Error('Password update failed');
  }
  return true;
}