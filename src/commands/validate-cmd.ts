import {ArgumentsCamelCase, Argv} from "yargs";
import assert from "assert";
import {loadSwarmAppConfig} from "../swarm-app-config.js";

export const command = "validate";
export const description = "Validates config fileby json schema";

export async function handler (args: ArgumentsCamelCase) {
    const configFiles = args["configFile"];
    const stackName = args["stackName"];
    assert(typeof stackName === "string");
    assert(Array.isArray(configFiles));
    await loadSwarmAppConfig(configFiles, stackName);
    console.log("Configuration file is valid");
}

export function builder (yargs: Argv) {
    yargs.option("config-file", {
        type: "array",
        description: "Config file(s)",
        demandOption: false,
        default: ["swarm-app.yml"],
        alias: "f",
    });
    return yargs;
}