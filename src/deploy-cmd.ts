import {ArgumentsCamelCase, Argv} from "yargs";
import yaml from "js-yaml";
import fs from "fs";
import assert, {AssertionError} from "assert";
import Ajv from "ajv/dist/jtd.js";
import {cowSwarmConfigSchema} from "./cow-swarm-config.js";

export const command = "deploy <name> <config-file>";
export const description = "Show differences between cluster and config";

export async function handler (args: ArgumentsCamelCase) {
    const configFile = args["configFile"];
    assert(typeof configFile === "string");
    const cowSwarmConfig = yaml.load(await fs.promises.readFile(configFile, "utf8"));
    const validate = new Ajv().compile(cowSwarmConfigSchema);
    if (!validate(cowSwarmConfig)) {
        throw new AssertionError({message: `${JSON.stringify(validate.errors)}`});
    }

    console.log(cowSwarmConfig.networks);
    console.log();
    console.log(cowSwarmConfig.services);
}

export function builder (yargs: Argv) {
    yargs.positional("name", {
        type: "string",
        description: "Stack name",
    });
    yargs.positional("config-file", {
        type: "string",
        description: "Config file",
    });
    return yargs;
}
