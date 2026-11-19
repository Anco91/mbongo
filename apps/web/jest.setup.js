/**
 * Jest setup (runs in each jsdom worker before the test framework).
 *
 * jsdom does not expose the Web Encoding API, which `react-dom/server`
 * requires. Node's implementation fills the gap.
 *
 * @module Tests/Setup
 */

const { TextEncoder, TextDecoder } = require('node:util');

globalThis.TextEncoder = globalThis.TextEncoder ?? TextEncoder;
globalThis.TextDecoder = globalThis.TextDecoder ?? TextDecoder;
