import crypto from "crypto";
import {SwarmAppConfig} from "./swarm-app-config.js";
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

    filterByServiceName (serviceName: string): {targetPath: string; hash: string}[] {
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

    exists (hash: string) {
        return this.list.find(c => c.hash === hash) != null;
    }
}

export async function initHashedConfigs (config: SwarmAppConfig) {
    const hashedConfigs = new HashedConfigs();
    for (const [serviceName, s] of Object.entries(config.services)) {
        if (!s.configs) continue;
        for (const [targetPath, c] of Object.entries(s.configs)) {
            let content;
            if (c.content) {
                content = c.content;
            } else if (c.sourceFile) {
                content = await fs.promises.readFile(c.sourceFile, "utf-8");
            } else {
                throw new AssertionError({message: `config ${targetPath} missing content or file field`});
            }
            hashedConfigs.add(new HashedConfig(targetPath, content, serviceName));
        }
    }
    return hashedConfigs;
}