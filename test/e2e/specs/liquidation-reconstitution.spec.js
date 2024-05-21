import {
  mnemonics,
  accountAddresses,
  LIQUIDATING_TIMEOUT,
  LIQUIDATED_TIMEOUT,
} from '../test.utils';

describe('Wallet App Test Cases', () => {
  context('Setting up accounts', () => {
    // Using exports from the synthetic-chain lib instead of hardcoding mnemonics UNTIL https://github.com/Agoric/agoric-3-proposals/issues/154
    it('should set up wallets', () => {
      cy.setupWallet({
        secretWords: mnemonics.gov1,
        walletName: 'gov1',
      }).then(taskCompleted => {
        expect(taskCompleted).to.be.true;
      });
      cy.setupWallet({
        secretWords: mnemonics.gov2,
        walletName: 'gov2',
      }).then(taskCompleted => {
        expect(taskCompleted).to.be.true;
      });
      cy.setupWallet({
        secretWords: mnemonics.user1,
        walletName: 'user1',
      }).then(taskCompleted => {
        expect(taskCompleted).to.be.true;
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
    /* eslint-disable ui-testing/missing-assertion-in-test */
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

  context('Place bids and make all vaults enter liquidation', () => {
    it('should create a vault minting 400 ISTs and giving 80 ATOMs as collateral', () => {
      cy.createVault({ wantMinted: 400, giveCollateral: 80, userType: 'gov1' });
    });
    it('should place bids from the CLI successfully', () => {
      cy.switchWallet('gov1');
      cy.addNewTokensFound();
      cy.getTokenAmount('IST').then(initialTokenValue => {
        cy.placeBidByDiscount({
          fromAddress: accountAddresses.gov1,
          giveAmount: '75IST',
          discount: 22,
        });

        cy.placeBidByDiscount({
          fromAddress: accountAddresses.gov1,
          giveAmount: '25IST',
          discount: 30,
        });

        cy.getTokenAmount('IST').then(tokenValue => {
          expect(tokenValue).to.lessThan(initialTokenValue);
        });
      });
    });

    it('should verify vaults that are at a risk of being liquidated', () => {
      cy.setOraclePrice(9.99);
      cy.switchWallet('user1');
      cy.contains(
        /Please increase your collateral or repay your outstanding IST debt./,
      );
    });

    it('should wait and verify vaults are being liquidated', () => {
      cy.contains(/3 vaults are liquidating./, {
        timeout: LIQUIDATING_TIMEOUT,
      });
    });

    it('should verify the value of startPrice from the CLI successfully', () => {
      const propertyName = 'book0.startPrice';
      const expectedValue = '9.99 IST/ATOM';

      cy.verifyAuctionData(propertyName, expectedValue);
    });

    it('should verify the value of startProceedsGoal from the CLI successfully', () => {
      const propertyName = 'book0.startProceedsGoal';
      const expectedValue = '309.54 IST';

      cy.verifyAuctionData(propertyName, expectedValue);
    });

    it('should verify the value of startCollateral from the CLI successfully', () => {
      const propertyName = 'book0.startCollateral';
      const expectedValue = '45 ATOM';

      cy.verifyAuctionData(propertyName, expectedValue);
    });

    it('should verify the value of collateralAvailable from the CLI successfully', () => {
      const propertyName = 'book0.collateralAvailable';
      const expectedValue = '45 ATOM';

      cy.verifyAuctionData(propertyName, expectedValue);
    });

    // Tests ran fine locally but failed in CI. Updating a3p container replicated failure locally. Tests pass with older container version.
    // UNTIL: a3p container compatibility is resolved.
    it.skip('should wait and verify vaults are liquidated', () => {
      cy.contains(/Collateral left to claim/, { timeout: LIQUIDATED_TIMEOUT });
      cy.contains(/3.42 ATOM/);
      cy.contains(/3.07 ATOM/);
      cy.contains(/2.84 ATOM/);
    });

    it.skip('should verify the value of collateralAvailable from the CLI successfully', () => {
      const propertyName = 'book0.collateralAvailable';
      const expectedValue = '9.659301 ATOM';

      cy.verifyAuctionData(propertyName, expectedValue);
    });
  });
});
