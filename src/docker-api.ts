import Docker, {ConfigInfo, NetworkInspectInfo, Service} from "dockerode";
import {SwarmAppConfig} from "./swarm-app-config.js";
import assert from "assert";
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

export async function convertCurrentToSwarmAppConfig (dockerode: Docker, name: string) {
    const swarmAppConfig: SwarmAppConfig = {
        services: {},
        networks: {},
    };

    // const configs = await dockerode.listConfigs({filters: {label: [`com.docker.stack.namespace=${name}`]}});
    // const secrets = await dockerode.listSecrets({filters: {label: [`com.docker.stack.namespace=${name}`]}});
    // const volumes = await dockerode.listVolumes({filters: {label: [`com.docker.stack.namespace=${name}`]}});
    const networks = await dockerode.listNetworks({filters: {label: [`com.docker.stack.namespace=${name}`]}});
    // const services = await dockerode.listServices({filters: {label: [`com.docker.stack.namespace=${name}`]}});

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    networks.forEach((n) => {
        assert(swarmAppConfig.networks);
        // swarmAppConfig.networks[n.Name] = {
        //     attachable: n.Attachable,
        //     external: false, // How the duce is deducted from the docker api.
        // };
    });

    return swarmAppConfig;
}