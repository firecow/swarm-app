import assert from "assert";

export function assertString (value: unknown): asserts value is string {
    assert(typeof value === "string");
}

export function assertStringOrNull (value: unknown): asserts value is string | null {
    if (value === null) return;
    assertString(value);
}

export function assertNumber (value: unknown): asserts value is number {
    assert(typeof value === "number");
}

export function assertArray<T = unknown> (value: unknown, assertion?: (element: unknown) => asserts element is T): asserts value is T[] {
    assert(Array.isArray(value));

    if (assertion) {
        value.forEach(assertion);
    }
}

export function assertObject (value: unknown): asserts value is object {
    assert(typeof value === "object" && value !== null && !Array.isArray(value));
}

export function assertObjectOrNull (value: unknown): asserts value is object | null {
    if (value === null) return;
    assertObject(value);
}
