import Docker from "dockerode";
import {SwarmAppConfig} from "./swarm-app-config.js";
import assert from "assert";

export async function convertClusterToSwarmAppConfig (docker: Docker, name: string) {
    const swarmAppConfig: SwarmAppConfig = {
        services: {},
        networks: {},
    };

    // const configs = await docker.listConfigs({filters: {label: [`com.docker.stack.namespace=${name}`]}});
    // const secrets = await docker.listSecrets({filters: {label: [`com.docker.stack.namespace=${name}`]}});
    // const volumes = await docker.listVolumes({filters: {label: [`com.docker.stack.namespace=${name}`]}});
    const networks = await docker.listNetworks({filters: {label: [`com.docker.stack.namespace=${name}`]}});
    // const services = await docker.listServices({filters: {label: [`com.docker.stack.namespace=${name}`]}});

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