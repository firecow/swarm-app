import assert from "assert";

export function assertString (value: unknown, msg: string): asserts value is string {
    assert(typeof value === "string", msg);
}

export function assertStringOrNull (value: unknown, msg: string): asserts value is string | null {
    if (value === null) return;
    assertString(value, msg);
}

export function assertNumber (value: unknown, msg: string): asserts value is number {
    assert(typeof value === "number", msg);
}

export function assertArray<T = unknown> (value: unknown, msg: string, assertion?: (element: unknown, msg: string) => asserts element is T): asserts value is T[] {
    assert(Array.isArray(value), msg);

    if (assertion) {
        const assertElement: (element: unknown, msg: string) => asserts element is T = assertion;
        for (const v of value) {
            assertElement(v, msg);
        }
    }
}

export function assertObject (value: unknown, msg: string): asserts value is object {
    assert(typeof value === "object" && value !== null && !Array.isArray(value), msg);
}

export function assertObjectOrNull (value: unknown, msg: string): asserts value is object | null {
    if (value === null) return;
    assertObject(value, msg);
}
