import {ArgumentsCamelCase, Argv} from "yargs";
import assert from "assert";
import {loadCowSwarmConfig} from "./cow-swarm-config.js";

export const command = "deploy <name>";
export const description = "Deploys config to swarm cluster";

export async function handler (args: ArgumentsCamelCase) {
    const configFiles = args["configFile"];
    assert(Array.isArray(configFiles));
    await loadCowSwarmConfig(configFiles);
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
