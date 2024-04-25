import { mnemonics, accountAddresses } from '../test.utils';

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
    it('should create a vault minting 400 ISTs and submitting 80 ATOMs as collateral', () => {
      cy.createVault({ wantMinted: 400, giveCollateral: 80, userType: 'gov1' });
    });
    it('should place bids from the CLI successfully', () => {
      cy.switchWallet('gov2');
      cy.addNewTokensFound();
      cy.getTokenAmount('IST').then(initialTokenValue => {
        cy.exec('bash ./test/e2e/test-scripts/place-bids.sh', {
          failOnNonZeroExit: false,
        }).then(result => {
          const regex = /Bid Placed Successfully/g;
          const matches = result.stdout.match(regex);
          expect(matches).to.have.lengthOf(3);
          cy.getTokenAmount('IST').then(tokenValue => {
            expect(tokenValue).to.lessThan(initialTokenValue);
          });
        });
      });
    });

    it('should set ATOM price to 9.99', () => {
      cy.setOraclePrice(9.99);
    });

    it('switch to user1 wallet', () => {
      cy.switchWallet('user1');
    });

    it('should verify vaults that are at a risk of being liquidated', () => {
      cy.contains(
        /Please increase your collateral or repay your outstanding IST debt./,
      );
    });

    it('should wait and verify vaults are being liquidated', () => {
      cy.contains(/3 vaults are liquidating./, { timeout: 1200000 });
    });

    it('should view the auction and verify the value of startPrice from the CLI successfully', () => {
      cy.exec(
        'bash ./test/e2e/test-scripts/view-auction.sh "book0.startPrice" "9.99 IST/ATOM"',
        {
          failOnNonZeroExit: false,
        },
      ).then(result => {
        expect(result.stderr).to.contain('');
        expect(result.stdout).to.contain(
          'Field is present and expected value is matched',
        );
      });
    });

    it('should view the auction and verify the value of startProceedsGoal from the CLI successfully', () => {
      cy.exec(
        'bash ./test/e2e/test-scripts/view-auction.sh "book0.startProceedsGoal" "309.54 IST"',
        {
          failOnNonZeroExit: false,
        },
      ).then(result => {
        expect(result.stderr).to.contain('');
        expect(result.stdout).to.contain(
          'Field is present and expected value is matched',
        );
      });
    });

    it('should view the auction and verify the value of startCollateral from the CLI successfully', () => {
      cy.exec(
        'bash ./test/e2e/test-scripts/view-auction.sh "book0.startCollateral" "45 ATOM"',
        {
          failOnNonZeroExit: false,
        },
      ).then(result => {
        expect(result.stderr).to.contain('');
        expect(result.stdout).to.contain(
          'Field is present and expected value is matched',
        );
      });
    });

    it('should view the auction and verify the value of collateralAvailable from the CLI successfully', () => {
      cy.exec(
        'bash ./test/e2e/test-scripts/view-auction.sh "book0.collateralAvailable" "45 ATOM"',
        {
          failOnNonZeroExit: false,
        },
      ).then(result => {
        expect(result.stderr).to.contain('');
        expect(result.stdout).to.contain(
          'Field is present and expected value is matched',
        );
      });
    });

    it('should wait and verify vaults are liquidated', () => {
      cy.contains(/Collateral left to claim/, { timeout: 600000 });
      cy.contains(/3.42 ATOM/);
      cy.contains(/3.07 ATOM/);
      cy.contains(/2.84 ATOM/);
    });

    it('should view the auction and verify the value of collateralAvailable from the CLI successfully', () => {
      cy.exec(
        'bash ./test/e2e/test-scripts/view-auction.sh "book0.collateralAvailable" "9.659301 ATOM"',
        {
          failOnNonZeroExit: false,
        },
      ).then(result => {
        expect(result.stderr).to.contain('');
        expect(result.stdout).to.contain(
          'Field is present and expected value is matched',
        );
      });
    });
  });
});
