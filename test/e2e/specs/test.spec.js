import { mnemonics } from '../test.utils';
describe('Vaults UI Test Cases', () => {
  context('Test commands', () => {
    it('should set up wallet', () => {
      // Using exports from the synthetic-chain lib instead of hardcoding mnemonics UNTIL https://github.com/Agoric/agoric-3-proposals/issues/154
      cy.setupWallet({
        secretWords: mnemonics.user1,
        walletName: 'user1',
      }).then(taskCompleted => {
        expect(taskCompleted).to.be.true;
      });
    });

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

    it('should create a new vault and approve the transaction successfully', () => {
      cy.visit('/');
      cy.contains('button', /ATOM/).click();

      cy.contains('ATOM to lock up *')
        .next()
        .within(() => {
          cy.get('input[type="number"]').click();
          cy.get('input[type="number"]').clear();
          cy.get('input[type="number"]').type(10);
        });

      cy.contains('button', 'Create Vault').click();

      cy.confirmTransaction().then(taskCompleted => {
        expect(taskCompleted).to.be.true;
        cy.contains(
          'p',
          'You can manage your vaults from the "My Vaults" view.',
        ).should('exist');
      });
      cy.get('label.cursor-pointer input[type="checkbox"]').check();
      cy.contains('Proceed').click();

      cy.acceptAccess();
    });

    it('should adjust the collateral by performing a withdrawl and approve the transaction successfully', () => {
      cy.contains('button', 'Manage my Vaults').click();
      cy.contains('button', 'Back to vaults').click();
      cy.contains('div', /ATOM.*#8/).click();

      cy.contains('div', 'Adjust Collateral')
        .next('.grid-cols-2')
        .within(() => {
          cy.contains('button', /^(Deposit|Withdraw|No Action)$/).click();
          cy.contains('button', 'Withdraw').click();
          cy.contains('.input-label', 'Amount')
            .next('.input-wrapper')
            .within(() => {
              cy.get('input[type="number"]').click();
              cy.get('input[type="number"]').type(5);
            });
        });

      cy.contains('button', 'Adjust Vault').click();
      cy.confirmTransaction().then(taskCompleted => {
        expect(taskCompleted).to.be.true;
        cy.contains('p', "Your vault's balances have been updated.").should(
          'exist',
        );
        cy.contains('Back to my vaults').click();
      });
    });

    it('should create a new vault and approve the transaction successfully', () => {
      cy.visit('/');

      cy.contains('button', 'Add new vault').click();
      cy.contains('button', /ATOM/).click();

      cy.contains('.input-label', 'ATOM to lock up *')
        .next()
        .within(() => {
          cy.get('input[type="number"]').click();
          cy.get('input[type="number"]').clear();
          cy.get('input[type="number"]').type(2);
        });

      cy.contains('button', 'Create Vault').click();

      cy.confirmTransaction().then(taskCompleted => {
        expect(taskCompleted).to.be.true;
        cy.contains(
          'p',
          'You can manage your vaults from the "My Vaults" view.',
        ).should('exist');
      });
    });

    it('should open the new vault', () => {
      cy.visit('/');
      cy.get('span')
        .contains(/My Vaults.*\(\d+\)/)
        .children()
        .first()
        .spread((...element) => {
          // Get the total number of vaults present
          const vaultCount = Number(element[0].innerHTML.slice(2, -1));

          cy.get('div.shadow-card div.text-secondary:contains("#")')
            .should('have.length', vaultCount)
            .spread((...vaults) => {
              // Get the vault with the largest number and click on it
              const maxValue = vaults.reduce(
                (maxValue, currentValueRaw) => {
                  const currentValue = Number(
                    currentValueRaw.innerHTML.slice(1),
                  );
                  return currentValue > maxValue ? currentValue : maxValue;
                },
                Number(vaults[0].innerHTML.slice(1)),
              );
              cy.get(
                `div.shadow-card div.text-secondary:contains("#${maxValue}")`,
              ).click();
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
              cy.get('input[type="number"]').type(1);
            });
        });

      cy.contains('button', 'Adjust Vault').click();
      cy.confirmTransaction().then(taskCompleted => {
        expect(taskCompleted).to.be.true;
        cy.contains('p', "Your vault's balances have been updated.").should(
          'exist',
        );
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
        cy.contains('p', "Your vault's balances have been updated.").should(
          'exist',
        );
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
        cy.contains('p', "Your vault's balances have been updated.").should(
          'exist',
        );
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
        cy.contains('p', "Your vault's balances have been updated.").should(
          'exist',
        );
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
