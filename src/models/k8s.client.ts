import * as k8s from '@kubernetes/client-node'

export class k8sClient {
    private kc: k8s.KubeConfig;
    private coreV1Api: k8s.CoreV1Api;
    private appsV1Api: k8s.AppsV1Api;

    constructor() {
        this.kc = new k8s.KubeConfig();
        try {
            this.kc.loadFromCluster();
        } catch {
            this.kc.loadFromDefault();
        }
        this.coreV1Api = this.kc.makeApiClient(k8s.CoreV1Api);
        this.appsV1Api = this.kc.makeApiClient(k8s.AppsV1Api);
    }

    async listNamespaces(): Promise<k8s.V1Namespace[]> {
        const res = await this.coreV1Api.listNamespace();
        return res.items;
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
}