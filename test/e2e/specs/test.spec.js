import { mnemonics, phrasesList, MINUTE_MS } from '../test.utils';

describe('Vaults UI Test Cases', () => {
  context('Test commands', () => {
    const networkPhrases = phrasesList[Cypress.env('AGORIC_NET') || 'local'];

    it('should setup the wallet', () => {
      if (networkPhrases.isLocal) {
        cy.setupWallet({
          secretWords: mnemonics.user1,
          walletName: 'user1',
        });
      } else {
        const walletAddress = {
          value: null,
        };
        cy.setupWallet({
          createNewWallet: true,
          walletName: 'my created wallet',
        });
        cy.origin('https://wallet.agoric.app/', () => {
          cy.visit('/wallet/');

          cy.get('input[type="checkbox"]').click();
          cy.contains('Proceed').click();
        });
        cy.acceptAccess();

        cy.origin('https://wallet.agoric.app/', () => {
          cy.visit('/wallet/');

          cy.contains(/agoric.{39}/).spread(element => {
            return element.innerHTML.match(/agoric.{39}/)[0];
          });
        }).then(address => {
          walletAddress.value = address;
        });
        cy.origin(
          'https://emerynet.faucet.agoric.net',
          { args: { walletAddress } },
          ({ walletAddress }) => {
            cy.visit('/');
            cy.get('[id="address"]').first().type(walletAddress.value);
            cy.get('[type="submit"]').first().click();
            cy.get('body').contains('success').should('exist');

            cy.visit('/');
            cy.get('[id="address"]').first().type(walletAddress.value);
            cy.get('[type="radio"][value="client"]').click();
            cy.get('[type="submit"]').first().click();
            cy.get('body').contains('success').should('exist');
          },
        );
      }
    });

    // eslint-disable-next-line ui-testing/missing-assertion-in-test
    it('should connect with the wallet', () => {
      cy.visit('/');

      if (!networkPhrases.isLocal) {
        cy.contains('button', 'Dismiss').click();
        cy.get('button').contains('Local Network').click();
        cy.get('button').contains(networkPhrases.interNetwork).click();
        cy.get('button').contains('Keep using Old Version').click();
      }

      cy.contains('Connect Wallet').click();

      cy.acceptAccess();
      cy.get('label input[type="checkbox"]').check();
      cy.contains('Proceed').click();

      cy.acceptAccess();
    });

    it('should create a new vault and approve the transaction successfully', () => {
      cy.visit('/');
      if (!networkPhrases.isLocal)
        cy.get('button').contains('Keep using Old Version').click();

      if (networkPhrases.isLocal)
        cy.contains('button', 'Add new vault').click();

      cy.contains('button', /ATOM/).click();

      cy.contains('ATOM to lock up *')
        .next()
        .within(() => {
          cy.get('input[type="number"]').click();
          cy.get('input[type="number"]').clear();
          cy.get('input[type="number"]').type(10); // 2 in local
        });

      cy.contains('button', 'Create Vault').click();

      cy.confirmTransaction().then(taskCompleted => {
        expect(taskCompleted).to.be.true;
        cy.contains(
          'p',
          'You can manage your vaults from the "My Vaults" view.',
          { timeout: MINUTE_MS },
        ).should('exist');
        cy.contains('Manage my Vaults').click();
      });
    });

    it('should open the new vault', () => {
      cy.get('span')
        .contains(/My Vaults.*\(\d+\)/)
        .children()
        .first()
        .spread(element => {
          // Get the total number of vaults present
          const vaultCountRegex = element.innerHTML.match(/\((\d+)\)/);
          const vaultCount = Number(vaultCountRegex[1]);

          cy.findAllByText(/#\d+/)
            .should('have.length', vaultCount)
            .spread((...vaults) => {
              expect(
                vaults.filter(vaultNo => !/^#\d+$/.test(vaultNo.innerHTML)),
              ).to.be.empty;
              // Get the vault with the latest ID number and click on it
              const vaultIds = vaults.map(v => Number(v.innerHTML.slice(1)));
              const latestId = Math.max(...vaultIds);
              cy.findByText(`#${latestId}`).click();
            });
        });
    });

    it('should adjust the collateral by performing a withdrawl and approve the transaction successfully', () => {
      cy.contains('div', 'Adjust Collateral')
        .next('.grid-cols-2')
        .within(() => {
          cy.contains('button', /^(Deposit|Withdraw|No Action)$/).click();
          cy.contains('button', 'Withdraw').click();
          cy.contains('.input-label', 'Amount')
            .next('.input-wrapper')
            .within(() => {
              cy.get('input[type="number"]').click();
              cy.get('input[type="number"]').type(1); // 5 in local
            });
        });

      cy.contains('button', 'Adjust Vault').click();
      cy.confirmTransaction().then(taskCompleted => {
        expect(taskCompleted).to.be.true;
        cy.contains('p', "Your vault's balances have been updated.", {
          timeout: MINUTE_MS,
        }).should('exist');
        cy.contains('Adjust more').click();
      });
    });

    it('should adjust the collateral by depositing ATOM and approve the transaction successfully', () => {
      cy.contains('div', 'Adjust Collateral')
        .next('.grid-cols-2')
        .within(() => {
          cy.contains('button', /^(Deposit|Withdraw|No Action)$/).click();
          cy.contains('button', 'Deposit').click();

          cy.contains('.input-label', 'Amount')
            .next('.input-wrapper')
            .within(() => {
              cy.get('input[type="number"]').click();
              cy.get('input[type="number"]').type(1);
            });
        });

      cy.contains('button', 'Adjust Vault').click();
      cy.confirmTransaction().then(taskCompleted => {
        expect(taskCompleted).to.be.true;
        cy.contains('p', "Your vault's balances have been updated.", {
          timeout: MINUTE_MS,
        }).should('exist');
        cy.contains('Adjust more').click();
      });
    });

    it('should adjust the debt by minting more IST and approve the transaction successfully', () => {
      cy.contains('div', 'Adjust Debt')
        .next('.grid-cols-2')
        .within(() => {
          cy.contains('button', /^(Repay|Mint More|No Action)$/).click();
          cy.contains('button', 'Mint More').click();
          cy.contains('.input-label', 'Amount')
            .next('.input-wrapper')
            .within(() => {
              cy.get('input[type="number"]').click();
              cy.get('input[type="number"]').type(1);
            });
        });

      cy.contains('button', 'Adjust Vault').click();
      cy.confirmTransaction().then(taskCompleted => {
        expect(taskCompleted).to.be.true;
        cy.contains('p', "Your vault's balances have been updated.", {
          timeout: MINUTE_MS,
        }).should('exist');
        cy.contains('Adjust more').click();
      });
    });

    it('should adjust the debt by repaying and approve the transaction successfully', () => {
      cy.contains('div', 'Adjust Debt')
        .next('.grid-cols-2')
        .within(() => {
          cy.contains('button', /^(Repay|Mint More|No Action)$/).click();
          cy.contains('button', 'Repay').click();
          cy.contains('.input-label', 'Amount')
            .next('.input-wrapper')
            .within(() => {
              cy.get('input[type="number"]').click();
              cy.get('input[type="number"]').type(1);
            });
        });

      cy.contains('button', 'Adjust Vault').click();
      cy.confirmTransaction().then(taskCompleted => {
        expect(taskCompleted).to.be.true;
        cy.contains('p', "Your vault's balances have been updated.", {
          timeout: MINUTE_MS,
        }).should('exist');
        cy.contains('Adjust more').click();
      });
    });

    it('should close the vault and approve the transaction successfully', () => {
      cy.contains('Close Out Vault').click();
      cy.contains('button.bg-interPurple', 'Close Out Vault').click();

      cy.confirmTransaction().then(taskCompleted => {
        expect(taskCompleted).to.be.true;
      });
    });
  });
});
