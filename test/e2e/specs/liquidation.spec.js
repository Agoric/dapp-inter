import {
  mnemonics,
  MINUTE_MS,
  networks,
  configMap,
  webWalletURL,
} from '../test.utils';

describe('Wallet App Test Cases', () => {
  let startTime;
  let bidder1AtomValueBefore;
  let bidder2AtomValueBefore;
  let bidder3AtomValueBefore;
  const AGORIC_NET = Cypress.env('AGORIC_NET');
  const currentConfig = configMap[AGORIC_NET];
  const DEFAULT_TIMEOUT = currentConfig.DEFAULT_TIMEOUT;
  const DEFAULT_TASK_TIMEOUT = currentConfig.DEFAULT_TASK_TIMEOUT;
  const LIQUIDATING_TIMEOUT = currentConfig.LIQUIDATING_TIMEOUT;
  const LIQUIDATED_TIMEOUT = currentConfig.LIQUIDATED_TIMEOUT;
  const user1Mnemonic = currentConfig.user1Mnemonic;
  const user1Address = currentConfig.user1Address;
  const bidder1Mnemonic = currentConfig.bidder1Mnemonic;
  const bidder1Address = currentConfig.bidder1Address;
  const bidder1WalletName = currentConfig.bidder1WalletName;
  const bidder2Mnemonic = currentConfig.bidder2Mnemonic;
  const bidder2Address = currentConfig.bidder2Address;
  const bidder2WalletName = currentConfig.bidder2WalletName;
  const bidder3Mnemonic = currentConfig.bidder3Mnemonic;
  const bidder3Address = currentConfig.bidder3Address;
  const bidder3WalletName = currentConfig.bidder3WalletName;
  const gov1Mnemonic = currentConfig.gov1Mnemonic;
  const gov1Address = currentConfig.gov1Address;
  const gov2Mnemonic = currentConfig.gov2Mnemonic;
  const gov2Address = currentConfig.gov2Address;
  const econGovURL = currentConfig.econGovURL;

  context('Setting up accounts', () => {
    // Using exports from the synthetic-chain lib instead of hardcoding mnemonics UNTIL https://github.com/Agoric/agoric-3-proposals/issues/154
    it('should set up bidder1 wallet', () => {
      cy.skipWhen(AGORIC_NET === networks.LOCAL);

      cy.setupWallet({
        secretWords: bidder1Mnemonic,
        walletName: bidder1WalletName,
      }).then(taskCompleted => {
        expect(taskCompleted).to.be.true;
      });
    });

    it('should set up bidder2 wallet', () => {
      cy.skipWhen(AGORIC_NET === networks.LOCAL);

      cy.setupWallet({
        secretWords: bidder2Mnemonic,
        walletName: bidder2WalletName,
      }).then(taskCompleted => {
        expect(taskCompleted).to.be.true;
      });
    });

    it('should set up bidder3 wallet', () => {
      cy.skipWhen(AGORIC_NET === networks.LOCAL);

      cy.setupWallet({
        secretWords: bidder3Mnemonic,
        walletName: bidder3WalletName,
      }).then(taskCompleted => {
        expect(taskCompleted).to.be.true;
      });
    });

    it('should set up user1 wallet', () => {
      cy.setupWallet({
        secretWords: user1Mnemonic,
        walletName: 'user1',
      }).then(taskCompleted => {
        expect(taskCompleted).to.be.true;
      });
    });

    it('should set up gov1 wallet', () => {
      cy.skipWhen(AGORIC_NET === networks.EMERYNET);

      cy.setupWallet({
        secretWords: mnemonics.gov1,
        walletName: 'gov1',
      }).then(taskCompleted => {
        expect(taskCompleted).to.be.true;
      });
    });

    it('should set up gov2 wallet', () => {
      cy.skipWhen(AGORIC_NET === networks.EMERYNET);

      cy.setupWallet({
        secretWords: mnemonics.gov2,
        walletName: 'gov2',
      }).then(taskCompleted => {
        expect(taskCompleted).to.be.true;
      });
    });
  });

  context('Adjusting manager params from econ-gov', () => {
    it('should connect with chain and wallet', () => {
      cy.skipWhen(AGORIC_NET === networks.EMERYNET);

      cy.visit(econGovURL);
      cy.acceptAccess().then(taskCompleted => {
        expect(taskCompleted).to.be.true;
      });
    });
    it('should allow gov2 to create a proposal', () => {
      cy.skipWhen(AGORIC_NET === networks.EMERYNET);

      cy.visit(econGovURL);
      cy.acceptAccess();

      cy.get('button').contains('Vaults').click();
      cy.get('button').contains('Select Manager').click();
      cy.get('button').contains('manager0').click();

      cy.get('label')
        .contains('LiquidationMargin')
        .parent()
        .within(() => {
          cy.get('input').clear();
          cy.get('input').type('150');
        });

      cy.get('label')
        .contains('LiquidationPadding')
        .parent()
        .within(() => {
          cy.get('input').clear();
          cy.get('input').type('25');
        });

      cy.get('label')
        .contains('LiquidationPenalty')
        .parent()
        .within(() => {
          cy.get('input').clear();
          cy.get('input').type('1');
        });

      cy.get('label')
        .contains('StabilityFee')
        .parent()
        .within(() => {
          cy.get('input').clear();
          cy.get('input').type('1');
        });

      cy.get('label')
        .contains('MintFee')
        .parent()
        .within(() => {
          cy.get('input').clear();
          cy.get('input').type('0.5');
        });

      cy.get('label')
        .contains('Minutes until close of vote')
        .parent()
        .within(() => {
          cy.get('input').clear();
          cy.get('input').type(1);
        });
      cy.get('[value="Propose Parameter Change"]').click();

      cy.confirmTransaction();
      cy.get('p')
        .contains('sent')
        .should('be.visible')
        .then(() => {
          startTime = Date.now();
        });
    });

    it('should allow gov2 to vote on the proposal', () => {
      cy.skipWhen(AGORIC_NET === networks.EMERYNET);
      cy.visit(econGovURL);

      cy.get('button').contains('Vote').click();
      cy.get('p').contains('YES').click();
      cy.get('input:enabled[value="Submit Vote"]').click();

      cy.confirmTransaction();
      cy.get('p').contains('sent').should('be.visible');
    });

    it('should allow gov1 to vote on the proposal', () => {
      cy.skipWhen(AGORIC_NET === networks.EMERYNET);

      cy.switchWallet('gov1');
      cy.visit(econGovURL);

      cy.get('button').contains('Vote').click();
      cy.get('p').contains('YES').click();
      cy.get('input:enabled[value="Submit Vote"]').click();

      cy.confirmTransaction();
      cy.get('p').contains('sent').should('be.visible');
    });

    it('should wait for proposal to pass', () => {
      cy.skipWhen(AGORIC_NET === networks.EMERYNET);

      cy.wait(MINUTE_MS - Date.now() + startTime);
      cy.visit(econGovURL);

      cy.get('button').contains('History').click();

      cy.get('code')
        .contains('VaultFactory - ATOM')
        .parent()
        .parent()
        .parent()
        .within(() => {
          cy.get('span').contains('Change Accepted').should('be.visible');
        });
    });
  });

  context('Adjusting auction params from econ-gov', () => {
    it('should allow gov1 to create a proposal', () => {
      cy.skipWhen(AGORIC_NET === networks.EMERYNET);

      cy.visit(econGovURL);

      cy.get('button').contains('Vaults').click();
      cy.get('button').contains('Change Manager Params').click();
      cy.get('button').contains('Change Auctioneer Params').click();

      cy.get('label')
        .contains('StartingRate')
        .parent()
        .within(() => {
          cy.get('input').clear();
          cy.get('input').type('10500');
        });

      cy.get('label')
        .contains('LowestRate')
        .parent()
        .within(() => {
          cy.get('input').clear();
          cy.get('input').type('6500');
        });

      cy.get('label')
        .contains('DiscountStep')
        .parent()
        .within(() => {
          cy.get('input').clear();
          cy.get('input').type('500');
        });

      cy.get('label')
        .contains('AuctionStartDelay')
        .parent()
        .within(() => {
          cy.get('input').clear();
          cy.get('input').type('2');
        });

      cy.get('label')
        .contains('Minutes until close of vote')
        .parent()
        .within(() => {
          cy.get('input').clear();
          cy.get('input').type(1);
        });
      cy.get('[value="Propose Parameter Change"]').click();

      cy.confirmTransaction();
      cy.get('p')
        .contains('sent')
        .should('be.visible')
        .then(() => {
          startTime = Date.now();
        });
    });

    it('should allow gov1 to vote on the proposal', () => {
      cy.skipWhen(AGORIC_NET === networks.EMERYNET);

      cy.visit(econGovURL);

      cy.get('button').contains('Vote').click();
      cy.get('p').contains('YES').click();
      cy.get('input:enabled[value="Submit Vote"]').click();

      cy.confirmTransaction();
      cy.get('p').contains('sent').should('be.visible');
    });

    it('should allow gov2 to vote on the proposal', () => {
      cy.skipWhen(AGORIC_NET === networks.EMERYNET);

      cy.switchWallet('gov2');
      cy.visit(econGovURL);

      cy.get('button').contains('Vote').click();
      cy.get('p').contains('YES').click();
      cy.get('input:enabled[value="Submit Vote"]').click();

      cy.confirmTransaction();
      cy.get('p').contains('sent').should('be.visible');
    });

    it('should wait for proposal to pass', () => {
      cy.skipWhen(AGORIC_NET === networks.EMERYNET);

      cy.wait(MINUTE_MS - Date.now() + startTime);
      cy.visit(econGovURL);

      cy.get('button').contains('History').click();

      cy.get('code')
        .contains('VaultFactory - ATOM')
        .parent()
        .parent()
        .parent()
        .within(() => {
          cy.get('span').contains('Change Accepted').should('be.visible');
        });

      cy.switchWallet('user1');
    });
  });

  context('Creating vaults and changing ATOM price', () => {
    it(
      'should connect with the wallet',
      {
        defaultCommandTimeout: DEFAULT_TIMEOUT,
        taskTimeout: DEFAULT_TASK_TIMEOUT,
      },
      () => {
        cy.connectWithWallet();
      },
    );

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

    it('should add the bidder1 key successfully', () => {
      cy.skipWhen(AGORIC_NET === networks.LOCAL);
      cy.addKeys({
        keyName: 'bidder1',
        mnemonic: bidder1Mnemonic,
        expectedAddress: bidder1Address,
      });
    });

    it('should add the bidder2 key successfully', () => {
      cy.skipWhen(AGORIC_NET === networks.LOCAL);
      cy.addKeys({
        keyName: 'bidder2',
        mnemonic: bidder2Mnemonic,
        expectedAddress: bidder2Address,
      });
    });

    it('should add the bidder3 key successfully', () => {
      cy.skipWhen(AGORIC_NET === networks.LOCAL);
      cy.addKeys({
        keyName: 'bidder3',
        mnemonic: bidder3Mnemonic,
        expectedAddress: bidder3Address,
      });
    });
    it('should set ATOM price to 12.34', () => {
      cy.setOraclePrice(12.34);
    });

    it('should create a vault minting 100 ISTs and giving 15 ATOMs as collateral', () => {
      cy.createVault({ wantMinted: 100, giveCollateral: 15, userKey: 'user1' });
    });

    it('should create a vault minting 103 ISTs and giving 15 ATOMs as collateral', () => {
      cy.createVault({ wantMinted: 103, giveCollateral: 15, userKey: 'user1' });
    });

    it('should create a vault minting 105 ISTs and giving 15 ATOMs as collateral', () => {
      cy.createVault({ wantMinted: 105, giveCollateral: 15, userKey: 'user1' });
    });

    it(
      'should check for the existence of vaults on the UI',
      {
        defaultCommandTimeout: DEFAULT_TIMEOUT,
        taskTimeout: DEFAULT_TASK_TIMEOUT,
      },
      () => {
        cy.contains('button', 'Back to vaults').click();
        cy.scrollTo('bottom', { ensureScrollable: false });
        cy.contains('100.50 IST').should('exist');
        cy.contains('103.51 IST').should('exist');
        cy.contains('105.52 IST').should('exist');
      },
    );
  });

  context('Place bids and make all vaults enter liquidation', () => {
    it('should create a vault minting 400 ISTs and giving 80 ATOMs as collateral', () => {
      cy.skipWhen(AGORIC_NET === networks.EMERYNET);
      cy.createVault({ wantMinted: 400, giveCollateral: 80, userKey: 'gov1' });
    });

    it(
      'should place bids from the CLI successfully',
      {
        defaultCommandTimeout: DEFAULT_TIMEOUT,
        taskTimeout: DEFAULT_TASK_TIMEOUT,
      },
      () => {
        cy.skipWhen(AGORIC_NET === networks.EMERYNET);
        cy.switchWallet(bidder1WalletName);
        cy.addNewTokensFound();
        cy.getTokenAmount('IST').then(initialTokenValue => {
          cy.placeBidByPrice({
            fromAddress: bidder1Address,
            giveAmount: '90IST',
            price: 9,
          });

          cy.placeBidByDiscount({
            fromAddress: bidder1Address,
            giveAmount: '80IST',
            discount: 10,
          });

          cy.placeBidByDiscount({
            fromAddress: bidder1Address,
            giveAmount: '150IST',
            discount: 15,
          });

          cy.getTokenAmount('IST').then(tokenValue => {
            expect(tokenValue).to.lessThan(initialTokenValue);
          });
        });
      },
    );

    it('should setup the web wallet', () => {
      cy.skipWhen(AGORIC_NET === networks.LOCAL);

      cy.visit(webWalletURL);

      cy.acceptAccess().then(taskCompleted => {
        expect(taskCompleted).to.be.true;
      });

      cy.visit(`${webWalletURL}/wallet/`);

      cy.get('input[type="checkbox"]').check();
      cy.contains('Proceed').click();
      cy.get('button[aria-label="Settings"]').click();

      cy.contains('div', 'Mainnet').click();
      cy.contains('li', 'Emerynet').click();
      cy.contains('button', 'Connect').click();

      cy.acceptAccess().then(taskCompleted => {
        expect(taskCompleted).to.be.true;
      });
    });

    it(
      'should place bid using bidder1 addresss',
      {
        defaultCommandTimeout: DEFAULT_TIMEOUT,
        taskTimeout: DEFAULT_TASK_TIMEOUT,
      },
      () => {
        cy.skipWhen(AGORIC_NET === networks.LOCAL);
        cy.switchWallet(bidder1WalletName);
        cy.addNewTokensFound();
        cy.getTokenAmount('IST').then(initialTokenValue => {
          cy.placeBidByPrice({
            fromAddress: bidder1Address,
            giveAmount: '90IST',
            price: 9,
          });

          cy.getTokenAmount('IST').then(tokenValue => {
            expect(tokenValue).to.lessThan(initialTokenValue);
          });
        });
      },
    );

    it('should extract and record current ATOM amount for bidder1', () => {
      cy.getTokenAmountByLabel('ATOM').then(amount => {
        bidder1AtomValueBefore = amount;
        cy.task('info', `The extracted amount is: ${bidder1AtomValueBefore}`);
      });
    });

    it(
      'should place bid using bidder2 addresss',
      {
        defaultCommandTimeout: DEFAULT_TIMEOUT,
        taskTimeout: DEFAULT_TASK_TIMEOUT,
      },
      () => {
        cy.skipWhen(AGORIC_NET === networks.LOCAL);
        cy.switchWallet(bidder2WalletName);
        cy.addNewTokensFound();
        cy.getTokenAmount('IST').then(initialTokenValue => {
          cy.placeBidByDiscount({
            fromAddress: bidder2Address,
            giveAmount: '80IST',
            discount: 10,
          });

          cy.getTokenAmount('IST').then(tokenValue => {
            expect(tokenValue).to.lessThan(initialTokenValue);
          });
        });
      },
    );

    it('should extract and record current ATOM amount for bidder2', () => {
      cy.getTokenAmountByLabel('ATOM').then(amount => {
        bidder2AtomValueBefore = amount;
        cy.task('info', `The extracted amount is: ${bidder2AtomValueBefore}`);
      });
    });

    it(
      'should place bid using bidder3 addresss',
      {
        defaultCommandTimeout: DEFAULT_TIMEOUT,
        taskTimeout: DEFAULT_TASK_TIMEOUT,
      },
      () => {
        cy.skipWhen(AGORIC_NET === networks.LOCAL);
        cy.switchWallet(bidder3WalletName);
        cy.addNewTokensFound();
        cy.getTokenAmount('IST').then(initialTokenValue => {
          cy.placeBidByDiscount({
            fromAddress: bidder3Address,
            giveAmount: '150IST',
            discount: 15,
          });

          cy.getTokenAmount('IST').then(tokenValue => {
            expect(tokenValue).to.lessThan(initialTokenValue);
          });
        });
      },
    );

    it('should extract and record current ATOM amount for bidder3', () => {
      cy.getTokenAmountByLabel('ATOM').then(amount => {
        bidder3AtomValueBefore = amount;
        cy.task('info', `The extracted amount is: ${bidder3AtomValueBefore}`);
      });
    });

    it('should set ATOM price to 9.99', () => {
      cy.setOraclePrice(9.99);
    });

    it('should verify vaults that are at a risk of being liquidated', () => {
      cy.visit('/');
      cy.switchWallet('user1');
      cy.contains(
        /Please increase your collateral or repay your outstanding IST debt./,
      );
    });

    it('should wait and verify vaults are being liquidated', () => {
      cy.contains(/vaults are liquidating./, {
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

    // Tests ran fine locally but failed in CI. Updating a3p container replicated failure locally. Tests pass with older container version.
    // UNTIL: a3p container compatibility is resolved.
    it(
      'should wait and verify vaults are liquidated',
      {
        defaultCommandTimeout: DEFAULT_TIMEOUT,
        taskTimeout: DEFAULT_TASK_TIMEOUT,
      },
      () => {
        cy.skipWhen(AGORIC_NET === networks.LOCAL);

        cy.contains(/Collateral left to claim/, {
          timeout: LIQUIDATED_TIMEOUT,
        });
        cy.contains(/3.42 ATOM/);
        cy.contains(/3.07 ATOM/);
        cy.contains(/2.84 ATOM/);
      },
    );

    it('should verify the value of collateralAvailable from the CLI successfully', () => {
      cy.skipWhen(AGORIC_NET === networks.LOCAL);

      const propertyName = 'book0.collateralAvailable';
      const expectedValue = '9.659301 ATOM';
      cy.wait(2 * MINUTE_MS);
      cy.verifyAuctionData(propertyName, expectedValue); // eslint-disable-line cypress/no-unnecessary-waiting
    });
  });

  context('Close the vaults and cancel bids', () => {
    it('should claim collateral from the first vault successfully', () => {
      cy.skipWhen(AGORIC_NET === networks.LOCAL);

      cy.contains(/3.42 ATOM/, { timeout: MINUTE_MS }).click();
      cy.contains('button', 'Close Out Vault').click();
      cy.wait(MINUTE_MS);
      cy.acceptAccess().then(taskCompleted => {
        expect(taskCompleted).to.be.true;
        cy.contains('button', 'Close Out Vault', {
          timeout: DEFAULT_TIMEOUT,
        }).should('not.exist');
      });
    });

    it('should claim collateral from the second vault successfully', () => {
      cy.skipWhen(AGORIC_NET === networks.LOCAL);

      cy.contains(/3.07 ATOM/, { timeout: MINUTE_MS }).click();
      cy.contains('button', 'Close Out Vault').click();
      cy.wait(MINUTE_MS);
      cy.acceptAccess().then(taskCompleted => {
        expect(taskCompleted).to.be.true;
        cy.contains('button', 'Close Out Vault', {
          timeout: DEFAULT_TIMEOUT,
        }).should('not.exist');
      });
    });

    it('should claim collateral from the third vault successfully', () => {
      cy.skipWhen(AGORIC_NET === networks.LOCAL);

      cy.contains(/2.84 ATOM/, { timeout: MINUTE_MS }).click();
      cy.contains('button', 'Close Out Vault').click();
      cy.wait(MINUTE_MS);
      cy.acceptAccess().then(taskCompleted => {
        expect(taskCompleted).to.be.true;
        cy.contains('button', 'Close Out Vault', {
          timeout: DEFAULT_TIMEOUT,
        }).should('not.exist');
      });
    });

    it('should set ATOM price back to 12.34', () => {
      cy.skipWhen(AGORIC_NET === networks.LOCAL);
      cy.setOraclePrice(12.34);
    });

    it('should switch to the bidder1 wallet successfully', () => {
      cy.skipWhen(AGORIC_NET === networks.LOCAL);
      cy.switchWallet(bidder1WalletName);
    });

    it('should verify completely filled bid of 90IST', () => {
      cy.skipWhen(AGORIC_NET === networks.LOCAL);
      cy.visit(`${webWalletURL}/wallet/`);
      cy.reloadAndWaitForWebWalletToBecomeStable();
      cy.contains('90.00 IST', { timeout: DEFAULT_TIMEOUT }).should(
        'not.exist',
      );

      cy.getTokenAmountByLabel('ATOM').then(amount => {
        cy.task('info', `ATOMs received: ${amount}`);
        // expect(amount - bidder1AtomValueBefore).to.be.at.least(10);
        // expect(amount - bidder1AtomValueBefore).to.be.below(11);
      });
    });

    it('should switch to the bidder2 wallet successfully', () => {
      cy.skipWhen(AGORIC_NET === networks.LOCAL);
      cy.switchWallet(bidder2WalletName);
    });

    it('should verify completely filled bid of 80IST', () => {
      cy.skipWhen(AGORIC_NET === networks.LOCAL);
      cy.reloadAndWaitForWebWalletToBecomeStable();
      cy.contains('80.00 IST', { timeout: DEFAULT_TIMEOUT }).should(
        'not.exist',
      );

      cy.getTokenAmountByLabel('ATOM').then(amount => {
        cy.task('info', `ATOMs received: ${amount}`);
        // expect(amount - bidder2AtomValueBefore).to.be.at.least(8);
        // expect(amount - bidder2AtomValueBefore).to.be.below(9);
      });
    });

    it('should switch to the bidder3 wallet successfully', () => {
      cy.skipWhen(AGORIC_NET === networks.LOCAL);
      cy.switchWallet(bidder3WalletName);
    });
    it('should cancel 150IST bid and verify ATOM balance', () => {
      cy.skipWhen(AGORIC_NET === networks.LOCAL);
      cy.reloadAndWaitForWebWalletToBecomeStable();
      cy.contains('150.00 IST', { timeout: DEFAULT_TIMEOUT }).should('exist');

      cy.getTokenAmount('IST').then(initialTokenValue => {
        cy.contains('Exit').click();
        cy.wait(MINUTE_MS);
        cy.acceptAccess().then(taskCompleted => {
          expect(taskCompleted).to.be.true;
        });
        cy.contains('Accepted', { timeout: DEFAULT_TIMEOUT }).should('exist');
        cy.getTokenAmount('IST').then(tokenValue => {
          expect(tokenValue).to.greaterThan(initialTokenValue);
        });
      });

      cy.reloadAndWaitForWebWalletToBecomeStable();

      cy.getTokenAmountByLabel('ATOM').then(amount => {
        cy.task('info', `ATOMs received: ${amount}`);
        // expect(amount - bidder3AtomValueBefore).to.be.at.least(16);
        // expect(amount - bidder3AtomValueBefore).to.be.below(17);
      });
    });
  });
});
