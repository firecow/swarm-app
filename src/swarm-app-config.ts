import yaml from "js-yaml";
import fs from "fs";
import {AssertionError} from "assert";
import justExtend from "just-extend";
import nunjucks from "nunjucks";
import traverse from "traverse";
import {JTDSchemaType} from "ajv/dist/types/jtd-schema.js";
import Ajv from "ajv/dist/jtd.js";
import {envsubst, parseEnvFile} from "./envsubst.js";
import {assertObjectOrNull} from "./asserts.js";

export interface SwarmAppNetworkConfig {
    attachable?: boolean;
    external: boolean;
    name: string;
}

export interface SwarmAppEndpointSpecPort {
    protocol?: "tcp" | "udp" | "sctp";
    published: number;
    target: number;
}

export interface SwarmAppServiceConfig {
    extends?: {file: string; name: string}[];
    image?: string;
    service_labels?: Record<string, string>;
    command?: string[];
    entrypoint?: string[];
    container_labels?: Record<string, string>;
    configs?: Record<string, {
        sourceFile?: string;
        content?: string;
    }>;
    environment?: Record<string, string>;
    env_file?: string;
    networks?: string[];
    replicas?: number;
    stop_signal?: "SIGTERM" | "SIGQUIT";
    stop_grace_period?: number;
    placement?: {
        max_replicas_per_node?: number;
        constraints?: string[];
        preferences?: {spread: string}[];
    };
    endpoint_spec?: {
        ports: SwarmAppEndpointSpecPort[];
    };
    health_check?: {
        test?: string[];
        interval?: number;
        timeout?: number;
        retries?: number;
        start_period?: number;
        start_interval?: number;
    };
    mounts?: Record<string, {
        source: string;
        type: "bind" | "volume";
        readonly: boolean;
    }>;
    update_config?: {
        parallelism: number;
        order: "stop-first" | "start-first";
    };
}

export interface SwarmAppConfig {
    networks?: Record<string, SwarmAppNetworkConfig>;
    services: Record<string, SwarmAppServiceConfig>;
}


export const swarmAppConfigSchema: JTDSchemaType<SwarmAppConfig> = {
    properties: {
        services: {
            values: {
                optionalProperties: {
                    extends: {
                        elements: {
                            properties: {
                                file: {type: "string"},
                                name: {type: "string"},
                            },
                        },
                    },
                    image: {type: "string"},
                    service_labels: {values: {type: "string"}},
                    command: {elements: {type: "string"}},
                    entrypoint: {elements: {type: "string"}},
                    container_labels: {values: {type: "string"}},
                    configs: {
                        values: {
                            optionalProperties: {
                                sourceFile: {type: "string"},
                                content: {type: "string"},
                            },
                        },
                    },
                    environment: {values: {type: "string"}},
                    env_file: {type: "string"},
                    networks: {
                        elements: {type: "string"},
                    },
                    replicas: {type: "int32"},
                    stop_signal: {enum: ["SIGTERM", "SIGQUIT"]},
                    stop_grace_period: {type: "int32"},
                    placement: {
                        optionalProperties: {
                            max_replicas_per_node: {type: "int32"},
                            constraints: {elements: {type: "string"}},
                            preferences: {
                                elements: {
                                    properties: {
                                        spread: {type: "string"},
                                    },
                                },
                            },
                        },
                    },
                    endpoint_spec: {
                        properties: {
                            ports: {
                                elements: {
                                    properties: {
                                        published: {type: "int16"},
                                        target: {type: "int16"},
                                    },
                                    optionalProperties: {
                                        protocol: {enum: ["tcp", "udp", "sctp"]},
                                    },
                                },
                            },
                        },
                    },
                    health_check: {
                        optionalProperties: {
                            test: {elements: {type: "string"}},
                            interval: {type: "int32"},
                            timeout: {type: "int32"},
                            retries: {type: "int32"},
                            start_period: {type: "int32"},
                            start_interval: {type: "int32"},
                        },
                    },
                    mounts: {
                        values: {
                            properties: {
                                source: {type: "string"},
                                type: {enum: ["volume", "bind"]},
                                readonly: {type: "boolean"},
                            },
                        },
                    },
                    update_config: {
                        properties: {
                            parallelism: {type: "int32"},
                            order: {enum: ["stop-first", "start-first"]},
                        },
                    },
                },
            },
        },
    },
    optionalProperties: {
        networks: {
            values: {
                properties: {
                    name: {type: "string"},
                    external: {type: "boolean"},
                },
                optionalProperties: {
                    attachable: {type: "boolean"},
                },
            },
        },
    },
};

export async function loadSwarmAppConfig (configFilenames: string[], templatingInputFile: string | null) {
    let extendedSwarmAppConfig = {};
    for (const configFilename of configFilenames) {
        const templatingInput = yaml.load(templatingInputFile ? await fs.promises.readFile(templatingInputFile, "utf8") : "---");
        assertObjectOrNull(templatingInput, "templatingInput is not an object or null");
        let configFileContent = await fs.promises.readFile(configFilename, "utf8");
        configFileContent = nunjucks.renderString(configFileContent, templatingInput ?? {});
        const swarmAppConfig = yaml.load(configFileContent);
        extendedSwarmAppConfig = justExtend(true, extendedSwarmAppConfig, swarmAppConfig);
    }

    // Validate json schema
    const validate = new Ajv().compile(swarmAppConfigSchema);
    if (!validate(extendedSwarmAppConfig)) {
        throw new AssertionError({message: `${JSON.stringify(validate.errors)}`});
    }

    return extendedSwarmAppConfig;
}

export async function expandSwarmAppConfig (swarmAppConfig: SwarmAppConfig, appName: string) {
    // Create default network block if it's missing.
    if (swarmAppConfig.networks?.default == null) {
        swarmAppConfig.networks = swarmAppConfig.networks ?? {};
        swarmAppConfig.networks.default = {
            name: `${appName}_default`,
            attachable: false,
            external: false,
        };
    }

    // Expand envFile to environment
    for (const s of Object.values(swarmAppConfig.services)) {
        if (!s.env_file) continue;
        const envFileCnt = await fs.promises.readFile(s.env_file, "utf8");
        s.environment = {...s.environment, ...parseEnvFile(envFileCnt)};
        delete s.env_file;
    }

    // Envsubst all string values
    const services = swarmAppConfig.services;
    traverse(swarmAppConfig).forEach(function (v) {
        if (typeof v !== "string") return;

        const service = services[this.path[1]];
        let serviceEnvironment = {};
        if (this.path[0] === "services" && service.environment) {
            serviceEnvironment = service.environment;
        }
        this.update(envsubst(v, {...process.env, ...serviceEnvironment}));
    });

    // Ensure com.docker.stack.namespace labels
    for (const service of Object.values(swarmAppConfig.services)) {
        service.service_labels = service.service_labels ?? {};
        service.service_labels["com.docker.stack.namespace"] = appName;
        service.container_labels = service.container_labels ?? {};
        service.container_labels["com.docker.stack.namespace"] = appName;
    }
}
