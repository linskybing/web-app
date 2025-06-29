import { Request, Response } from 'express';
import { k8sclient } from '../../models/k8s.client';

export const NamespaceController = {
    async getNamespaces(req: Request, res: Response) {
        try {
            const namespace = await k8sclient.listNamespaces();
            res.json({namespaces : namespace.map(ns => ns.metadata?.name ?? '')});
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
    async createNamespace(req: Request, res: Response) {
        try {
            const name = req.params.name as string;
            if (!name) {
                res.status(400).json({ error: 'Namespace name is required' });
            } else {
                const createdNs = await k8sclient.createNamespace(name);
                res.status(201).json({ message: `Namespace ${name} created`, namespace: createdNs.metadata?.name });
            }
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    },
    async deleteNamespace(req: Request, res: Response) {
        try {
            const name = req.params.name as string;
            if (!name) {
                res.status(400).json({ error: 'Namespace name is required' });
            } else {
                await k8sclient.deleteNamespace(name);
                res.json({ message: `Namespace ${name} deleted` });
            }
        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    },
};