/**
 * Jest global setup.
 *
 * Pins the process timezone to UTC so date-based tests are deterministic
 * regardless of the machine running them.
 *
 * @module Tests/GlobalSetup
 */
module.exports = () => {
  process.env.TZ = 'UTC';
};
