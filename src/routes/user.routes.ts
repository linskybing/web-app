import express from 'express';
import { UserController } from '../controllers/user.controller';
import { requireAdmin } from '../middlewares/auth.middleware';
import { NamespaceController } from '../controllers/k8s/namespace.controller';
import { VolumnController } from '../controllers/k8s/volumn.controller';
import { Ros2Controller } from '../controllers/k8s/ros2.controller';
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

// namespace
router.get('/k8s/namespace', NamespaceController.getNamespaces);
router.post('/k8s/namespace/:name', NamespaceController.createNamespace);
router.delete('/k8s/namespace/:name', NamespaceController.deleteNamespace);

// volumn
router.get('/k8s/pv', VolumnController.getAllPVs);
router.post('/k8s/pv/:name', VolumnController.createPV);
router.delete('/k8s/pv/:name', VolumnController.deletePV);

router.get('/k8s/pvc', VolumnController.getAllPVCs);
router.get('/k8s/pvcns', VolumnController.getNamespacedPVCs);
router.post('/k8s/pvc/:name', VolumnController.createPVC);
router.delete('/k8s/pvc/:name', VolumnController.deletePVC);

// ros2
router.post('/ros2/discovery', Ros2Controller.createDiscovery);
router.delete('/ros2/discovery', Ros2Controller.deleteDiscovery);
router.post('/ros2/slamunity', Ros2Controller.createSlamUnity);
router.delete('/ros2/slamunity', Ros2Controller.deleteSlamUnity);

export default router;
