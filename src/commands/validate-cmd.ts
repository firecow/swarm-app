import {ArgumentsCamelCase, Argv} from "yargs";
import {loadSwarmAppConfig} from "../swarm-app-config.js";
import {assertBooleanOrNull, assertString, assertStringOrNull} from "../asserts.js";
import yargsExtra from "../yargs-extra.js";

export const command = "validate";
export const description = "Validates config file by json schema";

export async function handler (args: ArgumentsCamelCase) {
    const configFile = args.configFile;
    assertString(configFile, "configFile must be a string");
    const injectHostEnv = args.injectHostEnv;
    assertBooleanOrNull(injectHostEnv, "injectHostEnv must be boolean or null");
    const templatingInputFile = args["templating-input-file"];
    assertStringOrNull(templatingInputFile, "templatingInputFile must be a string or null");
    await loadSwarmAppConfig(configFile, false, injectHostEnv, templatingInputFile);
    console.log("Configuration file is valid");
}

export function builder (yargs: Argv) {
    yargsExtra.configFileOption(yargs);
    yargsExtra.templateInputOption(yargs);
    yargsExtra.injectHostEnvOption(yargs);
    yargs.hide("help");
    yargs.hide("version");
    return yargs;
}
