import * as k8s from '@kubernetes/client-node'
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import handlebars from 'handlebars';
import * as stream from 'stream';
import WebSocket from 'ws';
export interface WatchCallbackGeneric {
  onAdded?: (obj: any) => void;
  onModified?: (obj: any) => void;
  onDeleted?: (obj: any) => void;
  onError?: (err: any) => void;
}

export interface ExecInteractiveParams  {
  namespace: string;
  podName: string;
  containerName: string;
  command: string[];
  onStdout: (chunk: Buffer) => void;
  onStderr: (chunk: Buffer) => void;
  onClose?: (status: k8s.V1Status) => void;
  stdinStream: stream.Readable;
  tty?: boolean;
}

export interface ExecCommandParams {
  namespace: string;
  podName: string;
  containerName: string;
  command: string[];
  tty?: boolean;
}

export class k8sClient {
    private kc: k8s.KubeConfig;
    private exec: k8s.Exec;
    private coreV1Api: k8s.CoreV1Api;
    private appsV1Api: k8s.AppsV1Api;
    private watch: k8s.Watch;
    private activeWsMap: Map<string, WebSocket.WebSocket> = new Map();
    constructor() {
        this.kc = new k8s.KubeConfig();
        try {
            this.kc.loadFromCluster();
        } catch {
            this.kc.loadFromDefault();
        }
        this.exec = new k8s.Exec(this.kc);
        this.coreV1Api = this.kc.makeApiClient(k8s.CoreV1Api);
        this.appsV1Api = this.kc.makeApiClient(k8s.AppsV1Api);
        this.watch = new k8s.Watch(this.kc);
    }

    async listPods(namespace?: string): Promise<k8s.V1Pod[]> {
        if (namespace) {
            const res = await this.coreV1Api.listNamespacedPod({namespace: namespace});
            return res.items;
        } else {
            const res = await this.coreV1Api.listPodForAllNamespaces();
            return res.items;
        }
    }

    async listNamespaces(): Promise<k8s.V1Namespace[]> {
        const res = await this.coreV1Api.listNamespace();
        return res.items;
    }

    async createNamespace(namespace: string): Promise<k8s.V1Namespace> {
        try {
            const response = await this.coreV1Api.createNamespace({
                                        body: {
                                            metadata: {
                                            name: `${namespace}`,
                                            },
                                        },
                                    });
            return response;
        } catch (error: any) {
            if (error.statusCode === 409) {
                console.log(`Namespace "${namespace}" already exists.`);
            } else {
                console.error(`Failed to create namespace "${namespace}":`, error);
            }
            throw error;
        }
    }

    async deleteNamespace(namespace: string): Promise<k8s.V1Status> {
        try {
            const res = await this.coreV1Api.deleteNamespace({name: namespace});
            return res;
        } catch (error: any) {
            const statusCode = error.response?.statusCode;
            if (statusCode === 409) {
                console.log(`Namespace "${namespace}" is currently terminating (Conflict 409).`);
                throw new Error(`Namespace "${namespace}" is terminating and cannot be deleted now.`);
            } else if (statusCode === 404) {
                console.log(`Namespace "${namespace}" not found.`);
                throw new Error(`Namespace "${namespace}" does not exist.`);
            } else {
                console.error(`Failed to delete namespace "${namespace}":`, error);
                throw error;
            }

        }
    }

    async listPVs() {
        try {
            const res = await this.coreV1Api.listPersistentVolume();
            const pvList = res.items.map(pv => ({
                name: pv.metadata?.name,
                capacity: pv.spec?.capacity?.storage,
                accessModes: pv.spec?.accessModes,
                status: pv.status?.phase,
                claim: pv.spec?.claimRef?.name,
            }));
            return pvList;
        } catch (err) {
            console.error('Failed to list PVs:', err);
            throw err;
        }
    }

    async createPV(name: string) {
        const volumnName = `pv-${name}`;
        const hostPathDir = `/mnt/data/${name}`;

        // [TODO] NFS
        const pv: k8s.V1PersistentVolume = {
            metadata: { name: volumnName },
            spec : {
                capacity: { storage: '20Gi' },
                accessModes: ['ReadWriteMany'],
                persistentVolumeReclaimPolicy: 'Retain',
                storageClassName: 'hostpath',
                 hostPath: {
                    path: hostPathDir,
                    type: 'DirectoryOrCreate',
                },
            },
        };

        try {
            const res = await this.coreV1Api.createPersistentVolume( { body: pv} );
            console.log(`Created PersistentVolumn: ${volumnName}`);
            return res;
        } catch (err: any) {
            console.error('Error creating pv:', err.body ?? err);
            throw err;
        }
    }

    async deletePV(name: string) {
        try {
            const res = await this.coreV1Api.deletePersistentVolume({ name });
            return res;
        } catch (err: any) {
            console.error('Error deleting pv:', err.body ?? err);
            throw err;
        }
    }

    async listAllPVCs() {
        try {
            const res = await this.coreV1Api.listPersistentVolumeClaimForAllNamespaces();
            const pvcList = res.items.map(pvc => ({
                name: pvc.metadata?.name,
                namespace: pvc.metadata?.namespace,
                requestedStorage: pvc.spec?.resources?.requests?.storage,
                accessModes: pvc.spec?.accessModes,
                status: pvc.status?.phase,
                volumeName: pvc.spec?.volumeName,
            }));
            return pvcList;
        } catch (err) {
            console.error('Failed to list PVCs:', err);
            throw err;
        }
    }

    async listPVCs(namespace: string) {
        try {
            const res = await this.coreV1Api.listNamespacedPersistentVolumeClaim({ namespace });
            const pvcList = res.items.map(pvc => ({
                name: pvc.metadata?.name,
                namespace: pvc.metadata?.namespace,
                requestedStorage: pvc.spec?.resources?.requests?.storage,
                accessModes: pvc.spec?.accessModes,
                status: pvc.status?.phase,
                volumeName: pvc.spec?.volumeName,
            }));
            return pvcList;
        } catch (err) {
            console.error('Failed to list PVCs:', err);
            throw err;
        }
    }
 
    async createNamespacedPVC(name: string, namespace: string) {
        const claimName = `pvc-${name}`;

        // [TODO] NFS
        const pvc: k8s.V1PersistentVolumeClaim = {
            metadata: { name: claimName },
            spec: {
                accessModes: ['ReadWriteMany'],
                storageClassName: 'nfs-sc',
                resources: { requests: { storage: '15Gi' } },
            },
        };

        try {
            await this.coreV1Api.createNamespacedPersistentVolumeClaim({ namespace: namespace, body: pvc });
            const res = await this.coreV1Api.readNamespacedPersistentVolumeClaim( { name: claimName, namespace: namespace} );
            console.log(`PVC status: ${res.status?.phase}`);

            return {
                pvc: claimName,
                status: res.status?.phase,
            };
        } catch (err: any) {
            console.error('Error creating volume:', err.body ?? err);
            throw err;
        }
    }

    async delteNamespacedPVC(name: string, namespace: string) {
        try {
            const res = await this.coreV1Api.deleteNamespacedPersistentVolumeClaim({ name, namespace });
            return res;
        } catch (err: any) {
            console.error('Error deleting pvc:', err.body ?? err);
            throw err;
        }
    }

    /**
     * service
     */
    async createService(namespace: string, manifest: k8s.V1Service) {
        try {
            const res = await this.coreV1Api.createNamespacedService({ namespace, body: manifest });
            console.log('Service created:', res.metadata?.name);
            return res;
        } catch (err: any) {
            console.error('Failed to create service:', err);
            throw err;
        }
    }

    async deleteService(namespace: string, name: string) {
        try {
            const res = await this.coreV1Api.deleteNamespacedService({ name, namespace });
            console.log('Service deleted:', res.metadata?.name);
            return res;
        } catch (err: any) {
            console.error('Failed to delete service:', err);
            throw err;
        }
    }
    /**
     * Pod
     */
    async createPod(namespace: string, manifest: k8s.V1Pod) {
        try {
            const res = await this.coreV1Api.createNamespacedPod({ namespace, body: manifest });
            console.log('Pod created:', res.metadata?.name);
            return res;
        } catch (err: any) {
            console.error('Failed to create Pod:', err);
            throw err;
        }
    }

    async deletePod(namespace: string, name: string) {
        try {
            const res = await this.coreV1Api.deleteNamespacedPod({ name, namespace });
            console.log('Pod deleted:', res.metadata?.name);
            return res;
        } catch (err: any) {
            console.error('Failed to delete Pod:', err);
            throw err;
        }
    }

    async applyYamls(filename: string, namespace: string) {
        const absolutePath = path.resolve(__dirname, `../yamls/${filename}`);
        const fileContent = fs.readFileSync(absolutePath, 'utf8');
        const manifests  = yaml.loadAll(fileContent) as any[];
        try {
            for (const manifest of manifests) {
                if (!manifest || !manifest.kind) continue;

                switch (manifest.kind) {
                    case 'ConfigMap':
                        await this.coreV1Api.createNamespacedConfigMap({ namespace, body: manifest});
                        break;
                    case 'Pod':
                        await this.coreV1Api.createNamespacedPod({ namespace, body: manifest });
                        break;
                    case 'Service':
                        await this.coreV1Api.createNamespacedService({ namespace, body: manifest });
                        break;
                    case 'Deployment':
                        await this.appsV1Api.createNamespacedDeployment({ namespace, body: manifest });
                        break;
                    default:
                        break;
                }
            }
        } catch (err: any) {
            console.error(err);
            throw err;
        }        
    }

    async applyTemplateYaml(filename: string, namespace: string, values: any) {
        const absolutePath = path.resolve(__dirname, `../yamls/${filename}`);
        const fileContent = fs.readFileSync(absolutePath, 'utf8');
        const compiled = handlebars.compile(fileContent);
        const renderedYaml = compiled(values);
        const manifests  = yaml.loadAll(renderedYaml) as any[];
        try {
            for (const manifest of manifests) {
                if (!manifest || !manifest.kind) continue;

                switch (manifest.kind) {
                    case 'ConfigMap':
                        await this.coreV1Api.createNamespacedConfigMap({ namespace, body: manifest});
                        break;
                    case 'Pod':
                        await this.coreV1Api.createNamespacedPod({ namespace, body: manifest });
                        break;
                    case 'Service':
                        await this.coreV1Api.createNamespacedService({ namespace, body: manifest });
                        break;
                    case 'Deployment':
                        await this.appsV1Api.createNamespacedDeployment({ namespace, body: manifest });
                        break;
                    default:
                        break;
                }
            }
        } catch (err: any) {
            console.error(err);
            throw err;
        }        
    }

    async deleteYamls(filename: string, namespace: string) {
        const absolutePath = path.resolve(__dirname, `../yamls/${filename}`);
        const fileContent = fs.readFileSync(absolutePath, 'utf8');
        const manifests  = yaml.loadAll(fileContent) as any[];
        try {
            for (const manifest of manifests) {
                if (!manifest || !manifest.kind) continue;

                const name = manifest.metadata.name;
                switch (manifest.kind) {
                    case 'ConfigMap':
                        await this.coreV1Api.deleteNamespacedConfigMap({ namespace, name});
                        break;
                    case 'Pod':
                        await this.coreV1Api.deleteNamespacedPod({ namespace, name });
                        break;
                    case 'Service':
                        await this.coreV1Api.deleteNamespacedService({ namespace, name });
                        break;
                    case 'Deployment':
                        await this.appsV1Api.deleteNamespacedDeployment({ namespace, name });
                        break;
                    default:
                        break;
                }
            }
        } catch (err: any) {
            console.error(err);
            throw err;
        }    
    }

    async getPodIP(namespace: string, name: string): Promise<string> {
        const res = await this.coreV1Api.readNamespacedPod({ name, namespace });
        if (!res.status?.podIP) {
            throw new Error(`Pod '${name}' in namespace '${namespace}' has no IP (pod may not be running)`);
        }
        return res.status.podIP;
    }

    async checkPodExist(namespace: string, name: string): Promise<boolean> {
        const res = await this.coreV1Api.readNamespacedPod({ name, namespace });
        if (!res.status?.podIP) {
            return false;
        }
        return true;
    }
    async getNodePortInfo(serviceName: string, namespace: string) {
        const svc = await this.coreV1Api.readNamespacedService({ name: serviceName, namespace });

        if (svc.spec?.type !== 'NodePort') {
            throw new Error(`Service ${serviceName} is not a NodePort service.`);
        }

        const port = svc.spec.ports?.[0];
        if (!port?.nodePort) {
            throw new Error(`No nodePort found in service ${serviceName}.`);
        }

        const nodePort = port.nodePort;

        const nodeResp = await this.coreV1Api.listNode();
        const nodeIPs: string[] = [];

        for (const node of nodeResp.items) {
            const addresses = node.status?.addresses || [];
            for (const addr of addresses) {
            if (addr.type === 'InternalIP') {
                nodeIPs.push(addr.address);
            }
            }
        }

        return nodeIPs.map(ip => `http://${ip}:${nodePort}`);
    }

    async execCommand(params: ExecCommandParams): Promise<{ stdout: string; stderr: string }> {
        const { namespace, podName, containerName, command, tty = false } = params;

        let stdout = '';
        let stderr = '';

        const stdoutStream = new stream.Writable({
        write(chunk, encoding, callback) {
            stdout += chunk.toString();
            callback();
        },
        });

        const stderrStream = new stream.Writable({
        write(chunk, encoding, callback) {
            stderr += chunk.toString();
            callback();
        },
        });

        return new Promise((resolve, reject) => {
        this.exec.exec(
            namespace,
            podName,
            containerName,
            command,
            stdoutStream,
            stderrStream,
            null, // stdin
            tty,
            (status: k8s.V1Status) => {
                if (status.status === 'Success') {
                    resolve({ stdout, stderr });
                } else {
                    const msg = status.message || status.reason || JSON.stringify(status);
                    const error = new Error(`Command failed: ${msg}`);
                    Object.assign(error, { stdout, stderr, status });
                    reject(error);
                }
            }
            ).catch((err) => {
                reject(new Error(`WebSocket connection failed: ${err.message}`))
            });
        });
    }
    private makeSessionKey(namespace: string, pod: string, container: string) {
        return `${namespace}::${pod}::${container}`;
    }
    async execInteractive(params: ExecInteractiveParams) {
        const {
            namespace,
            podName,
            containerName,
            command,
            onStdout,
            onStderr,
            onClose,
            stdinStream,
            tty = true,
        } = params;
        stdinStream.resume();
        const stdoutStream = new stream.Writable({
        write(chunk, encoding, callback) {
            // process.stdout.write(chunk);
            onStdout(Buffer.from(chunk));
            callback();
        },
        });

        const stderrStream = new stream.Writable({
            write(chunk, encoding, callback) {
                // process.stderr.write(chunk);
                onStderr(Buffer.from(chunk));
                callback();
            },
        });

        const ws = await this.exec.exec(
            namespace,
            podName,
            containerName,
            command,
            stdoutStream,
            stderrStream,
            stdinStream,
            tty,
            (status) => {
                onClose?.(status);
                this.activeWsMap.delete(this.makeSessionKey(namespace, podName, containerName));
            }
        );
        this.activeWsMap.set(this.makeSessionKey(namespace, podName, containerName), ws);
        // this.resizeTerminal({ namespace, podName, containerName, cols: 32, rows: 32});
    }
    async resizeTerminal(params: {
                    namespace: string;
                    podName: string;
                    containerName: string;
                    cols: number;
                    rows: number;
                }) {
        const { namespace, podName, containerName, cols, rows } = params;
        const key = this.makeSessionKey(namespace, podName, containerName);
        const ws = this.activeWsMap.get(key);
        if (!ws) {
            console.warn(`No active WebSocket for terminal session: ${key}`);
            return;
        }
        if (ws.readyState !== ws.OPEN) {
            console.warn('k8s exec WebSocket not OPEN');
        }
        console.log(`resize cols ${cols} rows ${rows}`);
        const resizePayload = JSON.stringify({ Width: cols, Height: rows });
        const payload = Buffer.concat([Buffer.from([4]), Buffer.from(resizePayload, 'utf-8')]);
        ws.send(payload);
    }
    async watchResource(path: string, callbacks: WatchCallbackGeneric): Promise<AbortController> {
        const watcher = await this.watch.watch(
        path,
        {},
        (phase, obj) => {
            switch (phase) {
            case 'ADDED':
                callbacks.onAdded?.(obj);
                break;
            case 'MODIFIED':
                callbacks.onModified?.(obj);
                break;
            case 'DELETED':
                callbacks.onDeleted?.(obj);
                break;
            }
        },
        (err) => {
            callbacks.onError?.(err);
        }
        );
        return watcher;
    }
    }

export const k8sclient = new k8sClient();