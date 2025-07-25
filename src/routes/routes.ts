import express from 'express';
import { UserController } from '../controllers/user.controller';
import { requireAdmin } from '../middlewares/auth.middleware';
import { NamespaceController } from '../controllers/k8s/namespace.controller';
import { VolumnController } from '../controllers/k8s/volumn.controller';
import { Ros2Controller } from '../controllers/ros2.controller';
import { JupyterController } from '../controllers/jupyter.controller';
import { CodeController } from '../controllers/code.controller';
import { ValidateController } from '../controllers/validate.controller';
const router = express.Router();
const multer = require('multer');
const upload = multer();

// validate
router.get('/validate', ValidateController.AuthValidator);

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
router.post('/ros2/discovery', upload.none(), Ros2Controller.createDiscovery);
router.delete('/ros2/discovery', Ros2Controller.deleteDiscovery);
router.post('/ros2/slamunity', upload.none(), Ros2Controller.createSlamUnity);
router.post('/ros2/slamunityall', upload.none(), Ros2Controller.createSlamUnityAndDep);
router.delete('/ros2/slamunity', Ros2Controller.deleteSlamUnity);
router.post('/ros2/localization', upload.none(), Ros2Controller.createLocalization);
router.delete('/ros2/localization', Ros2Controller.deleteLocalization);
router.post('/ros2/store', Ros2Controller.storeMap);
router.post('/ros2/car', upload.none(), Ros2Controller.createCarControl);
router.delete('/ros2/car', Ros2Controller.deleteCarControl);
router.post('/ros2/yolo', upload.none(), Ros2Controller.createYolo);
router.delete('/ros2/yolo', Ros2Controller.deleteYolo);

// jupyter
router.get('/notebook', JupyterController.getAllNotebooks);
router.get('/notebook/:userid', JupyterController.getUserNotebooks);
router.post('/notebook', upload.none(), JupyterController.createNoteBook);
router.delete('/notebook', JupyterController.deleteNoteBook);

// codeserver
router.get('/codeserver', CodeController.getAllCodeServer);
router.get('/codeserver/:userid', CodeController.getUserCodeServer);
router.post('/codeserver', upload.none(), CodeController.createCodeServer);
router.delete('/codeserver', CodeController.deleteCodeServer);

export default router;
