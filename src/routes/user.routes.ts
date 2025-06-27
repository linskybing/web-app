import express from 'express';
import { UserController } from '../controllers/user.controller';

const router = express.Router();

router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.patch('/:id', UserController.update);
router.patch('/:id/password', UserController.changeUserPassword);
router.delete('/:id', UserController.deleteUser);

export default router;
