import {ArgumentsCamelCase, Argv} from "yargs";
import Docker from "dockerode";
import timers from "timers/promises";
import {assertNumber, assertString} from "../asserts.js";
import {yargsAppNameFileOption} from "./deploy-cmd";

interface Task {
    DesiredState: string;
    Status: {
        State: string;
        Err: string;
    };
}

export const command = "wait <app-name>";
export const description = "Wait for deployment to settle";

export async function handler (args: ArgumentsCamelCase) {
    const appName = args["appName"];
    assertString(appName);
    const timeout = args["timeout"];
    assertNumber(timeout);

    const dockerode = new Docker();

    console.log(`Awaiting task reconciliation for a max of ${timeout}ms`);

    let services;
    let timedout = false;
    let reconciled;
    let latestTaskError = "";
    const start = Date.now();
    do {
        latestTaskError = "";
        reconciled = true;
        services = await dockerode.listServices({filters: {label: [`com.docker.stack.namespace=${appName}`]}});

        // Check the tasks for failures.
        for (const s of services) {
            const tasks = await dockerode.listTasks({
                Filter: `service=${s.Spec?.Name}`,
            }) as Task[];
            for (const t of tasks) {
                if (t.DesiredState === "ready" && t.Status.State != "running") {
                    reconciled = false;
                }
                if (t.Status.State === "rejected" && latestTaskError == "") {
                    latestTaskError = t.Status.Err;
                }
            }
        }

        // To prevent high cpu usage
        await timers.setTimeout(5000);
        timedout = Date.now() - timeout > start;
        if (!reconciled && latestTaskError != "") {
            console.error(latestTaskError);
        }
    } while (!timedout && !reconciled);

    if (!reconciled || timedout) {
        if (timedout) {
            console.error("Reconciliation timed out");
        } else {
            console.error("Reconciliation failed");
        }

        process.exit(1);
    }
    console.log("Reconciliation succeeded");
}

export function builder (yargs: Argv) {
    yargsAppNameFileOption(yargs);
    yargs.positional("timeout", {
        type: "number",
        description: "Time is ms to wait for reconciliation",
        default: 120000,
    });
    yargs.hide("help");
    yargs.hide("version");
    return yargs;
}
