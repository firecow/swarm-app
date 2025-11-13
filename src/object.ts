export function sortObjectKeys<T> (unordered: Record<string, T> | undefined) {
    if (!unordered) return unordered;
    return Object.keys(unordered).sort((a, b) => a.localeCompare(b)).reduce((obj: Record<string, T>, key: string) => {
        if (unordered[key]) {
            obj[key] = unordered[key];
        }
        return obj;
    }, {});
}
