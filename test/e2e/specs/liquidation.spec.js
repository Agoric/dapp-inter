import {
  mnemonics,
  MINUTE_MS,
  networks,
  configMap,
  webWalletURL,
  webWalletSelectors,
  QUICK_WAIT,
  THIRTY_SECONDS,
  tokens,
  extractNumber,
} from '../test.utils';

describe('Wallet App Test Cases', () => {
  let startTime;
  const AGORIC_NET = Cypress.env('AGORIC_NET');
  const network = AGORIC_NET !== 'local' ? 'testnet' : 'local';
  const currentConfig = configMap[network];


  context('WWW', () => {
    it('should set ATOM price to 12.34', () => {
      cy.setOraclePrice(7.0);
    });
  });
});
