import {ArgumentsCamelCase, Argv} from "yargs";
import Docker from "dockerode";
import timers from "timers/promises";
import {assertString} from "../asserts.js";

export const command = "wait <app-name>";
export const description = "Wait for deployment to settle";

export async function handler (args: ArgumentsCamelCase) {
    const appName = args["appName"];
    assertString(appName);

    const dockerode = new Docker();

    console.log("Waiting for deployment reconciliation");

    let services;
    let reconciled = false;
    do {
        services = await dockerode.listServices({filters: {label: [`com.docker.stack.namespace=${appName}`]}});
        reconciled = services.every(s => {
            if (!s.UpdateStatus?.State) return true;
            return ["completed", "rollback_completed", "paused", "rollback_paused"].includes(s.UpdateStatus?.State ?? "");
        });
        await timers.setTimeout(1000);
    } while (!reconciled);

    const paused = services.filter(s => {
        return ["paused", "rollback_paused"].includes(s.UpdateStatus?.State ?? "");
    });
    if (paused.length > 0) {
        for (const s of paused) {
            console.error(`${s.Spec?.Name} ${s.UpdateStatus?.Message}`);
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
    yargs.hide("help");
    yargs.hide("version");
    return yargs;
}
