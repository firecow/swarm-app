import {ArgumentsCamelCase, Argv} from "yargs";
import assert from "assert";
import {loadCowSwarmConfig} from "./cow-swarm-config.js";

export const command = "deploy <name>";
export const description = "Deploys config to swarm cluster";

export async function handler (args: ArgumentsCamelCase) {
    const configFile = args["configFile"];
    assert(typeof configFile === "string");
    await loadCowSwarmConfig(configFile);
    console.log("I still need some work");
}

export function builder (yargs: Argv) {
    yargs.positional("name", {
        type: "string",
        description: "Stack name",
    });
    yargs.option("config-file", {
        type: "string",
        description: "Config file",
        demandOption: false,
        alias: "-f",
    });
    return yargs;
}
