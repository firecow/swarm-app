import {test, expect} from "@jest/globals";
import {sortObjectKeys} from "../src/object.js";

test("It sorts object keys", () => {
    let obj: Record<string, boolean> | undefined = {
        "b": true,
        "a": true,
    };
    obj = sortObjectKeys(obj);
    expect(Object.keys(obj ?? {})).toEqual(["a", "b"]);
});
