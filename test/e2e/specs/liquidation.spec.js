/* eslint-disable ui-testing/no-disabled-tests */
import { mnemonics, accountAddresses } from '../../test.utils';

describe('Wallet App Test Cases', () => {
  context('Setting up accounts', () => {
    // Using exports from the synthetic-chain lib instead of hardcoding mnemonics UNTIL https://github.com/Agoric/agoric-3-proposals/issues/154
    it('should set up wallets', () => {
      cy.setupWallet({
        secretWords: mnemonics.gov1,
        walletName: 'gov1',
      });
      cy.setupWallet({
        secretWords: mnemonics.gov2,
        walletName: 'gov2',
      });
      cy.setupWallet({
        secretWords: mnemonics.user1,
        walletName: 'user1',
      });
    });
  });

  context('Creating vaults and changing ATOM price', () => {
    it('should connect with the wallet', () => {
      cy.visit('/');

      cy.contains('Connect Wallet').click();
      cy.acceptAccess().then(taskCompleted => {
        expect(taskCompleted).to.be.true;
      });

      cy.contains(
        'By clicking here you are indicating that you have read and agree to our',
      )
        .closest('label')
        .find('input[type="checkbox"]')
        .click();
      cy.contains('Proceed').click();

      cy.acceptAccess().then(taskCompleted => {
        expect(taskCompleted).to.be.true;
      });
    });
    it('should set ATOM price to 12.34', () => {
      cy.addKeys({
        keyName: 'gov1',
        mnemonic: mnemonics.gov1,
        expectedAddress: accountAddresses.gov1,
      });
      cy.addKeys({
        keyName: 'gov2',
        mnemonic: mnemonics.gov2,
        expectedAddress: accountAddresses.gov2,
      });
      cy.setOraclePrice(12.34);
    });
    it('should create a vault minting 100 ISTs and giving 15 ATOMs as collateral', () => {
      cy.addKeys({
        keyName: 'user1',
        mnemonic: mnemonics.user1,
        expectedAddress: accountAddresses.user1,
      });
      cy.createVault({ wantMinted: 100, giveCollateral: 15 });
    });

    it('should create a vault minting 103 ISTs and giving 15 ATOMs as collateral', () => {
      cy.createVault({ wantMinted: 103, giveCollateral: 15 });
    });

    it('should create a vault minting 105 ISTs and giving 15 ATOMs as collateral', () => {
      cy.createVault({ wantMinted: 105, giveCollateral: 15 });
    });

    it('should check for the existence of vaults on the UI', () => {
      cy.contains('button', 'Back to vaults').click();
      cy.contains('100.50 IST').should('exist');
      cy.contains('103.51 IST').should('exist');
      cy.contains('105.52 IST').should('exist');
    });
  });
});
