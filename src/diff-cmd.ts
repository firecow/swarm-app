import {Argv} from "yargs";
import timers from "timers/promises";

export const command = "diff <name>";
export const description = "Show differences between cluster and config";

export async function handler () {
    // TODO: Add diff functionality
    await timers.setTimeout(0);
    console.log("I'm not implemented yet.");
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
