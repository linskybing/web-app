import * as k8s from '@kubernetes/client-node'
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import handlebars from 'handlebars';
import * as stream from 'stream'
import { error } from 'console';

export class k8sClient {
    private kc: k8s.KubeConfig;
    private exec: k8s.Exec;
    private coreV1Api: k8s.CoreV1Api;
    private appsV1Api: k8s.AppsV1Api;

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
                accessModes: ['ReadWriteOnce'],
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
                accessModes: ['ReadWriteOnce'],
                storageClassName: 'hostpath',
                resources: { requests: { storage: '5Gi' } },
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
        const res = await this.coreV1Api.readNamespacedPod({ name, namespace});
        if (!res.status?.podIP) {
            throw new Error(`Pod '${name}' in namespace '${namespace}' has no IP (pod may not be running)`);
        }
        return res.status.podIP;
    }

    async execCommand(params: {
        namespace: string;
        podName: string;
        containerName: string;
        command: string[];
        tty?: boolean;
    }): Promise<{ stdout: string; stderr: string }> {
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
}

export const k8sclient = new k8sClient();