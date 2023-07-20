import {ArgumentsCamelCase, Argv} from "yargs";
import assert from "assert";
import {SwarmAppConfig, loadSwarmAppConfig} from "../swarm-app-config.js";
import Docker, {ConfigInfo, NetworkInspectInfo} from "dockerode";
import {HashedConfigs, initHashedConfigs} from "../hashed-config.js";

export const command = "deploy <stack-name>";
export const description = "Deploys config to swarm cluster";

export async function createMissingNetworks (docker: Docker, currentNetworks: NetworkInspectInfo[], config: SwarmAppConfig, stackName: string) {
    if (!config.networks) return;
    for (const n of Object.values(config.networks).filter(e => !e.external)) {
        const foundNetwork = currentNetworks.find(c => c.Name === `${n.name}`);
        if (foundNetwork) continue;
        console.log(`Creating network ${n.name}`);
        await docker.createNetwork({
            Name: n.name,
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

export function initServiceSpec (stackName: string, serviceName: string, config: SwarmAppConfig, hashedConfigs: HashedConfigs, currentConfigs: ConfigInfo[]) {
    const serviceConfig = config.services[serviceName];
    return {
        // TODO: Create needed mounts from service.mounts and use them in container spec.
        // TODO: Going from replicated to global and vice versa, no problem.

        version: 0,
        Name: `${stackName}_${serviceName}`,
        Labels: {
            "com.docker.stack.namespace": stackName,
        },
        TaskTemplate: {
            ContainerSpec: {
                Image: serviceConfig.image,
                Command: serviceConfig.command,
                Labels: serviceConfig.containerLabels,
                Env: Object.entries(serviceConfig.environment ?? {}).map(([k, v]) => `${k}=${v}`),
                StopSignal: serviceConfig.stop_signal,
                Configs: hashedConfigs.service(serviceName).map(({targetPath, hash}) => {
                    return {
                        File: {Name: targetPath, UID: "0", GID: "0", Mode: undefined},
                        ConfigName: hash,
                        ConfigID: currentConfigs.find(c => c.Spec?.Name === hash)?.ID,
                    };
                }),
            },
            Placement: {
                Constraints: serviceConfig.placement?.constraints,
                Preferences: serviceConfig.placement?.preferences?.map(p => {
                    return {Spread: {SpreadDescriptor: p.spread}};
                }),
                MaxReplicas: serviceConfig.placement?.max_replicas_per_node,
            },
            Networks: serviceConfig.networks?.map((networkKey) => {
                assert(config.networks != null, "config.networks should not be able to be empty");
                assert(config.networks[networkKey]?.name != null, "config.networks should not be able to be empty");
                const networkName = config.networks[networkKey].name;
                return {Target: networkName};
            }),
        },
        EndpointSpec: {
            Ports: serviceConfig.endpoint_spec?.ports.map(p => {
                return {TargetPort: p.target, PublishedPort: p.published, Protocol: p.protocol};
            }),
        },
        Mode: {Replicated: {Replicas: serviceConfig.replicas}},
    };
}

export async function handler (args: ArgumentsCamelCase) {
    const configFiles = args["configFile"];
    const stackName = args["stackName"];
    assert(typeof stackName === "string");
    assert(Array.isArray(configFiles));
    const config = await loadSwarmAppConfig(configFiles, stackName);

    const docker = new Docker();
    const currentConfigs = await docker.listConfigs({filters: {label: [`com.docker.stack.namespace=${stackName}`]}});
    const currentNetworks = await docker.listNetworks({filters: {label: [`com.docker.stack.namespace=${stackName}`]}});
    const currentServices = await docker.listServices({filters: {label: [`com.docker.stack.namespace=${stackName}`]}});

    await createMissingNetworks(docker, currentNetworks, config, stackName);

    const hashedConfigs = await initHashedConfigs(config);
    (await createMissingConfigs(docker, currentConfigs, hashedConfigs, stackName)).forEach(n => currentConfigs.push(n));

    for (const serviceName of Object.keys(config.services)) {
        const serviceSpec = initServiceSpec(stackName, serviceName, config, hashedConfigs, currentConfigs);
        const foundService = currentServices.find((s) => s.Spec?.Name === `${stackName}_${serviceName}`);
        if (!foundService) {
            console.log(`Creating service ${stackName}_${serviceName}`);
            await docker.createService(serviceSpec);
        } else {
            serviceSpec.version = foundService.Version?.Index ?? 0;
            console.log(`Updating service ${stackName}_${serviceName}`);
            await docker.getService(foundService.ID).update(serviceSpec);
        }
    }

    // TODO: Remove unused configs
    // TODO: Remove unused networks
    // TODO: Remove unused services
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
        default: ["swarm-app.yml"],
        alias: "f",
    });
    return yargs;
}
