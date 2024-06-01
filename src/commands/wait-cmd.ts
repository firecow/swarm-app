import {ArgumentsCamelCase, Argv} from "yargs";
import {assertNumber, assertString} from "../asserts.js";
import Docker from "dockerode";

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

    let reconciled = false;
    let tasks: {ID: string; ServiceID: string; Slot: number; Status: {State: string; Message: string; Err: string | null}; DesiredState: string}[];
    do {
        tasks = await dockerode.listTasks({filters: {label: [`com.docker.stack.namespace=${appName}`]}});
        tasks = tasks.filter(t => t.DesiredState !== "shutdown");
        reconciled = tasks.every(t => {
            if (t.Status.State === "rejected") return true;
            if (t.Status.State === "complete") return true;
            return t.Status.State === t.DesiredState;
        });
    } while (!reconciled);

    const rejectedTasks = tasks.filter(t => t.Status.State === "rejected");

    if (rejectedTasks.length > 0) {
        for (const t of rejectedTasks) {
            const found = services.find(s => s.ID === t.ServiceID);
            console.error(found?.Spec?.Name, t.Status.Err);
        }
        console.error("Reconciliation failed");
    } else {
        console.log("Reconciliation succeeded");
    }


}

export function builder (yargs: Argv) {
    yargs.positional("app-name", {
        type: "string",
        description: "Application name",
    });
    yargs.option("timeout", {
        type: "number",
        description: "Milliseconds to wait for successful reconciliation",
        demandOption: false,
        default: 90000, // 1m 30s
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
