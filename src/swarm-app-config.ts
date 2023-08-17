import yaml from "js-yaml";
import fs from "fs";
import {AssertionError} from "assert";
import justExtend from "just-extend";
import {JTDSchemaType} from "ajv/dist/types/jtd-schema.js";
import Ajv from "ajv/dist/jtd.js";
import traverse from "traverse";
import {envsubst, parseEnvFile} from "./envsubst.js";

export interface SwarmAppNetworkConfig {
    attachable: boolean;
    external: boolean;
    name: string;
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
        ports: {
            protocol?: "tcp" | "udp";
            published: number;
            target: number;
        }[];
    };
    mounts?: Record<string, {
        source: string;
        type: "volume" | "bind";
        readonly: boolean;
    }>;
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
                                        protocol: {enum: ["tcp", "udp"]},
                                    },
                                },
                            },
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
                },
            },
        },
    },
    optionalProperties: {
        networks: {
            values: {
                properties: {
                    name: {type: "string"},
                    attachable: {type: "boolean"},
                    external: {type: "boolean"},
                },
            },
        },
    },
};

export async function loadSwarmAppConfig (filenames: string[]) {
    let extendedSwarmAppConfig = {};
    for (const filename of filenames) {
        const swarmAppConfig = yaml.load(await fs.promises.readFile(filename, "utf8"));
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
    // TODO: Download yml specified in service.extends and merge them.

    // Create default network block if it's missing.
    if (swarmAppConfig.networks == null || swarmAppConfig.networks["default"] == null) {
        swarmAppConfig.networks = swarmAppConfig.networks ?? {};
        swarmAppConfig.networks["default"] = {
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
    }

    // Envsubst all string values
    const services = swarmAppConfig.services;
    traverse(swarmAppConfig).forEach(function (v) {
        if (typeof v !== "string") return;

        const service = services[this.path[1]];
        let serviceEnvironment = {};
        if (this.path[0] === "services" && service?.environment) {
            serviceEnvironment = service.environment;
        }

        this.update(envsubst(v, {...process.env, ...serviceEnvironment}));
    });
}
