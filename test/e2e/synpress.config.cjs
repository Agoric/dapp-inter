const config = require('@agoric/synpress/synpress.config');
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  ...config,
  e2e: {
    ...config.e2e,
    baseUrl: 'http://localhost:5173',
    specPattern: 'test/e2e/specs/**/*spec.{js,jsx,ts,tsx}',
    supportFile: 'test/e2e/support.js',
  },
  pageLoadTimeout: 60000,
});
