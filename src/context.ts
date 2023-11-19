import {assertArray, assertString} from "./asserts.js";
import {expandSwarmAppConfig, loadSwarmAppConfig} from "./swarm-app-config.js";
import Dockerode from "dockerode";
import {getCurrent} from "./docker-api.js";
import {initHashedConfigs} from "./hashed-config.js";
import {ArgumentsCamelCase} from "yargs";


export async function initContext (args: ArgumentsCamelCase) {
    const configFiles = args["configFile"];
    assertArray(configFiles, assertString);
    const appName = args["appName"];
    assertString(appName);
    const config = await loadSwarmAppConfig(configFiles);
    await expandSwarmAppConfig(config, appName);

    const dockerode = new Dockerode();
    const current = await getCurrent({dockerode, appName});

    const hashedConfigs = await initHashedConfigs(config);

    return {appName, config, dockerode, current, hashedConfigs};
}