import {ConfigInfo, NetworkInspectInfo, Service} from "dockerode";
import Dockerode from "dockerode";

export interface Current {
    services: Service[];
    configs: ConfigInfo[];
    networks: NetworkInspectInfo[];
}

export async function getCurrent ({dockerode, appName}: {dockerode: Dockerode; appName: string}): Promise<Current> {
    return {
        configs: await dockerode.listConfigs({filters: {label: [`com.docker.stack.namespace=${appName}`]}}),
        networks: await dockerode.listNetworks({filters: {label: [`com.docker.stack.namespace=${appName}`]}}),
        services: await dockerode.listServices({filters: {label: [`com.docker.stack.namespace=${appName}`]}}),
    };
}
