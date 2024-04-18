import {ArgumentsCamelCase, Argv} from "yargs";
import {SwarmAppConfig} from "../swarm-app-config.js";
import {DockerResources} from "../docker-api.js";
import {NetworkInspectInfo, ServiceSpec} from "dockerode";
import {diffStringsRaw, diffStringsUnified} from "jest-diff";
import yaml from "js-yaml";
import {initServiceSpec} from "../service-spec.js";
import {HashedConfigs} from "../hashed-config.js";
import {initContext} from "../context.js";
import fs from "fs/promises";
import {nameCompare} from "../array.js";

export const command = "diff <app-name>";
export const description = "Show diff between current and config";

interface InitNetworkResourcesOpt {
    appName: string;
    config: SwarmAppConfig;
}
function initNetworkResources ({config, appName}: InitNetworkResourcesOpt): NetworkInspectInfo[] {
    const networkInfos: NetworkInspectInfo[] = [];
    for (const n of Object.values(config.networks ?? {}).filter(e => !e.external)) {
        networkInfos.push({
            Name: n.name,
            Id: "",
            Created: "1970-01-01T06:00:00.00000000",
            Scope: "swarm",
            Driver: "overlay",
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
    for (const serviceName of Object.keys(config.services)) {
        const serviceSpec = initServiceSpec({appName, serviceName, config, hashedConfigs, current});
        delete serviceSpec.version;
        serviceSpecs.push(serviceSpec);
    }
    return serviceSpecs.sort(nameCompare);
}

interface Lhs {
    services: (ServiceSpec | undefined)[];
    networks: (NetworkInspectInfo | undefined)[];
}
function stripIrrelevantFromLhs (lhs: Lhs) {
    for (const n of lhs.networks) {
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

interface Rhs {
    services: ServiceSpec[];
    networks: (NetworkInspectInfo | undefined)[];
}
function stripIrrelevantFromRhs (rhs: Rhs) {
    for (const n of rhs.networks) {
        if (n) {
            n.Id = "<masked>";
            n.Created = "<masked>";
        }
    }
}

function filterAppNetworks (network: NetworkInspectInfo, appName: string) {
    if (!network?.Labels) return false;
    return network.Labels["com.docker.stack.namespace"] === appName;
}

export async function handler (args: ArgumentsCamelCase) {
    const ctx = await initContext(args);

    const lhs: Lhs = {
        networks: ctx.current.networks.filter((n) => filterAppNetworks(n, ctx.appName)).sort(nameCompare),
        services: ctx.current.services.map(s => s.Spec).sort(nameCompare),
    };
    const rhs: Rhs = {
        networks: initNetworkResources(ctx),
        services: initServiceResources(ctx),
    };

    // Strip irrelevant info from lhs and rhs
    stripIrrelevantFromLhs(lhs);
    stripIrrelevantFromRhs(rhs);

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
