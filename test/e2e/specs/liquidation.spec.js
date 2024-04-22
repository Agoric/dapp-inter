/* eslint-disable ui-testing/no-disabled-tests */
describe('Wallet App Test Cases', () => {
  context('Setting up accounts', () => {
    it('should set up wallets for two members of the econ committee.', () => {
      cy.setupWallet({
        secretWords:
          'such field health riot cost kitten silly tube flash wrap festival portion imitate this make question host bitter puppy wait area glide soldier knee',
        walletName: 'gov2',
      });
      cy.setupWallet({
        secretWords:
          'physical immune cargo feel crawl style fox require inhale law local glory cheese bring swear royal spy buyer diesel field when task spin alley',
        walletName: 'gov1',
      });
      cy.setupWallet({
        secretWords:
          'tackle hen gap lady bike explain erode midnight marriage wide upset culture model select dial trial swim wood step scan intact what card symptom',
        walletName: 'user1',
      });
    });
  });

  context('Creating vaults and adjusting ATOM value', () => {
    it('should connect with the wallet', () => {
      cy.visit('/');

      cy.contains('Connect Wallet').click();
      cy.acceptAccess().then(taskCompleted => {
        expect(taskCompleted).to.be.true;
      });
      cy.get('label.cursor-pointer input[type="checkbox"]').check();
      cy.contains('Proceed').click();

      cy.acceptAccess().then(taskCompleted => {
        expect(taskCompleted).to.be.true;
      });
    });
    it('should set ATOM price to 12.34', () => {
      cy.exec('bash ./test/e2e/test-scripts/set-oracle-price.sh 12.34', {
        failOnNonZeroExit: false,
      }).then(result => {
        expect(result.stderr).to.contain('');
        expect(result.stdout).to.contain('Success: Price set to 12.34');
      });
    });
    it('should create a vault minting 100 ISTs and submitting 15 ATOMs as collateral', () => {
      cy.exec('bash ./test/e2e/test-scripts/create-vaults.sh 100 15', {
        failOnNonZeroExit: false,
        timeout: 120000,
      }).then(result => {
        expect(result.stderr).to.contain('');
        expect(result.stdout).not.to.contain('Error');
      });
    });

    it('should create a vault minting 103 ISTs and submitting 15 ATOMs as collateral', () => {
      cy.exec('bash ./test/e2e/test-scripts/create-vaults.sh 103 15', {
        failOnNonZeroExit: false,
        timeout: 120000,
      }).then(result => {
        expect(result.stderr).to.contain('');
        expect(result.stdout).not.to.contain('Error');
      });
    });

    it('should create a vault minting 105 ISTs and submitting 15 ATOMs as collateral', () => {
      cy.exec('bash ./test/e2e/test-scripts/create-vaults.sh 105 15', {
        failOnNonZeroExit: false,
        timeout: 120000,
      }).then(result => {
        expect(result.stderr).to.contain('');
        expect(result.stdout).not.to.contain('Error');
      });
    });

    it('should check for the existence of vaults on the UI', () => {
      cy.contains('button', 'Back to vaults').click();
      cy.contains('#8').should('exist');
      cy.contains('#9').should('exist');
      cy.contains('#10').should('exist');
    });
  });

  context('Place bids and make all vaults enter liquidation', () => {
    it('should create a vault minting 400 ISTs and submitting 80 ATOMs as collateral', () => {
      cy.exec('bash ./test/e2e/test-scripts/create-vaults.sh 400 80 gov1', {
        failOnNonZeroExit: false,
        timeout: 120000,
      }).then(result => {
        expect(result.stderr).to.contain('');
        expect(result.stdout).not.to.contain('Error');
      });
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
      cy.exec('bash ./test/e2e/test-scripts/set-oracle-price.sh 9.99').then(
        result => {
          expect(result.stderr).to.contain('');
          expect(result.stdout).to.contain('Success: Price set to 9.99');
        },
      );
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
        'bash ./test/e2e/test-scripts/view-auction.sh "book0.collateralAvailable" "0 ATOM"',
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
