import {ArgumentsCamelCase, Argv} from "yargs";
import {loadSwarmAppConfig} from "../swarm-app-config.js";
import {assertArray, assertString} from "../asserts.js";

export const command = "validate";
export const description = "Validates config file by json schema";

export async function handler (args: ArgumentsCamelCase) {
    const configFiles = args["configFile"];
    assertArray(configFiles, assertString);
    await loadSwarmAppConfig(configFiles);
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
    yargs.hide("help");
    yargs.hide("version");
    return yargs;
}
