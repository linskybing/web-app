import { Request, Response } from 'express';
import { k8sclient } from '../models/k8s.client';
import { createNotebookForUser, getAllNotebooks, getUserNotebooks, removeAllNotebooksByUser } from '../services/jupyter.service';
import { findUserByUsername } from '../models/user.model';

const crypto = require('crypto');
export const JupyterController = {
    async createNoteBook(req: Request, res: Response) {
        try {
            const { pvcname } = req.body;
            const username = req.auth?.username ?? 'default';
            const token = crypto.createHash('sha256')
            .update(username + Date.now().toString())
            .digest('hex');
            // [TODO]
            const values = { username, token, pvcname };
            await k8sclient.applyTemplateYaml('jupyter-notebook.yaml', req.auth?.username ?? 'default', values);
            const url = await k8sclient.getNodePortInfo('jupyter-svc', username);
            const user = await findUserByUsername(username);
            if (user && user.id) {
                await createNotebookForUser(user.id, token);
            } else {
                console.error(`User ${username} not found`);
            }
            res.json({ url: `${url[0]}/?token=${token}` });            
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
    async deleteNoteBook(req: Request, res: Response) {
        try {
            await k8sclient.deleteYamls('jupyter-notebook.yaml', req.auth?.username ?? 'default');
            const username = req.auth?.username ?? 'default';
            const user = await findUserByUsername(username);
            if (user && user.id) {
                await removeAllNotebooksByUser(user.id);
            } else {
                console.error(`User ${username} not found`);
            }
            res.json({ message: 'suceess' });
        } catch (err: any) {
            res.status(500).json({ error: err.message});
        }
    },
    async getAllNotebooks(req: Request, res: Response) {
        try {
            const notebooks = await getAllNotebooks();
            res.json(notebooks);
        } catch (err) {
            res.status(500).json({ error: 'Failed to fetch notebooks' });
        }
    },
    async getUserNotebooks(req: Request, res: Response) {
        const userId = parseInt(req.params.userid, 10);
        if (isNaN(userId)) res.status(400).json({ error: 'Invalid user ID' });
        else {
            try {
                const notebooks = await getUserNotebooks(userId);
                res.json(notebooks);
            } catch (err) {
                res.status(500).json({ error: 'Failed to fetch user notebooks' });
            }
        }
    }
};

