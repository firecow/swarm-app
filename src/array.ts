export function nameCompare (a: {Name?: string | null | undefined} | undefined, b: {Name?: string | null | undefined} | undefined) {
    if (!a?.Name) return 0;
    if (!b?.Name) return 0;
    return a.Name.localeCompare(b.Name);
}
