import WebSocket from 'ws';
import jwt, { JwtPayload } from 'jsonwebtoken'
import url from 'url';
import stream from 'stream';
import { config } from './config/config';
import { k8sclient } from './models/k8s.client';
import { Server } from 'http';

export function setupWebTerminal(server: Server) {
    const wss = new WebSocket.Server({ server, path: '/ws/terminal'});

    wss.on('connection', async (ws, req) => {
        try {
            const query = url.parse(req.url || '', true).query;
            const token = query.token as string;
            const podName = query.pod as string;
            const containerName = query.container as string;

            const user = jwt.verify(token, config.jwtSecret) as JwtPayload & { username: string };
            const namespace = user.username;
            if (!namespace || !podName || !containerName) {
                ws.close(4002, 'Missing parameters');
                return;
            }

            const stdinStream = new stream.PassThrough();

            ws.on('message', (data) => {
                if (typeof data === 'string') {
                    stdinStream.write(Buffer.from(data));
                } else if (data instanceof Buffer) {
                    stdinStream.write(data);
                }
            });

            ws.on('close', () => {
                stdinStream.end();
            });

            await k8sclient.execInteractive({
                namespace,
                podName,
                containerName,
                command: ['/bin/bash'],
                tty: true,
                stdinStream,
                onStdout: (chunk) => ws.send(chunk),
                onStderr: (chunk) => ws.send(chunk),
                onClose: (status) => {
                    console.log('Terminal closed:', status);
                    ws.close();
                },
            });
        } catch (err) {
            console.log(`WebSocket connection error:${err}`);
            ws.close(1011, 'Internal error');
        }
    });
}