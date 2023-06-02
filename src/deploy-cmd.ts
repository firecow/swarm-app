import {ArgumentsCamelCase, Argv} from "yargs";
import assert from "assert";
import {CowSwarmConfig, loadCowSwarmConfig} from "./cow-swarm-config.js";
import Docker, {ConfigInfo, NetworkInspectInfo} from "dockerode";
import {HashedConfigs, initHashedConfigs} from "./hashed-config.js";

export const command = "deploy <stack-name>";
export const description = "Deploys config to swarm cluster";

export async function createMissingNetworks (docker: Docker, currentNetworks: NetworkInspectInfo[], config: CowSwarmConfig, stackName: string) {
    if (!config.networks) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [name, n] of Object.entries(config.networks).filter(([_, v]) => !v.external)) {
        const foundNetwork = currentNetworks.find((n) => n.Name === `${name}`);
        if (foundNetwork) continue;
        console.log(`Creating network ${name}`);
        await docker.createNetwork({
            Name: `${name}`,
            Attachable: n.attachable,
            Driver: "overlay",
            Labels: {
                "com.docker.stack.namespace": stackName,
            },
        });
    }
}

export async function createMissingConfigs (docker: Docker, currentConfigs: ConfigInfo[], hashedConfigs: HashedConfigs, stackName: string): Promise<ConfigInfo[]> {
    const newConfigs: ConfigInfo[] = [];
    for (const h of hashedConfigs.unique()) {
        const found = currentConfigs.find(c => c.Spec?.Name === h.hash);
        if (found) continue;
        console.log(`Creating config with hash ${h.hash}`);
        const spec = {
            Name: h.hash,
            Labels: {
                "com.docker.stack.namespace": stackName,
            },
            Data: Buffer.from(h.content).toString("base64"),
        };
        const {id} = await docker.createConfig(spec);
        newConfigs.push({ID: id, Spec: spec, CreatedAt: "", UpdatedAt: "", Version: {Index: 0}});
    }
    return newConfigs;
}

export async function handler (args: ArgumentsCamelCase) {
    const configFiles = args["configFile"];
    assert(Array.isArray(configFiles));
    const config = await loadCowSwarmConfig(configFiles);

    const stackName = args["stackName"];
    assert(typeof stackName === "string");

    const docker = new Docker();

    const currentConfigs = await docker.listConfigs({filters: {label: [`com.docker.stack.namespace=${stackName}`]}});
    const currentNetworks = await docker.listNetworks({filters: {label: [`com.docker.stack.namespace=${stackName}`]}});
    const currentServices = await docker.listServices({filters: {label: [`com.docker.stack.namespace=${stackName}`]}});

    await createMissingNetworks(docker, currentNetworks, config, stackName);
    const hashedConfigs = await initHashedConfigs(config);
    const newConfigs = await createMissingConfigs(docker, currentConfigs, hashedConfigs, stackName);
    newConfigs.forEach(n => currentConfigs.push(n));

    for (const [serviceName, service] of Object.entries(config.services)) {

        const serviceBody = {
            // TODO: Create needed endpoints from service.endpoints
            // TODO: Create needed mounts from service.mounts

            version: 0,
            Name: `${stackName}_${serviceName}`,
            Labels: {
                "com.docker.stack.namespace": stackName,
            },
            TaskTemplate: {
                ContainerSpec: {
                    Image: service.image,
                    Command: service.command,
                    Labels: service.containerLabels,
                    Env: Object.entries(service.environment ?? {}).map(([k, v]) => `${k}=${v}`),
                    Configs: hashedConfigs.service(serviceName).map(({targetPath, hash}) => {
                        return {
                            File: {Name: targetPath, UID: "0", GID: "0"},
                            ConfigName: hash,
                            ConfigID: currentConfigs.find(c => c.Spec?.Name === hash)?.ID,
                        };
                    }),
                },
                Placement: {
                    Constraints: service.placement?.constraints,
                    Preferences: service.placement?.preferences?.map(p => {
                        return {Spread: {SpreadDescriptor: p.spread}};
                    }),
                    MaxReplicas: service.placement?.max_replicas_per_node,
                },
                Networks: Object.entries(service.networks ?? {}).map(([name, n]) => {
                    return {
                        Target: name,
                        Aliases: n.aliases,
                    };
                }),
            },
            Mode: {Replicated: {Replicas: service.replicas}},
        };
        const foundService = currentServices.find((s) => s.Spec?.Name === `${stackName}_${serviceName}`);
        if (!foundService) {
            console.log(`Creating service ${stackName}_${serviceName}`);
            await docker.createService(serviceBody);
        } else {
            serviceBody.version = foundService.Version?.Index ?? 0;
            console.log(`Updating service ${stackName}_${serviceName}`);
            await docker.getService(foundService.ID).update(serviceBody);
        }

        // TODO: Remove unused configs
    }

    console.log("I still need some work");
}

export function builder (yargs: Argv) {
    yargs.positional("stack-name", {
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
