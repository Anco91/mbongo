/**
 * Jest stub for the `server-only` package.
 *
 * In Next.js, `server-only` guards modules against client imports.
 * In Jest (node/jsdom environments) the guard has no meaning — map to nothing.
 *
 * @module Tests/Stubs/ServerOnly
 */
module.exports = {};
