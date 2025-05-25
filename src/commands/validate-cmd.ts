import {ArgumentsCamelCase, Argv} from "yargs";
import {loadSwarmAppConfig} from "../swarm-app-config.js";
import {assertArray, assertString, assertStringOrNull} from "../asserts.js";
import {yargsConfigFileOption, yargsTemplateInputOption} from "./deploy-cmd";

export const command = "validate";
export const description = "Validates config file by json schema";

export async function handler (args: ArgumentsCamelCase) {
    const configFiles = args["configFile"];
    assertArray(configFiles, assertString);
    const templatingInputFile = args["templating-input-file"];
    assertStringOrNull(templatingInputFile);
    await loadSwarmAppConfig(configFiles, templatingInputFile);
    console.log("Configuration file is valid");
}

export function builder (yargs: Argv) {
    yargsConfigFileOption(yargs);
    yargsTemplateInputOption(yargs);
    yargs.hide("help");
    yargs.hide("version");
    return yargs;
}
