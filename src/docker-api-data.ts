import Docker from "dockerode";
import {CowSwarmConfig} from "./cow-swarm-config.js";

export function convertClusterToCowSwarmConfig (docker: Docker) {
    const cowSwarmConfig: CowSwarmConfig = {
        services: {},
    };

    return cowSwarmConfig;
}