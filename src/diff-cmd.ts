import {ArgumentsCamelCase, Argv} from "yargs";
import timers from "timers/promises";
import assert from "assert";
import {loadCowSwarmConfig} from "./cow-swarm-config.js";

export const command = "diff <stack-name>";
export const description = "Show differences between cluster and config";

export async function handler (args: ArgumentsCamelCase) {
    const configFiles = args["configFile"];
    assert(Array.isArray(configFiles));
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const config = await loadCowSwarmConfig(configFiles);

    const stackName = args["stackName"];
    assert(typeof stackName === "string");

    // TODO: Add diff functionality
    await timers.setTimeout(0);
    console.log("I'm not implemented yet.");
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
