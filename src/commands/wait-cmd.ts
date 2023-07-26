import {ArgumentsCamelCase, Argv} from "yargs";
import assert from "assert";
import {loadSwarmAppConfig} from "../swarm-app-config.js";

export const command = "wait <app-name>";
export const description = "Wait for deployment to settle";

export async function handler (args: ArgumentsCamelCase) {
    const configFiles = args["appName"];
    assert(Array.isArray(configFiles));
    await loadSwarmAppConfig(configFiles);
    // TODO: Implement
    console.log("swarm-app wait not implemented yet");
}

export function builder (yargs: Argv) {
    yargs.positional("app-name", {
        type: "string",
        description: "Application name",
    });
    return yargs;
}
