import {ArgumentsCamelCase, Argv} from "yargs";
import {SwarmAppConfig} from "../swarm-app-config.js";
import {DockerResources, NetworkInspectInfoPlus} from "../docker-api.js";
import {NetworkInspectInfo, ServiceSpec} from "dockerode";
import {diffStringsRaw, diffStringsUnified} from "jest-diff";
import yaml from "js-yaml";
import {initServiceSpec, isContainerTaskSpec} from "../service-spec.js";
import {HashedConfigs} from "../hashed-config.js";
import {initContext} from "../context.js";
import fs from "fs/promises";
import {nameCompare} from "../array.js";
import {yargsAppNameFileOption, yargsConfigFileOption, yargsTemplateInputOption} from "./deploy-cmd";

export const command = "diff <app-name>";
export const description = "Show diff between current and config";

interface InitNetworkResourcesOpt {
    appName: string;
    config: SwarmAppConfig;
}
function initNetworkResources ({config, appName}: InitNetworkResourcesOpt): NetworkInspectInfoPlus[] {
    const networkInfos: NetworkInspectInfoPlus[] = [];
    for (const n of Object.values(config.networks ?? {}).filter(e => !e.external)) {
        networkInfos.push({
            Name: n.name,
            Id: "",
            Created: "1970-01-01T06:00:00.00000000",
            Scope: "swarm",
            Driver: "overlay",
            EnableIPv4: false,
            EnableIPv6: false,
            IPAM: {Driver: "default"},
            Internal: false,
            Attachable: n.attachable ?? true,
            Ingress: false,
            ConfigOnly: false,
            Labels: {
                "com.docker.stack.namespace": appName,
            },
        });
    }
    return networkInfos.sort(nameCompare);
}

interface InitServiceResourcesOpt {
    appName: string;
    config: SwarmAppConfig;
    hashedConfigs: HashedConfigs;
    current: DockerResources;
}
function initServiceResources ({appName, config, hashedConfigs, current}: InitServiceResourcesOpt): ServiceSpec[] {
    const serviceSpecs: ServiceSpec[] = [];
    for (const serviceName of Object.keys(config.service_specs)) {
        const serviceSpec = initServiceSpec({appName, serviceName, config, hashedConfigs, current});
        delete serviceSpec.version;
        serviceSpecs.push(serviceSpec);
    }
    return serviceSpecs.sort(nameCompare);
}

interface DiffEntry {
    services: (ServiceSpec | undefined)[];
    networks: ((NetworkInspectInfo & {EnableIPv4: boolean}) | undefined)[];
}
function deleteIrrelevantNetworkFields (entry: DiffEntry) {
    for (const n of entry.networks) {
        delete n?.IPAM?.Options;
        delete n?.IPAM?.Config;
        delete n?.ConfigFrom;
        delete n?.Containers;
        delete n?.Options;
        if (n) {
            n.Id = "<masked>";
            n.Created = "<masked>";
        }
    }
}
function fixLhsInconsistencies (entry: DiffEntry) {
    // For some reason Healthcheck comes out of dockerode, but HealthCheck is used as service spec.
    for (const s of entry.services) {
        if (!isContainerTaskSpec(s?.TaskTemplate)) continue;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        s.TaskTemplate.ContainerSpec.HealthCheck = s.TaskTemplate.ContainerSpec.Healthcheck;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        delete s.TaskTemplate.ContainerSpec.Healthcheck;
    }
}

function filterAppNetworks (network: NetworkInspectInfo, appName: string) {
    if (!network?.Labels) return false;
    return network.Labels["com.docker.stack.namespace"] === appName;
}

export async function handler (args: ArgumentsCamelCase) {
    const ctx = await initContext(args);

    const lhs: DiffEntry = {
        networks: ctx.current.networks.filter((n) => filterAppNetworks(n, ctx.appName)).sort(nameCompare),
        services: ctx.current.services.map(s => s.Spec).sort(nameCompare),
    };
    const rhs: DiffEntry = {
        networks: initNetworkResources(ctx),
        services: initServiceResources(ctx),
    };

    deleteIrrelevantNetworkFields(lhs);
    deleteIrrelevantNetworkFields(rhs);

    fixLhsInconsistencies(lhs);

    const lhsTxt = yaml.dump(lhs);
    const rhsTxt = yaml.dump(rhs);
    if (args["write-lhs-rhs"]) {
        await fs.writeFile("lhs.yml", lhsTxt);
        await fs.writeFile("rhs.yml", rhsTxt);
    }
    const diffs = diffStringsRaw(lhsTxt, rhsTxt, true);
    if (diffs.length === 1 && diffs[0]["0"] === 0) {
        console.log("No changes detected");
        return;
    }

    const red = (str: string) => `\x1b[31m${str}\x1b[0m`;
    const green = (str: string) => `\x1b[32m${str}\x1b[0m`;
    const comparison = diffStringsUnified(lhsTxt, rhsTxt, {
        omitAnnotationLines: true,
        expand: false,
        aColor: red,
        bColor: green,
    });
    console.log(comparison);
}

export function builder (yargs: Argv) {
    yargsAppNameFileOption(yargs);
    yargsConfigFileOption(yargs);
    yargsTemplateInputOption(yargs);
    yargs.option("write-lhs-rhs", {
        type: "boolean",
        description: "Write lhs and rhs files",
        demandOption: false,
        default: false,
        alias: "w",
    });
    yargs.hide("help");
    yargs.hide("version");
    return yargs;
}
