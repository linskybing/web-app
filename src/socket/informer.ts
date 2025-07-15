import WebSocket from 'ws';
import jwt from 'jsonwebtoken';
import url from 'url';
import { k8sclient } from '../models/k8s.client';
import { config } from '../config/config';

export function setupInformerSocket(server: any) {
    const wss = new WebSocket.Server({ server, path: '/ws/informer' });
    console.log('setupInformerSocket is called, listening on /ws/informer');
    wss.on('connection', async (ws, req) => {
        console.log('connect')
        const { query } = url.parse(req.url || '', true);
        const token = query?.token as string;

        let namespace = '';

        try {
            const payload = jwt.verify(token, config.jwtSecret) as { username: string };
            namespace = payload.username;
            if (!namespace) throw new Error('No namespace');
        } catch (err) {
            ws.close(4003, 'Invalid token');
            return;
        }

        console.log(`[informer] Client connected for namespace: ${namespace}`);
        const watchers: AbortController[] = [];

        const resourcesToWatch = [
        { path: `/api/v1/namespaces/${namespace}/pods`, name: 'pod' },
        { path: `/apis/apps/v1/namespaces/${namespace}/deployments`, name: 'deployment' },
        { path: `/api/v1/namespaces/${namespace}/services`, name: 'service' },
        ];

        for (const resource of resourcesToWatch) {
            const watcher = await k8sclient.watchResource(resource.path, {
                onAdded: (obj: any) => ws.send(JSON.stringify({ type: 'ADDED', resource: resource.name, obj })),
                onModified: (obj: any) => ws.send(JSON.stringify({ type: 'MODIFIED', resource: resource.name, obj })),
                onDeleted: (obj: any) => ws.send(JSON.stringify({ type: 'DELETED', resource: resource.name, obj })),
                onError: (err: any) => {
                console.error(`${resource.name} watcher error`, err);
                ws.send(JSON.stringify({ error: `${resource.name} watcher error` }));
                ws.close();
                },
            });
            watchers.push(watcher);
        }

        ws.on('close', () => {
            for (const watcher of watchers) {
                watcher.abort();
            }
        });
    });
}