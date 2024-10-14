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
  const user1Mnemonic = currentConfig.user1Mnemonic;
  const user1Address = currentConfig.user1Address;
  const bidderMnemonic = currentConfig.bidderMnemonic;
  const bidderAddress = currentConfig.bidderAddress;
  const bidderWalletName = currentConfig.bidderWalletName;
  const gov1Mnemonic = currentConfig.gov1Mnemonic;
  const gov1Address = currentConfig.gov1Address;
  const gov2Mnemonic = currentConfig.gov2Mnemonic;
  const gov2Address = currentConfig.gov2Address;

  it('should add all the keys successfully', () => {
    cy.addKeys({
      keyName: 'gov1',
      mnemonic: gov1Mnemonic,
      expectedAddress: gov1Address,
    });
    cy.addKeys({
      keyName: 'gov2',
      mnemonic: gov2Mnemonic,
      expectedAddress: gov2Address,
    });
    cy.addKeys({
      keyName: 'user1',
      mnemonic: user1Mnemonic,
      expectedAddress: user1Address,
    });
  });


  context('WWW', () => {
    it('should set ATOM price to 12.34', () => {
      cy.setOraclePrice(7.0);
    });
  });
});
