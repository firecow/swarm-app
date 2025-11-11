import {Argv} from "yargs";

const yargsExtra = {
    templateInputOption (yargs: Argv) {
        yargs.option("templating-input-file", {
            type: "string",
            description: "Templating input file",
            demandOption: false,
            default: null,
            alias: "i",
        });
    },
    appNameFileOption (yargs: Argv) {
        yargs.positional("app-name", {
            type: "string",
            description: "Application name",
        });
    },
    configFileOption (yargs: Argv) {
        yargs.option("config-file", {
            type: "array",
            description: "Config file(s)",
            demandOption: false,
            default: ["swarm-app.yml"],
            alias: "f",
        });
    },
};

export default yargsExtra;
