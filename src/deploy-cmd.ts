import {ArgumentsCamelCase, Argv} from "yargs";
import assert from "assert";
import {loadCowSwarmConfig} from "./cow-swarm-config.js";

export const command = "deploy <name>";
export const description = "Deploys config to swarm cluster";

export async function handler (args: ArgumentsCamelCase) {
    const configFile = args["configFile"];
    assert(Array.isArray(configFile));
    await loadCowSwarmConfig(configFile[0]); // TODO: Add config deep merge functionality
    console.log("I still need some work");
}

export function builder (yargs: Argv) {
    yargs.positional("name", {
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
