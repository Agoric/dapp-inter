import {
  mnemonics,
  LIQUIDATING_TIMEOUT,
  LIQUIDATED_TIMEOUT,
  econGovURL,
  MINUTE_MS,
  networks,
  configMap,
} from '../test.utils';

describe('Wallet App Test Cases', () => {
  let startTime;
  let zeroCollateralVaults = 0;
  const AGORIC_NET = Cypress.env('AGORIC_NET');
  const currentConfig = configMap[AGORIC_NET];
  const DEFAULT_TIMEOUT = currentConfig.DEFAULT_TIMEOUT;
  const DEFAULT_TASK_TIMEOUT = currentConfig.DEFAULT_TASK_TIMEOUT;
  const user1Mnemonic = currentConfig.user1Mnemonic;
  const user1Address = currentConfig.user1Address;
  const bidderMnemonic = currentConfig.bidderMnemonic;
  const bidderAddress = currentConfig.bidderAddress;
  const bidderWalletName = currentConfig.bidderWalletName;
  const gov1Mnemonic = currentConfig.gov1Mnemonic;
  const gov1Address = currentConfig.gov1Address;
  const gov2Mnemonic = currentConfig.gov2Mnemonic;
  const gov2Address = currentConfig.gov2Address;

  context('Setting up accounts', () => {
    // Using exports from the synthetic-chain lib instead of hardcoding mnemonics UNTIL https://github.com/Agoric/agoric-3-proposals/issues/154
    it('should set up bidder wallet', () => {
      cy.skipWhen(AGORIC_NET === networks.LOCAL);

      cy.setupWallet({
        secretWords: bidderMnemonic,
        walletName: bidderWalletName,
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

    // it('should add all the keys successfully', () => {
    //   cy.addKeys({
    //     keyName: 'gov1',
    //     mnemonic: gov1Mnemonic,
    //     expectedAddress: gov1Address,
    //   });
    //   cy.addKeys({
    //     keyName: 'gov2',
    //     mnemonic: gov2Mnemonic,
    //     expectedAddress: gov2Address,
    //   });
    //   cy.addKeys({
    //     keyName: 'user1',
    //     mnemonic: user1Mnemonic,
    //     expectedAddress: user1Address,
    //   });
    // });

    // it('should add the bidder key successfully', () => {
    //   it.skipWhen(AGORIC_NET === networks.LOCAL);
    //   cy.addKeys({
    //     keyName: 'bidder',
    //     mnemonic: bidderMnemonic,
    //     expectedAddress: bidderAddress,
    //   });
    // });
    it('should set ATOM price to 12.34', () => {
      cy.setOraclePrice(12.34);
    });
    it('should create a vault minting 100 ISTs and giving 15 ATOMs as collateral', () => {
      cy.createVault({ wantMinted: 100, giveCollateral: 15 });
    });

    it('should create a vault minting 103 ISTs and giving 15 ATOMs as collateral', () => {
      cy.createVault({ wantMinted: 103, giveCollateral: 15 });
    });

    it('should create a vault minting 105 ISTs and giving 15 ATOMs as collateral', () => {
      cy.createVault({ wantMinted: 105, giveCollateral: 15 });
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

  context(
    'Place bids and make all vaults enter liquidation',
    {
      defaultCommandTimeout: DEFAULT_TIMEOUT,
      taskTimeout: DEFAULT_TASK_TIMEOUT,
    },
    () => {
      it('should create a vault minting 400 ISTs and giving 80 ATOMs as collateral', () => {
        cy.skipWhen(AGORIC_NET === networks.EMERYNET);
        cy.createVault({
          wantMinted: 400,
          giveCollateral: 80,
          userType: 'gov1',
        });
      });
      it('should place bids from the CLI successfully', () => {
        cy.switchWallet(bidderWalletName);
        cy.addNewTokensFound();
        cy.getTokenAmount('IST').then(initialTokenValue => {
          cy.placeBidByDiscount({
            fromAddress: bidderAddress,
            giveAmount: '75IST',
            discount: 22,
          });

          cy.placeBidByDiscount({
            fromAddress: bidderAddress,
            giveAmount: '25IST',
            discount: 30,
          });

          cy.getTokenAmount('IST').then(tokenValue => {
            expect(tokenValue).to.lessThan(initialTokenValue);
          });
        });
      });

      it('should count the number of 0 Collateral Vaults', () => {
        cy.get('body').then(body => {
          if (body.find(':contains("0.00 ATOM")').length > 0) {
            cy.contains(/Collateral left to claim/, {
              timeout: LIQUIDATED_TIMEOUT,
            }).then(elements => {
              zeroCollateralVaults = elements.length;
              cy.log(`Count of elements: ${zeroCollateralVaults}`);
              expect(zeroCollateralVaults).to.be.greaterThan(0);
            });
          } else {
            cy.log(
              'No elements found with the text "Collateral left to claim"',
            );
          }
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
      it(
        'should verify a vault is liquidated',
        {
          defaultCommandTimeout: DEFAULT_TIMEOUT,
          taskTimeout: DEFAULT_TASK_TIMEOUT,
        },
        () => {
          cy.skipWhen(AGORIC_NET === networks.LOCAL);

          cy.contains(/0.00 ATOM/, {
            timeout: LIQUIDATED_TIMEOUT,
          }).then(elements => {
            let currentLength = elements.length;
            expect(currentLength).to.be.greaterThan(zeroCollateralVaults + 1);
          });
        },
      );

      it(
        'should verify 2 vaults are reconstituted',
        {
          defaultCommandTimeout: DEFAULT_TIMEOUT,
          taskTimeout: DEFAULT_TASK_TIMEOUT,
        },
        () => {
          cy.skipWhen(AGORIC_NET === networks.LOCAL);

          cy.contains(/2 vaults are liquidating./, {
            timeout: LIQUIDATING_TIMEOUT,
          });

          const regexVault100 = new RegExp('100(\\.\\d+)?');
          const regexVault103 = new RegExp('100(\\.\\d+)?');
          cy.contains(regexVault100, { timeout: LIQUIDATING_TIMEOUT });
          cy.contains(regexVault103, { timeout: LIQUIDATING_TIMEOUT });
        },
      );

      it('should verify the value of collateralAvailable from the CLI successfully', () => {
        cy.skipWhen(AGORIC_NET === networks.LOCAL);

        const propertyName = 'book0.collateralAvailable';
        const expectedValue = '31.4198 ATOM';

        cy.verifyAuctionData(propertyName, expectedValue);
      });
    },
  );
});
