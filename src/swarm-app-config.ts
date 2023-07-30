import yaml from "js-yaml";
import fs from "fs";
import {AssertionError} from "assert";
import justExtend from "just-extend";
import {JTDSchemaType} from "ajv/dist/types/jtd-schema.js";
import Ajv from "ajv/dist/jtd.js";
import traverse from "traverse";
import envsubst from "./envsubst.js";

export interface SwarmAppNetworkConfig {
    attachable: boolean;
    external: boolean;
    name: string;
}

export interface SwarmAppServiceConfig {
    extends?: {file: string; name: string}[];
    image?: string;
    labels?: Record<string, string>;
    command?: string[];
    entrypoint?: string[];
    containerLabels?: Record<string, string>;
    configs?: Record<string, {
        sourceFile?: string;
        content?: string;
    }>;
    environment?: Record<string, string>;
    networks?: string[];
    replicas?: number;
    stop_signal?: "SIGTERM" | "SIGQUIT";
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
                    labels: {values: {type: "string"}},
                    command: {elements: {type: "string"}},
                    entrypoint: {elements: {type: "string"}},
                    containerLabels: {values: {type: "string"}},
                    configs: {
                        values: {
                            optionalProperties: {
                                sourceFile: {type: "string"},
                                content: {type: "string"},
                            },
                        },
                    },
                    environment: {values: {type: "string"}},
                    networks: {
                        elements: {type: "string"},
                    },
                    replicas: {type: "int32"},
                    stop_signal: {enum: ["SIGTERM", "SIGQUIT"]},
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

    // Envsubst all fields
    traverse(extendedSwarmAppConfig).forEach(function (v) {
        if (typeof v !== "string") return;
        this.update(envsubst(v, process.env));
    });

    // Validate json schema
    const validate = new Ajv().compile(swarmAppConfigSchema);
    if (!validate(extendedSwarmAppConfig)) {
        throw new AssertionError({message: `${JSON.stringify(validate.errors)}`});
    }

    // TODO: Download yml specified in extends and merge them.

    return extendedSwarmAppConfig;
}

export function initDefaultNetwork (config: SwarmAppConfig, appName: string) {
    if (config.networks == null || config.networks["default"] == null) {
        config.networks = config.networks ?? {};
        config.networks["default"] = {
            name: `${appName}_default`,
            attachable: false,
            external: false,
        };
    }
}