import yaml from "js-yaml";
import fs from "fs";
import {AssertionError} from "assert";
import justExtend from "just-extend";
import {JTDSchemaType} from "ajv/dist/types/jtd-schema.js";
import Ajv from "ajv/dist/jtd.js";

export interface CowSwarmConfig {
    networks?: Record<string, {
        attachable: boolean;
        external: boolean;
    }>;
    services: Record<string, {
        extends?: {file: string; name: string}[];
        image?: string;
        labels?: Record<string, string>;
        command?: string[];
        entrypoint?: string[];
        containerLabels?: Record<string, string>;
        configs?: Record<string, {
            file?: string;
            content?: string;
        }>;
        environment?: Record<string, string>;
        networks?: string[];
        replicas?: number;
        placement?: {
            max_replicas_per_node?: number;
            constraints?: string[];
            preferences?: {spread: string}[];
        };
        endpoint?: {
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
    }>;
}


export const cowSwarmConfigSchema: JTDSchemaType<CowSwarmConfig> = {
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
                                file: {type: "string"},
                                content: {type: "string"},
                            },
                        },
                    },
                    environment: {values: {type: "string"}},
                    networks: {
                        elements: {type: "string"},
                    },
                    replicas: {type: "int32"},
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
                    endpoint: {
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
                    attachable: {type: "boolean"},
                    external: {type: "boolean"},
                },
            },
        },
    },
};

export async function loadCowSwarmConfig (filenames: string[]) {
    let extendedCowSwarmConfig = {};
    for (const filename of filenames) {
        const cowSwarmConfig = yaml.load(await fs.promises.readFile(filename, "utf8"));
        extendedCowSwarmConfig = justExtend(true, extendedCowSwarmConfig, cowSwarmConfig);
    }

    const validate = new Ajv().compile(cowSwarmConfigSchema);
    if (!validate(extendedCowSwarmConfig)) {
        throw new AssertionError({message: `${JSON.stringify(validate.errors)}`});
    }
    return extendedCowSwarmConfig;
}