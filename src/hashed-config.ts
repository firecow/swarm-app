import crypto from "crypto";
import {CowSwarmConfig} from "./cow-swarm-config.js";
import fs from "fs";
import {AssertionError} from "assert";

export class HashedConfig {

    public readonly hash: string;

    constructor (
        public readonly targetPath: string,
        public readonly content: string,
        public readonly serviceName: string,
    ) {
        this.hash = crypto.createHash("md5").update(content).digest("hex");
    }
}

export class HashedConfigs {

    private list: HashedConfig[] = [];

    add (hashedConfig: HashedConfig) {
        this.list.push(hashedConfig);
    }

    service (serviceName: string): {targetPath: string; hash: string}[] {
        const service: {targetPath: string; hash: string}[] = [];
        this.list.filter(l => l.serviceName === serviceName).forEach(({targetPath, hash}) => service.push({targetPath, hash}));
        return service;
    }

    unique (): {hash: string; content: string}[] {
        const map = new Map<string, string>();
        const unique: {hash: string; content: string}[] = [];
        this.list.forEach((c) => map.set(c.hash, c.content));
        map.forEach((v, k) => unique.push({hash: k, content: v}));
        return unique;
    }
}

export async function initHashedConfigs (config: CowSwarmConfig) {
    const hashedConfigs = new HashedConfigs();
    for (const [serviceName, s] of Object.entries(config.services)) {
        if (!s.configs) continue;
        for (const [targetPath, c] of Object.entries(s.configs)) {
            if (c.content) {
                const content = c.content;
                hashedConfigs.add(new HashedConfig(targetPath, content, serviceName));
            } else if (c.file) {
                const content = await fs.promises.readFile(c.file, "utf-8");
                hashedConfigs.add(new HashedConfig(targetPath, content, serviceName));
            } else {
                throw new AssertionError({message: `config ${targetPath} missing content or file field`});
            }
        }
    }
    return hashedConfigs;
}