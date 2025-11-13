import assert from "assert";
import {ContainerSpec, ContainerTaskSpec, ServiceSpec} from "dockerode";

export function assertString (value: unknown, msg: string): asserts value is string {
    assert(typeof value === "string", msg);
}

export function assertStringOrNull (value: unknown, msg: string): asserts value is string | null {
    if (value === null) return;
    assertString(value, msg);
}

export function assertBooleanOrNull (value: unknown, msg: string): asserts value is boolean | null {
    if (value === null) return;
    assert(typeof value === "boolean", msg);
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

export function assertTaskTemplateContainerTaskSpec (obj: unknown): asserts obj is ServiceSpec & {TaskTemplate: ContainerTaskSpec & {ContainerSpec: ContainerSpec}} {
    assert(typeof obj === "object" && obj != null, "obj must be null");
    assert("TaskTemplate" in obj, "TaskTemplate must be present on obj");
    assert(typeof obj.TaskTemplate === "object" && obj.TaskTemplate !== null, "obj.TaskTemplate must be a non-null object");
    assert("ContainerSpec" in obj.TaskTemplate, "ContainerSpec must be present on obj.TaskTemplate");
    assert(obj.TaskTemplate.ContainerSpec != null, "obj.TaskTemplate.ContainerSpec must be a non-null object");
}
