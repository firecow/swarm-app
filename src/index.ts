import "source-map-support/register.js";
import yargs from "yargs";
import assert from "assert";
import * as diffCommand from "./diff-cmd.js";
import * as deployCommand from "./deploy-cmd.js";
import * as validateCommand from "./validate-cmd.js";

process.on("uncaughtException", (err) => {
    if (err instanceof assert.AssertionError) {
        console.error(`\x1b[31m${err.message}\x1b[0m`);
    } else {
        console.error(`\x1b[31m${err.stack?.split("\n").slice(0, 4).join("\n")}\x1b[0m`);
    }
    process.exit(1);
});

const terminalWidth = yargs().terminalWidth();
void yargs(process.argv.slice(2))
    .parserConfiguration({"greedy-arrays": false})
    .usage("Find more information at https://github.com/firecow/cowswarm")
    .env("cowswarm")
    .command(validateCommand)
    .command(diffCommand)
    .command(deployCommand)
    .demandCommand()
    .fail((msg, err) => {
        if (!err) throw new assert.AssertionError({message: msg});
    })
    .wrap(terminalWidth)
    .strict(true)
    .parse();
