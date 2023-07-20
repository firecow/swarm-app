import assert from "assert";

function searchLast (str: string, rgx: RegExp) {
    const matches = Array.from(str.matchAll(rgx));
    return matches.length > 0 ? matches.slice(-1)[0].index : -1;
}

export default function envsubst (value: string, env: {[key: string]: string | undefined}): string {
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
        assert(defaultValue != null || env[varName] !== "", `${varName} expanded to empty string`);
        assert(defaultValue != null || env[varName] != null, `${varName} expanded to undefined`);
        return res;
    }
    return value;
}