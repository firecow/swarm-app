import assert from "assert";
import {SwarmAppConfig} from "./swarm-app-config.js";
import {HashedConfigs} from "./hashed-config.js";
import {DockerResources} from "./docker-api.js";
import {ContainerTaskSpec, ServiceSpec} from "dockerode";
import {sortObjectKeys} from "./object.js";

// eslint-disable-next-line
export function isContainerTaskSpec (object: any): object is ContainerTaskSpec {
    return "ContainerSpec" in object;
}

export function sortServiceSpec (s: ServiceSpec | undefined) {
    if (!isContainerTaskSpec(s?.TaskTemplate)) return;

    if (s?.Labels) {
        s.Labels = sortObjectKeys(s.Labels);
    }
    if (s?.TaskTemplate.ContainerSpec?.Labels) {
        s.TaskTemplate.ContainerSpec.Labels = sortObjectKeys(s.TaskTemplate.ContainerSpec.Labels);
    }
    s?.TaskTemplate.ContainerSpec?.Env?.sort((a, b) => a.localeCompare(b));
    s?.TaskTemplate.ContainerSpec?.Configs?.sort((a, b) => {
        if (!a.ConfigID) return 0;
        if (!b.ConfigID) return 0;
        return a.ConfigID.localeCompare(b.ConfigID);
    });

    // Networks
    // Endpoint ports
}

interface InitServiceSpecOpts {
    appName: string;
    serviceName: string;
    config: SwarmAppConfig;
    hashedConfigs: HashedConfigs;
    current?: DockerResources;
}

export function initServiceSpec ({appName, serviceName, config, hashedConfigs, current}: InitServiceSpecOpts): ServiceSpec & {version?: number} {
    const serviceConfig = config.services[serviceName];
    const serviceSpec: ServiceSpec & {version?: number} = {
        version: 0,
        Name: `${appName}_${serviceName}`,
        Labels: serviceConfig.service_labels,
        TaskTemplate: {
            ContainerSpec: {
                Image: serviceConfig.image,
                Labels: serviceConfig.container_labels,
                Command: serviceConfig.command,
                Env: Object.entries(serviceConfig.environment ?? {}).map(([k, v]) => `${k}=${v}`).sort((a, b) => a.localeCompare(b)),
                StopSignal: serviceConfig.stop_signal,
                StopGracePeriod: serviceConfig.stop_grace_period,
                Configs: hashedConfigs.filterByServiceName(serviceName).map(({targetPath, hash}) => {
                    return {
                        File: {Name: targetPath, UID: "0", GID: "0", Mode: 0},
                        ConfigID: current?.configs.find(c => c.Spec?.Name === hash)?.ID,
                        ConfigName: hash,
                    };
                }),
                Isolation: "default",
            },
            Placement: {
                Constraints: serviceConfig.placement?.constraints,
                Preferences: serviceConfig.placement?.preferences?.map(p => {
                    return {Spread: {SpreadDescriptor: p.spread}};
                }),
                MaxReplicas: serviceConfig.placement?.max_replicas_per_node,
            },
            Networks: serviceConfig.networks?.map((networkKey) => {
                assert(config.networks != null, "config.networks cannot be empty here");
                assert(config.networks[networkKey].name != null, `config.networks[${networkKey}].name cannot be empty here`);
                const networkName = config.networks[networkKey].name;
                const foundNetwork = current?.networks.find(n => n.Name === networkName);
                return {Target: foundNetwork?.Id};
            }),
            ForceUpdate: 0,
            Runtime: "container",
        },
        Mode: {Replicated: {Replicas: serviceConfig.replicas}},
        EndpointSpec: {
            Mode: "vip",
            Ports: serviceConfig.endpoint_spec?.ports.map(p => {
                return {Protocol: p.protocol, TargetPort: p.target, PublishedPort: p.published, PublishMode: "ingress"};
            }),
        },
    };
    sortServiceSpec(serviceSpec);
    return serviceSpec;
}
