import { Request, Response } from 'express';
import { k8sclient } from '../../models/k8s.client';
import { registryConfig } from '../../config/config';

export const Ros2Controller = {
    async createDiscovery(req: Request, res: Response) {
        try {
            const values = {
                username: req.auth?.username ?? 'default',
                registry: registryConfig.registry
            };
            await k8sclient.applyTemplateYaml('ros2-discovery-server.yaml', req.auth?.username ?? 'default', values);
            res.json({ message: 'suceess' });
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
    async deleteDiscovery(req: Request, res: Response) {
        try {
            await k8sclient.deleteYamls('ros2-discovery-server.yaml', req.auth?.username ?? 'default');
            res.json({ message: 'suceess' });
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
    async createSlamUnity(req: Request, res: Response) {
        try {
            // [TODO]
            const { pvcname } = req.body;
            const values = {
                username: req.auth?.username ?? 'default',
                registry: 'ghcr.io',
                pvcname
            };
            await k8sclient.applyTemplateYaml('ros2-slam-unity.yaml', req.auth?.username ?? 'default', values);
            res.json({ message: 'suceess' });
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
    async createSlamUnityAndDep(req: Request, res: Response) {
        try {
            // [TODO]
            const { pvcname } = req.body;
            const values = {
                username: req.auth?.username ?? 'default',
                registry: 'ghcr.io',
                pvcname
            };
            await k8sclient.applyTemplateYaml('ros2-slam-unity.yaml', req.auth?.username ?? 'default', values);
            const flag = await k8sclient.checkPodExist(req.auth?.username ?? 'default', 'ros2-discovery-server');
            if (!flag)
                await k8sclient.applyTemplateYaml('ros2-discovery-server.yaml', req.auth?.username ?? 'default', values);
            res.json({ message: 'suceess' });
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
    async deleteSlamUnity(req: Request, res: Response) {
        try {
            await k8sclient.deleteYamls('ros2-slam-unity.yaml', req.auth?.username ?? 'default');
            res.json({ message: 'suceess' });
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
    async createLocalization(req: Request, res: Response) {
        try {
            // [TODO]
            const { pvcname } = req.body;
            const values = {
                username: req.auth?.username ?? '',
                registry: 'ghcr.io',
                pvcname,
            };
            await k8sclient.applyTemplateYaml('ros2-localization-unity.yaml', req.auth?.username ?? 'default', values);
            res.json({ message: 'suceess' });
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
    async deleteLocalization(req: Request, res: Response) {
        try {
            await k8sclient.deleteYamls('ros2-localization-unity.yaml', req.auth?.username ?? 'default');
            res.json({ message: 'suceess' });
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
    async storeMap(req: Request, res:Response) {
        try {
            const command = [
                '/bin/bash',
                '-c',
                'source /opt/ros/humble/setup.bash && source /workspaces/install/setup.bash && ros2 run nav2_map_server map_saver_cli -f /workspace/pros_app/docker/compose/demo/map/map01/map01',
            ];
            const params = {
                namespace: req.auth?.username ?? 'default',
                podName: 'ros2-slam-unity',
                containerName: 'slam',
                command
            }
            const result = await k8sclient.execCommand(params);
            console.log(result);
            res.json({ message: result?.stdout ?? 'Map saved, but no output.' });
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
    async createCarControl(req: Request, res: Response) {
        try {
            // [TODO]
            const { pvcname } = req.body;
            const values = {
                username: req.auth?.username ?? '',
                registry: 'ghcr.io',
                pvcname,
            };
            await k8sclient.applyTemplateYaml('ros2-pros-car.yaml', req.auth?.username ?? 'default', values);
            res.json({ message: 'suceess' });
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
    async deleteCarControl(req: Request, res: Response) {
        try {
            await k8sclient.deleteYamls('ros2-pros-car.yaml', req.auth?.username ?? 'default');
            res.json({ message: 'suceess' });
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
    //registry.screamtrumpet.csie.ncku.edu.tw
    async createYolo(req: Request, res: Response) {
        try {
            // [TODO]
            const { pvcname } = req.body;
            const values = {
                username: req.auth?.username ?? '',
                registry: 'registry.screamtrumpet.csie.ncku.edu.tw',
                pvcname
            };
            await k8sclient.applyTemplateYaml('ros2-yolo.yaml', req.auth?.username ?? 'default', values);
            res.json({ message: 'suceess' });
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
    async deleteYolo(req: Request, res: Response) {
        try {
            await k8sclient.deleteYamls('ros2-yolo.yaml', req.auth?.username ?? 'default');
            res.json({ message: 'suceess' });
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
};