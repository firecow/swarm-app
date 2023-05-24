import "source-map-support/register.js";
import yargs from "yargs";
import chalk from "chalk-template";
import assert from "assert";

process.on("uncaughtException", (err) => {
    if (err instanceof assert.AssertionError) {
        console.error(chalk`{red ${err.message}}`);
    } else {
        console.error(err.message, err.stack?.split("\n").slice(0, 4).join("\n"));
    }
    process.exit(1);
});

const terminalWidth = yargs().terminalWidth();
void yargs(process.argv.slice(2))
    .parserConfiguration({"greedy-arrays": false})
    .usage("Find more information at https://github.com/firecow/cow_swarm")
    .env("COW_SWARM")
    .demandCommand()
    .fail((msg, err) => {
        if (!err) throw new assert.AssertionError({message: msg});
    })
    .wrap(terminalWidth)
    .strict(true)
    .parse();
