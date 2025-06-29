import { Request, Response } from 'express';
import { k8sclient } from '../../models/k8s.client';

export const VolumnController = {
    async getAllPVs(req: Request, res: Response) {
        try {
            const result = await k8sclient.listPVs();
            res.json(result);
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
    async createPV(req: Request, res: Response) {
        try {
            const name = req.params.name;
            const result = await k8sclient.createPV(name);
            res.json(result);
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
    async deletePV(req: Request, res: Response) {
        try {
            const name = req.params.name;
            const result = await k8sclient.deletePV(name);
            res.json(result);
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
    async getAllPVCs(req: Request, res: Response) {
        try {
            const result = await k8sclient.listAllPVCs();
            res.json(result);
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
    async getNamespacedPVCs(req: Request, res: Response) {
        try {
            console.log(req.auth);
            const result = await k8sclient.listPVCs(req.auth?.username ?? 'default');
            res.json(result);
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
    async createPVC(req: Request, res: Response) {
        try {
            const name = req.params.name;
            const result = await k8sclient.createNamespacedPVC(name, req.auth?.username ?? 'default');
            res.json(result);
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
    async deletePVC(req: Request, res: Response) {
        try {
            const name = req.params.name;
            const result = await k8sclient.delteNamespacedPVC(name, req.auth?.username ?? 'default');
            res.json(result);
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
};