import { Request, Response } from 'express';
import { k8sclient } from '../models/k8s.client';
import { findUserByUsername } from '../models/user.model';
import { registryConfig } from '../config/config';
import { createCodeServerForUser, getAllCodeServer, getUserCodeServer, removeAllCodeServerByUser } from '../services/code.service';

const crypto = require('crypto');
export const CodeController = {
    async createCodeServer(req: Request, res: Response) {
        try {
            const username = req.auth?.username ?? 'default';
            const token = crypto.createHash('sha256')
                                .update(username + Date.now().toString())
                                .digest('hex');
            const values = {
                username,
                token,
                pvcname: 'pvc-home',
                registry: registryConfig.registry
            };

            await k8sclient.applyTemplateYaml('code-server.yaml', req.auth?.username ?? 'default', values);
            const url = await k8sclient.getNodePortInfo('code-server', username);
            const user = await findUserByUsername(username);
            if (user && user.id) {
                await createCodeServerForUser(user.id, token);
            } else {
                console.error(`User ${username} not found`);
            }
            res.json({ url: `${url[0]}/?token=${token}` });            
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
    async deleteCodeServer(req: Request, res: Response) {
        try {
            await k8sclient.deleteYamls('code-server.yaml', req.auth?.username ?? 'default');
            const username = req.auth?.username ?? 'default';
            const user = await findUserByUsername(username);
            if (user && user.id) {
                await removeAllCodeServerByUser(user.id);
            } else {
                console.error(`User ${username} not found`);
            }
            res.json({ message: 'suceess' });
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
    async getAllCodeServer(req: Request, res: Response) {
        try {
            const code = await getAllCodeServer();
            res.json(code);
        } catch (err) {
            res.status(500).json({ error: 'Failed to fetch code-server' });
        }
    },
    async getUserCodeServer(req: Request, res: Response) {
        const userId = parseInt(req.params.userid, 10);
        if (isNaN(userId)) res.status(400).json({ error: 'Invalid user ID' });
        else {
            try {
                const code = await getUserCodeServer(userId);
                res.json(code);
            } catch (err) {
                res.status(500).json({ error: 'Failed to fetch user code-server' });
            }
        }
    }
};

