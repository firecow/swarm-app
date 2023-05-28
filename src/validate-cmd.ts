import {ArgumentsCamelCase, Argv} from "yargs";
import assert from "assert";
import {loadCowSwarmConfig} from "./cow-swarm-config.js";

export const command = "validate";
export const description = "Validates config fileby json schema";

export async function handler (args: ArgumentsCamelCase) {
    const configFiles = args["configFile"];
    assert(Array.isArray(configFiles));
    await loadCowSwarmConfig(configFiles)
    console.log("Configuration file is valid");
}

export function builder (yargs: Argv) {
    yargs.option("config-file", {
        type: "array",
        description: "Config file(s)",
        demandOption: false,
        default: ["cowswarm.yml"],
        alias: "-f",
    });
    return yargs;
}
