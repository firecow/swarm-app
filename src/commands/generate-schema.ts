import {Argv} from "yargs";
import {swarmAppConfigSchema} from "../swarm-app-config";

export const command = "generate-schema";
export const description = "Generates v7 json schema for swarm-app config files";

export function handler () {
    const config = {
        $schema: "http://json-schema.org/draft-07/schema#",
        title: "Generated schema for swarm-app",
        ...swarmAppConfigSchema,
    };

    console.log(JSON.stringify(config, null, 2));
}

export function builder (yargs: Argv) {
    return yargs;
}
