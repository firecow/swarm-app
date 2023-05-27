import Docker from "dockerode";
import {CowSwarmConfig} from "./cow-swarm-config.js";
import assert from "assert";

export async function convertClusterToCowSwarmConfig (docker: Docker, name: string) {
    const cowSwarmConfig: CowSwarmConfig = {
        services: {},
        networks: {},
    };

    // const configs = await docker.listConfigs({filters: {label: [`com.docker.stack.namespace=${name}`]}});
    // const secrets = await docker.listSecrets({filters: {label: [`com.docker.stack.namespace=${name}`]}});
    // const volumes = await docker.listVolumes({filters: {label: [`com.docker.stack.namespace=${name}`]}});
    const networks = await docker.listNetworks({filters: {label: [`com.docker.stack.namespace=${name}`]}});
    // const services = await docker.listServices({filters: {label: [`com.docker.stack.namespace=${name}`]}});

    networks.forEach((n) => {
        assert(cowSwarmConfig.networks);
        cowSwarmConfig.networks[n.Name] = {
            attachable: n.Attachable,
            external: false, // How the duce is deducted from the docker api.
        };
    });

    return cowSwarmConfig;
}