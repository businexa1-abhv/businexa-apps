/**
 * @businexa/shared — cross-app constants and validation (password policy, etc.).
 */
const passwordPolicy = require('./passwordPolicy');

module.exports = {
  ...passwordPolicy,
};
