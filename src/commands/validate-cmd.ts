import {ArgumentsCamelCase, Argv} from "yargs";
import {loadSwarmAppConfig} from "../swarm-app-config.js";
import {assertArray, assertString, assertStringOrNull} from "../asserts.js";
import yargsExtra from "../yargs-extra.js";

export const command = "validate";
export const description = "Validates config file by json schema";

export async function handler (args: ArgumentsCamelCase) {
    const configFiles = args.configFile;
    assertArray(configFiles, "configFile must be a string", assertString);
    const templatingInputFile = args["templating-input-file"];
    assertStringOrNull(templatingInputFile, "templatingInputFile must be a string or null");
    await loadSwarmAppConfig(configFiles, templatingInputFile);
    console.log("Configuration file is valid");
}

export function builder (yargs: Argv) {
    yargsExtra.configFileOption(yargs);
    yargsExtra.templateInputOption(yargs);
    yargs.hide("help");
    yargs.hide("version");
    return yargs;
}
