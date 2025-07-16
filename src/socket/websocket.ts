import WebSocket from 'ws';
import jwt, { JwtPayload } from 'jsonwebtoken'
import url from 'url';
import stream from 'stream';
import { config } from '../config/config';
import { k8sclient } from '../models/k8s.client';
import { IncomingMessage, Server } from 'http';

export function setupWebSocket(server: Server) {
    const wss = new WebSocket.Server({ noServer: true });

    server.on('upgrade', (req, socket, head) => {
        const pathname = new URL(req.url || '', `http://${req.headers.host}`).pathname;

        if (pathname === '/ws/terminal') {
            wss.handleUpgrade(req, socket, head, (ws) => {
              setupTerminal(ws, req);
            });
        } else if (pathname === '/ws/informer') {
            wss.handleUpgrade(req, socket, head, (ws) => {
              setupInformer(ws, req);
            });
        } else {
            socket.destroy();
        }
    });
}

function filterResource(resourceName: string, obj: any) {
  const metadata = obj.metadata || {};
  const status = obj.status || {};
  const spec = obj.spec || {};

  const base = {
    name: metadata.name,
    namespace: metadata.namespace,
  };

  switch (resourceName) {
    case 'pod':
      return {
        ...base,
        phase: status.phase || null,
      };
    case 'deployment':
      return {
        ...base,
        replicas: spec.replicas ?? null,
        availableReplicas: status.availableReplicas ?? null,
        conditions: Array.isArray(status.conditions)
          ? status.conditions.map((c: any) => ({ type: c.type, status: c.status }))
          : undefined,
      };
    case 'service':{
      const externalIP =
        status?.loadBalancer?.ingress?.[0]?.ip ||
        status?.loadBalancer?.ingress?.[0]?.hostname ||
        (Array.isArray(spec.externalIPs) ? spec.externalIPs[0] : null) ||
        null;

      return {
        ...base,
        type: spec.type || null,
        clusterIP: spec.clusterIP || null,
        externalIP,
        ports: Array.isArray(spec.ports)
          ? spec.ports.map((p: any) => ({
              port: p.port,
              protocol: p.protocol,
              nodePort: p.nodePort ?? null,
            }))
          : [],
      };
    }
    default:
      return {
        ...base,
        phase: status.phase || null,
      };
  }
}
async function setupTerminal(ws: WebSocket, req: IncomingMessage) {
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

        console.log(`[Terminal] Client connected terminal for namespace: ${namespace}`);

        const stdinStream = new stream.PassThrough();

        ws.on('message', (data) => {
          try {
            const msg = JSON.parse(data.toString());
            if (msg.type === 'resize' && typeof msg.cols === 'number' && typeof msg.rows === 'number') {
              k8sclient.resizeTerminal({
                namespace,
                podName,
                containerName,
                cols: msg.cols,
                rows: msg.rows,
              });
              return;
            }
          } catch (_) {
            // not JSON, treat as input
          }

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
        if (err instanceof Error) {
          console.error('WebSocket connection error:', err.message);
          console.error(err.stack);
        }
        ws.close(1011, 'Internal error');
    }
}

async function setupInformer(ws: WebSocket, req: IncomingMessage) {
  try {
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
      try {
        const watcher = await k8sclient.watchResource(resource.path, {
          onAdded: (obj: any) =>
            ws.send(JSON.stringify({ type: 'ADDED', resource: resource.name, obj: filterResource(resource.name, obj) })),
          onModified: (obj: any) =>
            ws.send(JSON.stringify({ type: 'MODIFIED', resource: resource.name, obj: filterResource(resource.name, obj) })),
          onDeleted: (obj: any) =>
            ws.send(JSON.stringify({ type: 'DELETED', resource: resource.name, obj: filterResource(resource.name, obj) })),
          onError: (err: any) => {
            if (err.name === 'AbortError') {
                console.log(`${resource.name} watcher aborted normally.`);
                return;
            }
            console.error(`${resource.name} watcher error`, err);
            try {
              ws.send(JSON.stringify({ error: `${resource.name} watcher error` }));
            } catch {}
            ws.close();
          },
        });
        watchers.push(watcher);
      } catch (watchErr) {
        console.error(`Failed to watch resource: ${resource.name}`, watchErr);
        ws.send(JSON.stringify({ error: `Failed to watch ${resource.name}` }));
      }
    }

    ws.on('close', () => {
      for (const watcher of watchers) {
        watcher.abort();
      }
    });
  } catch (err) {
    console.error('Unhandled error in informer WebSocket connection:', err);
    try {
      ws.send(JSON.stringify({ error: 'Internal server error' }));
    } catch {}
    ws.close(1011, 'Unhandled error');
  }
}