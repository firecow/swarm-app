import {ArgumentsCamelCase, Argv} from "yargs";
import Docker, {ContainerSpec} from "dockerode";
import assert from "assert";

export const command = "diff <name>";
export const description = "Show differences between cluster and config";

export async function handler (args: ArgumentsCamelCase) {
    //
    // const docker = new Docker();
    //
    // const configs = await docker.listConfigs({filters: {label: [`com.docker.stack.namespace=${args["name"]}`]}});
    // const secrets = await docker.listSecrets({filters: {label: [`com.docker.stack.namespace=${args["name"]}`]}});
    // const volumes = await docker.listVolumes({filters: {label: [`com.docker.stack.namespace=${args["name"]}`]}});
    // const networks = await docker.listNetworks({filters: {label: [`com.docker.stack.namespace=${args["name"]}`]}});
    // const services = await docker.listServices({filters: {label: [`com.docker.stack.namespace=${args["name"]}`]}});
    //
    // const stackData = {
    //     configs: [],
    //     secrets: [],
    //     volumes: [],
    //     networks: [],
    //     services: services.map(s => {
    //         assert(s.Spec?.Labels);
    //         assert(s.Spec?.TaskTemplate?.Runtime === "container");
    //         assert(s.Spec?.TaskTemplate?.ContainerSpec?.Labels);
    //         delete s.Spec?.TaskTemplate?.ContainerSpec?.Labels["com.docker.stack.namespace"];
    //
    //         return {
    //             image: s.Spec.Labels["com.docker.stack.image"],
    //             environment: s.Spec.TaskTemplate?.ContainerSpec?.Env,
    //             labels: s.Spec.TaskTemplate?.ContainerSpec?.Labels,
    //             configs: s.Spec.TaskTemplate?.ContainerSpec?.Configs,
    //             // deploy: {
    //             //     replicas: 2,
    //             //     update_config: {
    //             //         parallelism: 0,
    //             //         order: "start-first"
    //             //     },
    //             // }
    //         }
    //     }),
    // }
    // console.log(stackData);
}

export function builder (yargs: Argv) {
    yargs.positional("name", {
        type: "string",
        description: "Stack name",
    });
    return yargs;
}
