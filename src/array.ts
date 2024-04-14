export function nameCompare (a: {Name?: string} | undefined, b: {Name?: string} | undefined) {
    if (!a?.Name) return 0;
    if (!b?.Name) return 0;
    return a.Name.localeCompare(b.Name);
}
