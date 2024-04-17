/* global Cypress */

import '@agoric/synpress/support/commands';

// dont fail tests on uncaught exceptions of websites
Cypress.on('uncaught:exception', () => {
  if (!Cypress.env('FAIL_ON_ERROR')) {
    return false;
  }
});
