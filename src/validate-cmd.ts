import {ArgumentsCamelCase, Argv} from "yargs";
import assert from "assert";
import {loadCowSwarmConfig} from "./cow-swarm-config.js";

export const command = "validate";
export const description = "Validates config fileby json schema";

export async function handler (args: ArgumentsCamelCase) {
    const configFile = args["configFile"];
    assert(Array.isArray(configFile));
    await loadCowSwarmConfig(configFile[0]); // TODO: Add config deep merge functionality
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
