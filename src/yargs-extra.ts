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
            type: "string",
            description: "Config file",
            demandOption: false,
            default: "swarm-app.yml",
            alias: "f",
        });
    },
    injectHostEnvOption (yargs: Argv) {
        yargs.option("inject-host-env", {
            type: "boolean",
            description: "Allow host env to be injected",
            demandOption: false,
            default: true,
        });
    },
};

export default yargsExtra;
