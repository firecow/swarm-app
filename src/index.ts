import "source-map-support/register.js";
import yargs from "yargs";
import assert from "assert";
import * as validateCommand from "./commands/validate-cmd.js";
import * as diffCommand from "./commands/diff-cmd.js";
import * as deployCommand from "./commands/deploy-cmd.js";
import * as waitCommand from "./commands/wait-cmd.js";
import * as generateSchemaCommand from "./commands/generate-schema.js";

process.on("uncaughtException", (err) => {
    if (err instanceof assert.AssertionError) {
        console.error(`\x1b[31m${err.stack?.split("\n").slice(0, 6).join("\n")}\x1b[0m`);
    } else {
        console.error(`\x1b[31m${err.stack?.split("\n").slice(0, 4).join("\n")}\x1b[0m`);
    }
    process.exit(1);
});

const terminalWidth = yargs().terminalWidth();
void yargs(process.argv.slice(2))
    .parserConfiguration({"greedy-arrays": false})
    .usage("Find more information at https://github.com/firecow/swarm-app")
    .env("SWARMAPP")
    .command(validateCommand)
    .command(diffCommand)
    .command(deployCommand)
    .command(waitCommand)
    .command(generateSchemaCommand)
    .demandCommand()
    .fail((msg, err) => {
        if (!err) throw new assert.AssertionError({message: msg});
    })
    .wrap(terminalWidth)
    .strict(true)
    .parse();
