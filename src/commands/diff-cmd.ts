import {ArgumentsCamelCase, Argv} from "yargs";
import {expandSwarmAppConfig, loadSwarmAppConfig} from "../swarm-app-config.js";
import {assertArray, assertString} from "../asserts.js";

export const command = "diff <app-name>";
export const description = "Show diff between current and config";

export async function handler (args: ArgumentsCamelCase) {
    const configFiles = args["configFile"];
    assertArray(configFiles, assertString);
    const appName = args["appName"];
    assertString(appName);
    const config = await loadSwarmAppConfig(configFiles);
    await expandSwarmAppConfig(config, appName);
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
    yargs.hide("help");
    yargs.hide("version");
    return yargs;
}
