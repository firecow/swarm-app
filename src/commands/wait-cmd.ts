import {ArgumentsCamelCase, Argv} from "yargs";
import Docker, {Service} from "dockerode";
import timers from "timers/promises";
import {assertNumber, assertString} from "../asserts.js";
import {yargsAppNameFileOption} from "./deploy-cmd";
import assert from "assert";

interface Task {
    ID: string;
    ServiceID: string;
    Slot: number;
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
    assertString(appName, "appName must be a string");
    const timeout = args["timeout"];
    assertNumber(timeout, "timeout must be a number in ms");

    const dockerode = new Docker();

    console.log(`Awaiting task reconciliation for ${timeout}ms`);

    let services: Service[], tasks: Task[], timedout, bail, serviceStateMap;
    const start = Date.now();
    do {
        // To prevent high cpu usage
        await timers.setTimeout(5000);
        // Calculate timedout
        timedout = Date.now() - timeout > start;

        serviceStateMap = new Map<string, string>();
        services = await dockerode.listServices({filters: {label: [`com.docker.stack.namespace=${appName}`]}});
        tasks = await dockerode.listTasks({filters: {"label": [`com.docker.stack.namespace=${appName}`], "desired-state": ["running"]}}) as Task[];

        for (const s of services) {
            if (s.UpdateStatus?.State) {
                serviceStateMap.set(s.ID, s.UpdateStatus.State);
            } else {
                const runningTasks = tasks.filter(t => t.Status.State === "running" && t.ServiceID === s.ID);
                const totalTasks = tasks.filter(t => t.ServiceID === s.ID);
                if (totalTasks.length > runningTasks.length) {
                    serviceStateMap.set(s.ID ?? "unspecified", "replicating");
                }
            }
        }

        const servicesUpdating = [];
        for (const [id, state] of serviceStateMap) {
            if (!["completed", "rollback_completed"].includes(state)) servicesUpdating.push([id, state]);
        }

        bail = servicesUpdating.length === 0;
        if (!bail) {
            for (const [serviceId, state] of servicesUpdating) {
                const serviceName = services.find(s => s.ID === serviceId)?.Spec?.Name;
                assert(serviceName != null, "serviceName must be a string");
                const errMsg = tasks.find(t => t.ServiceID === serviceId && t.Status.Err)?.Status.Err;
                console.log(`${serviceName} is in ${state}${errMsg ? ", error: '" + errMsg + "'" : ""}`);
            }
        }
        console.log(servicesUpdating);
    } while (!timedout && !bail);

    if (timedout) {
        console.error("Reconciliation timed out");
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
