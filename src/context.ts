import {assertArray, assertString, assertStringOrNull} from "./asserts.js";
import {expandSwarmAppConfig, loadSwarmAppConfig} from "./swarm-app-config.js";
import Dockerode from "dockerode";
import {getCurrent} from "./docker-api.js";
import {initHashedConfigs} from "./hashed-config.js";
import {ArgumentsCamelCase} from "yargs";


export async function initContext (args: ArgumentsCamelCase) {
    const configFiles = args["configFile"];
    assertArray(configFiles, "all configFile must be a string", assertString);
    const appName = args["appName"];
    assertString(appName, "appName must be a string");
    const templatingInputFile = args["templating-input-file"];
    assertStringOrNull(templatingInputFile, "templatingInputFile must be a string or null");

    const config = await loadSwarmAppConfig(configFiles, templatingInputFile);
    await expandSwarmAppConfig(config, appName);

    const dockerode = new Dockerode();
    const current = await getCurrent({dockerode, appName});

    const hashedConfigs = await initHashedConfigs(config);

    return {appName, config, dockerode, current, hashedConfigs};
}
