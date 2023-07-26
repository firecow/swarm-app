import {ArgumentsCamelCase, Argv} from "yargs";
import assert from "assert";
import {initDefaultNetwork, loadSwarmAppConfig} from "../swarm-app-config.js";

export const command = "diff <app-name>";
export const description = "Show diff between current and config";

export async function handler (args: ArgumentsCamelCase) {
    const configFiles = args["configFile"];
    const appName = args["appName"];
    assert(typeof appName === "string");
    assert(Array.isArray(configFiles));
    const config = await loadSwarmAppConfig(configFiles);
    initDefaultNetwork(config, appName);

    // TODO: Implement
    console.log("swarm-app diff not implemented yet");
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
