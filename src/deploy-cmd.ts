import {ArgumentsCamelCase, Argv} from "yargs";
import assert from "assert";
import {CowSwarmConfig, loadCowSwarmConfig} from "./cow-swarm-config.js";
import Docker from "dockerode";

export const command = "deploy <stack_name>";
export const description = "Deploys config to swarm cluster";

export async function createMissingNetworks (docker: Docker, config: CowSwarmConfig, stackName: string) {
    if (!config.networks) return;
    const networks = await docker.listNetworks({filters: {label: [`com.docker.stack.namespace=${stackName}`]}});
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [networkName, network] of Object.entries(config.networks).filter(([_, v]) => !v.external)) {
        const foundNetwork = networks.find((s) => s.Name === `${networkName}`);
        if (foundNetwork) continue;
        await docker.createNetwork({
            Name: `${networkName}`,
            Attachable: network.attachable,
            Driver: "overlay",
            Labels: {
                "com.docker.stack.namespace": stackName,
                "cowswarm.stack_name": stackName,
            },
        });
    }
}

export async function handler (args: ArgumentsCamelCase) {
    const configFiles = args["configFile"];
    assert(Array.isArray(configFiles));
    const config = await loadCowSwarmConfig(configFiles);

    const stackName = args["stack_name"];
    assert(typeof stackName === "string");

    const docker = new Docker();

    await createMissingNetworks(docker, config, stackName);

    const services = await docker.listServices({filters: {label: [`com.docker.stack.namespace=${stackName}`]}});
    for (const [serviceName, service] of Object.entries(config.services)) {
        // TODO: Create needed configs from service.configs. Name == content checksum

        const serviceBody = {
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
                    Env: Object.entries(service.environment ?? {}).map(([k, v]) => `${k}=${v}`),
                    // Configs: TODO: Convert service.configs to docker api config references;
                },
                Placement: {
                    Constraints: service.placement?.constraints,
                    Preferences: service.placement?.preferences?.map(p => {
                        return {Spread: {SpreadDescriptor: p.spread}};
                    }),
                    MaxReplicas: service.placement?.max_replicas_per_node,
                },
                Networks: service.networks == null ? undefined : Object.entries(service.networks).map(([name, n]) => {
                    return {
                        Target: name,
                        Aliases: n.aliases,
                    };
                }),
            },
            Mode: {Replicated: {Replicas: service.replicas}},
        };
        const foundService = services.find((s) => s.Spec?.Name === `${stackName}_${serviceName}`);
        if (!foundService) {
            await docker.createService(serviceBody);
        } else {
            serviceBody.version = foundService.Version?.Index ?? 0;
            await docker.getService(foundService.ID).update(serviceBody);
        }

    }

    console.log("I still need some work");
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
