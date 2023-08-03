import {ArgumentsCamelCase, Argv} from "yargs";
import assert from "assert";
import {SwarmAppConfig, loadSwarmAppConfig, initDefaultNetwork, SwarmAppServiceConfig} from "../swarm-app-config.js";
import Docker, {ConfigInfo} from "dockerode";
import {HashedConfigs, initHashedConfigs} from "../hashed-config.js";
import timers from "timers/promises";
import Dockerode from "dockerode";
import {Current, getCurrent} from "../docker-api.js";

export const command = "deploy <app-name>";
export const description = "Deploys swarm app";

export async function createMissingNetworks (dockerode: Docker, currentSwarm: Current, config: SwarmAppConfig, appName: string) {
    if (!config.networks) return;
    for (const n of Object.values(config.networks).filter(e => !e.external)) {
        const foundNetwork = currentSwarm.networks.find(c => c.Name === `${n.name}`);
        if (foundNetwork) continue;
        console.log(`Creating network ${n.name}`);
        await dockerode.createNetwork({
            Name: n.name,
            Attachable: n.attachable,
            Driver: "overlay",
            Labels: {"com.docker.stack.namespace": appName},
        });
    }
}

export async function createMissingConfigs (dockerode: Docker, currentConfigs: ConfigInfo[], hashedConfigs: HashedConfigs, appName: string): Promise<ConfigInfo[]> {
    const newConfigs: ConfigInfo[] = [];
    for (const h of hashedConfigs.unique()) {
        const found = currentConfigs.find(c => c.Spec?.Name === h.hash);
        if (found) continue;
        console.log(`Creating config with hash ${h.hash}`);
        const spec = {
            Name: h.hash,
            Labels: {"com.docker.stack.namespace": appName},
            Data: Buffer.from(h.content).toString("base64"),
        };
        const {id} = await dockerode.createConfig(spec);
        newConfigs.push({ID: id, Spec: spec, CreatedAt: "", UpdatedAt: "", Version: {Index: 0}});
    }
    return newConfigs;
}

export async function removeUnusedConfigs (dockerode: Dockerode, current: Current, hashedConfigs: HashedConfigs) {
    for (const c of current.configs) {
        if (!c.Spec) continue;
        if (hashedConfigs.exists(c.Spec.Name)) continue;
        // TODO: https://github.com/apocas/dockerode/issues/739
        // await dockerode.getConfig(c.ID).remove();
        await timers.setTimeout(0);
        console.log(`Should remove config (${c.Spec.Name}) here, but https://github.com/apocas/dockerode/issues/739`);
    }
}

export async function removeUnusedServices (dockerode: Dockerode, current: Current, serviceConfigs: Record<string, SwarmAppServiceConfig>, appName: string) {
    for (const s of current.services) {
        if (!s.Spec?.Name) continue;
        const serviceShortName = s.Spec.Name.replace(new RegExp(`^${appName}_`), "");
        if (serviceConfigs[serviceShortName]) continue;
        console.log(`Removing service ${s.Spec.Name}`);
        await dockerode.getService(s.ID).remove();
    }
}

interface InitServiceSpecOpts {
    appName: string;
    serviceName: string;
    config: SwarmAppConfig;
    hashedConfigs: HashedConfigs;
    current: Current;
}
export function initServiceSpec ({appName, serviceName, config, hashedConfigs, current}: InitServiceSpecOpts) {
    const serviceConfig = config.services[serviceName];
    return {
        version: 0,
        Name: `${appName}_${serviceName}`,
        Labels: {"com.docker.stack.namespace": appName, ...serviceConfig.service_labels},
        TaskTemplate: {
            ContainerSpec: {
                Image: serviceConfig.image,
                Command: serviceConfig.command,
                Labels: {"com.docker.stack.namespace": appName, ...serviceConfig.container_labels},
                Env: Object.entries(serviceConfig.environment ?? {}).map(([k, v]) => `${k}=${v}`),
                StopSignal: serviceConfig.stop_signal,
                StopGracePeriod: serviceConfig.stop_grace_period,
                Configs: hashedConfigs.service(serviceName).map(({targetPath, hash}) => {
                    return {
                        File: {Name: targetPath, UID: "0", GID: "0", Mode: undefined},
                        ConfigName: hash,
                        ConfigID: current.configs.find(c => c.Spec?.Name === hash)?.ID,
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

interface UpsertServicesOpts {
    dockerode: Dockerode;
    config: SwarmAppConfig;
    current: Current;
    appName: string;
    hashedConfigs: HashedConfigs;
}
export async function upsertServices ({dockerode, config, current, appName, hashedConfigs}: UpsertServicesOpts) {
    for (const serviceName of Object.keys(config.services)) {
        const serviceSpec = initServiceSpec({appName, serviceName, config, hashedConfigs, current});
        const foundService = current.services.find((s) => s.Spec?.Name === `${appName}_${serviceName}`);
        if (!foundService) {
            console.log(`Creating service ${appName}_${serviceName}`);
            await dockerode.createService(serviceSpec);
        } else {
            serviceSpec.version = foundService.Version?.Index ?? 0;
            console.log(`Updating service ${appName}_${serviceName}`);
            await dockerode.getService(foundService.ID).update(serviceSpec);
        }
    }
}

export async function handler (args: ArgumentsCamelCase) {
    const configFiles = args["configFile"];
    const appName = args["appName"];
    assert(typeof appName === "string");
    assert(Array.isArray(configFiles));
    const config = await loadSwarmAppConfig(configFiles);
    initDefaultNetwork(config, appName);

    const dockerode = new Docker();
    const current = await getCurrent({dockerode, appName});

    await createMissingNetworks(dockerode, current, config, appName);
    const hashedConfigs = await initHashedConfigs(config);
    (await createMissingConfigs(dockerode, current.configs, hashedConfigs, appName)).forEach(n => current.configs.push(n));
    await upsertServices({dockerode, config, current, appName, hashedConfigs});

    await removeUnusedServices(dockerode, current, config.services, appName);
    await removeUnusedConfigs(dockerode, current, hashedConfigs);
}

export function builder (yargs: Argv) {
    yargs.positional("app-name", {
        type: "string",
        description: "Application name",
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
