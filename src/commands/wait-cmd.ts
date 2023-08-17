import {ArgumentsCamelCase, Argv} from "yargs";
import {assertNumber, assertString} from "../asserts.js";
import Docker from "dockerode";
import timers from "timers/promises";
import {clearTimeout} from "timers";

export const command = "wait <app-name>";
export const description = "Wait for deployment to settle";

export async function handler (args: ArgumentsCamelCase) {
    const appName = args["appName"];
    assertString(appName);
    const timeoutInMs = args["timeout"];
    assertNumber(timeoutInMs);
    const intervalInMs = args["interval"];
    assertNumber(intervalInMs);

    const dockerode = new Docker();

    console.log("Waiting for deployment reconciliation");
    const services = await dockerode.listServices({filters: {label: [`com.docker.stack.namespace=${appName}`]}});

    const timeoutKey = setTimeout(() => {
        console.warn("Reconciliation timed out");
        for (const t of tasks) {
            if (t.DesiredState !== "running") continue;
            if (t.Status.State === t.DesiredState) continue;
            const service = services.find(s => t.ServiceID === s.ID);
            console.warn(`Task ${t.Slot} for ${service?.Spec?.Name} is in invalid state '${t.Status.Message}'`);
        }
        process.exit(1);
    }, timeoutInMs);

    let reconciled = false;
    let tasks: {ServiceID: string; Slot: number; Status: {State: string; Message: string}; DesiredState: string}[];
    do {
        tasks = await dockerode.listTasks({filters: {label: [`com.docker.stack.namespace=${appName}`]}});
        reconciled = tasks.every(t => t.Status.State === t.DesiredState);
        if (!reconciled) {
            await timers.setTimeout(intervalInMs);
        }
    } while (!reconciled);

    clearTimeout(timeoutKey);

    console.log("Reconciliation succeeded");
}

export function builder (yargs: Argv) {
    yargs.positional("app-name", {
        type: "string",
        description: "Application name",
    });
    yargs.option("timeout", {
        type: "number",
        description: "Milliseconds to wait for successful tasks reconciliation",
        demandOption: false,
        default: 30000,
        alias: "t",
    });
    yargs.option("interval", {
        type: "number",
        description: "Milliseconds to wait between tasks status checking",
        demandOption: false,
        default: 500,
        alias: "i",
    });
    yargs.hide("help");
    yargs.hide("version");
    return yargs;
}
