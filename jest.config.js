export default {
    preset: 'ts-jest/presets/default-esm',
    testMatch: [
        "**/*.test.ts"
    ],
    coverageReporters: [
        "text-summary",
        "json-summary",
        "lcov"
    ],
    collectCoverageFrom: [
        "**/*.js",
        "!src/index.js",
        "!tests/**.*.js",
        "!**/node_modules/**",
        "!**/coverage/**"
    ]
};