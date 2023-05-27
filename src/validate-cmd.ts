import {ArgumentsCamelCase, Argv} from "yargs";
import assert from "assert";
import {loadCowSwarmConfig} from "./cow-swarm-config.js";

export const command = "validate";
export const description = "Validates config fileby json schema";

export async function handler (args: ArgumentsCamelCase) {
    const configFile = args["configFile"];
    assert(typeof configFile === "string");
    await loadCowSwarmConfig(configFile);
    console.log("Configuration file is valid");
}

export function builder (yargs: Argv) {
    yargs.option("config-file", {
        type: "string",
        description: "Config file",
        demandOption: false,
        alias: "-f",
    });
    return yargs;
}
