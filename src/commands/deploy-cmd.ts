import {ArgumentsCamelCase, Argv} from "yargs";
import {createMissingConfigs, createMissingNetworks, removeUnusedConfigs, removeUnusedServices, upsertServices} from "../docker-api.js";
import {initContext} from "../context.js";

export const command = "deploy <app-name>";
export const description = "Deploys swarm app";

export async function handler (args: ArgumentsCamelCase) {
    const ctx = await initContext(args);

    const addedNetworks = await createMissingNetworks(ctx);
    for (const n of addedNetworks) {
        ctx.current.networks.push(n);
    }
    const addedConfigs = await createMissingConfigs(ctx);
    for (const c of addedConfigs) {
        ctx.current.configs.push(c);
    }
    await upsertServices(ctx);

    await removeUnusedServices(ctx);
    await removeUnusedConfigs(ctx);
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
