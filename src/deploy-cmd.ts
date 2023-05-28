import {ArgumentsCamelCase, Argv} from "yargs";
import assert from "assert";
import {loadCowSwarmConfig} from "./cow-swarm-config.js";
import Docker from "dockerode";

export const command = "deploy <stack_name>";
export const description = "Deploys config to swarm cluster";

export async function handler (args: ArgumentsCamelCase) {
    const configFiles = args["configFile"];
    assert(Array.isArray(configFiles));
    const config = await loadCowSwarmConfig(configFiles);

    const stackName = args["stack_name"];
    assert(typeof stackName === "string");
    const docker = new Docker();

    const services = await docker.listServices({filters: {label: [`com.docker.stack.namespace=${stackName}`]}});
    for (const [serviceName, service] of Object.entries(config.services)) {
        // TODO: Create needed configs from service.configs. Name == content checksum
        // TODO: Create needed networks from service.networks. Leave out external:true one

        const serviceBody = {
            // TODO: Create needed placeement from service.placement
            // TODO: Create needed endpoints from service.endpoints
            // TODO: Create needed mounts from service.mounts

            version: 0,
            Name: `${stackName}_${serviceName}`,
            Labels: {
                "com.docker.stack.namespace": stackName,
                "cowswarm.stack_name": stackName,
            },
            TaskTemplate: {
                ContainerSpec: {
                    Image: service.image,
                    Command: service.command,
                    Labels: service.containerLabels,
                    Env: Object.entries(service.environment ?? {}).map((k, v) => `${k}=${v}`),
                    // Configs: TODO: Convert service.configs to docker api config references;
                },

            },
            Mode: {Replicated: {Replicas: service.replicas}},
            // Networks: TODO: Convert service.networks to docker api network attachment
        };

        const foundService = services.find((s) => s.Spec?.Name === `${stackName}_${serviceName}`);
        if (!foundService) {
            await docker.createService(serviceBody);
        } else {
            serviceBody.version = foundService.Version?.Index ?? 0;
            await docker.getService(foundService.ID).update(serviceBody);
        }

    }

    console.log("I still need some work", services);
}

export function builder (yargs: Argv) {
    yargs.positional("stack_name", {
        type: "string",
        description: "Stack name",
    });
    yargs.option("config-file", {
        type: "array",
        description: "Config file(s)",
        demandOption: false,
        default: ["cowswarm.yml"],
        alias: "-f",
    });
    return yargs;
}
