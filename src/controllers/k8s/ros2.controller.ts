import { Request, Response } from 'express';
import { k8sclient } from '../../models/k8s.client';
import { register } from 'module';

export const Ros2Controller = {
    async createDiscovery(req: Request, res: Response) {
        try {
            await k8sclient.applyYamls('ros2-discovery-server.yaml', req.auth?.username ?? '');
            res.json({ message: 'suceess' });
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
    async deleteDiscovery(req: Request, res: Response) {
        try {
            await k8sclient.deleteYamls('ros2-discovery-server.yaml', req.auth?.username ?? '');
            res.json({ message: 'suceess' });
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
    async createSlamUnity(req: Request, res: Response) {
        try {
            // [TODO]
            const serverip = await k8sclient.getPodIP(req.auth?.username ?? '', 'ros2-discovery-server');
            const values = {
                username: req.auth?.username ?? '',
                registry: 'ghcr.io',
                pvcname:  'pvc-test',
                discoveryip: `${serverip}`
            };
            await k8sclient.applyTemplateYaml('ros2-slam-unity.yaml', req.auth?.username ?? '', values);
            res.json({ message: 'suceess' });
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
    async deleteSlamUnity(req: Request, res: Response) {
        try {
            await k8sclient.deleteYamls('ros2-slam-unity.yaml', req.auth?.username ?? '');
            res.json({ message: 'suceess' });
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
};