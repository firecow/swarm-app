import {JTDSchemaType} from "ajv/dist/types/jtd-schema.js";

export interface CowSwarmConfig {
    networks?: Record<string, {
        attachable: boolean;
        external: boolean;
    }>;
    services: Record<string, {
        extends?: {file: string; name: string}[];
        image?: string;
        labels?: Record<string, string>;
        configs?: Record<string, {
            file?: string;
            content?: string;
        }>;
        environment?: Record<string, string>;
        networks?: Record<string, {
            aliases?: string[];
        }>;
        replicas?: number;
        placement?: {
            max_replicas_per_node?: number;
            constraints?: string[];
            preferences?: {spread: string}[];
        };
        endpoints?: Record<string, {
            mode: "host" | "ingress";
            source: number;
        }>;
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
                        values: {
                            optionalProperties: {
                                aliases: {elements: {type: "string"}},
                            },
                        },
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
                    endpoints: {
                        values: {
                            properties: {
                                mode: {enum: ["host", "ingress"]},
                                source: {type: "int16"},
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
