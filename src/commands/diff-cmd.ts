import {ArgumentsCamelCase, Argv} from "yargs";
import {SwarmAppConfig} from "../swarm-app-config.js";
import {DockerResources} from "../docker-api.js";
import {ServiceSpec} from "dockerode";
import {diffStringsUnified} from "jest-diff";
import fs from "fs";
import yaml from "js-yaml";
import {initServiceSpec} from "../service-spec.js";
import {HashedConfigs} from "../hashed-config.js";
import {initContext} from "../context.js";

export const command = "diff <app-name>";
export const description = "Show diff between current and config";

function serviceNameCompare (a: {Name?: string} | undefined, b: {Name?: string} | undefined) {
    if (!a?.Name) return 0;
    if (!b?.Name) return 0;
    return a.Name.localeCompare(b.Name);
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
    return serviceSpecs.sort(serviceNameCompare);
}

export async function handler (args: ArgumentsCamelCase) {
    const ctx = await initContext(args);

    const lhs: {services: (ServiceSpec | undefined)[]} = {
        services: ctx.current.services.map(s => s.Spec).sort(serviceNameCompare),
    };
    const rhs: {services: ServiceSpec[]} = {
        services: initServiceResources(ctx),
    };

    const lhsTxt = yaml.dump(lhs);
    const rhsTxt = yaml.dump(rhs);
    const red = (str: string) => `\x1b[31m${str}\x1b[0m`;
    const green = (str: string) => `\x1b[32m${str}\x1b[0m`;
    const comparison = diffStringsUnified(lhsTxt, rhsTxt, {
        omitAnnotationLines: true,
        expand: true,
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
    yargs.hide("help");
    yargs.hide("version");
    return yargs;
}
