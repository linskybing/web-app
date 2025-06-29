import express from 'express';
import { UserController } from '../controllers/user.controller';
import { requireAdmin } from '../middlewares/auth.middleware';
import * as namespaceController from '../controllers/k8s/namespace.controller';
const router = express.Router();
const multer = require('multer');
const upload = multer();

// User table
router.get('/users', UserController.getUsers);
router.get('/users/:id', UserController.getUser);
router.post('/users/register', upload.none(), UserController.register);
router.post('/users/login', upload.none(), UserController.login);
router.patch('/users/:id', upload.none(), UserController.update);
router.patch('/users/:id/password', upload.none(), UserController.changeUserPassword);
router.delete('/users/:id', UserController.deleteUser);

// k8s
router.get('/k8s', namespaceController.getNamespaces);

export default router;
