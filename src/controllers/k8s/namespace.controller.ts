import { Request, Response } from 'express';
import { k8sClient } from '../../models/k8s.client';

const k8s = new k8sClient();

export const getNamespaces = async (req: Request, res: Response) => {
    try {
        const namespace = await k8s.listNamespaces();
        res.json({namespaces : namespace.map(ns => ns.metadata?.name ?? '')});
    } catch (err: any) {
        res.status(500).json({ error: err.message});
    }
};