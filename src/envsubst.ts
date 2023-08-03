import assert from "assert";

function searchLast (str: string, rgx: RegExp) {
    const matches = Array.from(str.matchAll(rgx));
    return matches.length > 0 ? matches.slice(-1)[0].index : -1;
}

export function parseEnvFile (src: string): {[key: string]: string} {
    const regExp = /^\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?$/mg;
    const obj: {[key: string]: string} = {};
    const lines = src.replace(/\r\n?/mg, "\n");

    let match;
    while ((match = regExp.exec(lines)) != null) {
        const key = match[1];

        // Default undefined or null to empty string
        let value = (match[2] || "");

        // Remove whitespace
        value = value.trim();

        // Check if double-quoted
        const maybeQuote = value[0];

        // Remove surrounding quotes
        value = value.replace(/^(['"`])([\s\S]*)\1$/mg, "$2");

        // Expand newlines if double-quoted
        if (maybeQuote === "\"") {
            value = value.replace(/\\n/g, "\n");
            value = value.replace(/\\r/g, "\r");
        }

        // Add to object
        obj[key] = value;
    }

    return obj;
}

export function envsubst (value: string, env: {[key: string]: string | undefined}): string {
    const lastIndexOf = searchLast(value, /(?!(?<=\\))\$/g);

    if (lastIndexOf === -1) return value;
    const lastGroup = value.slice(lastIndexOf);
    const matchGroup = /((?!(?<=\\))\${?(\w+)(?::-([^}\\]*))?}?)/;
    const match = lastGroup.match(matchGroup);

    if (match != null) {
        const [, group, varName, defaultValue] = match;
        const res = envsubst(
            value.replace(
                group,
                env[varName] ||
                defaultValue ||
                "",
            ),
            env,
        );
        assert(defaultValue != null || env[varName] !== "", `${varName} is empty string`);
        assert(defaultValue != null || env[varName] != null, `${varName} is undefined`);
        return res;
    }
    return value;
}