/* eslint-disable ui-testing/no-disabled-tests */

describe('Keplr', () => {
  context('Test commands', () => {
    let collateralizationRatio;
    it(`should setup Keplr account and connect with the wallet on inter dapp`, () => {
      cy.setupWallet().then(setupFinished => {
        expect(setupFinished).to.be.true;

        cy.visit('localhost:3001');

        cy.acceptAccess().then(taskCompleted => {
          expect(taskCompleted).to.be.true;
          cy.visit('localhost:3001/wallet');

          cy.get('input.PrivateSwitchBase-input').click();
          cy.contains('Proceed').click();

          cy.get('button[aria-label="Settings"]').click();

          cy.get('#demo-simple-select').click();
          cy.get('li[data-value="local"]').click();
          cy.contains('button', 'Connect').click();

          cy.acceptAccess().then(taskCompleted => {
            expect(taskCompleted).to.be.true;
            cy.visit('/');

            cy.contains('Connect Wallet').click();
            cy.get('label.cursor-pointer input[type="checkbox"]').check();
            cy.contains('Proceed').click();

            cy.acceptAccess().then(taskCompleted => {
              expect(taskCompleted).to.be.true;
              cy.acceptAccess().then(taskCompleted => {
                expect(taskCompleted).to.be.true;
              });
            });
          });
        });
      });
    });

    it('should adjust the collateral by depositing ATOM and approve the transaction successfully', () => {
      cy.visit('/');

      cy.contains('div', /ATOM.*#5/).click();

      cy.contains('div', 'Adjust Collateral')
        .next('.grid-cols-2')
        .within(() => {
          cy.contains('button', /^(Deposit|Withdraw|No Action)$/).click();
          cy.contains('button', 'Deposit').click();
          cy.contains('.input-label', 'Amount')
            .next('.input-wrapper')
            .find('input[type="number"]')
            .click()
            .type(5);
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

    it('should adjust the collateral by performing a withdrawl and approve the transaction successfully', () => {
      cy.contains('div', 'Adjust Collateral')
        .next('.grid-cols-2')
        .within(() => {
          cy.contains('button', /^(Deposit|Withdraw|No Action)$/).click();
          cy.contains('button', 'Withdraw').click();
          cy.contains('.input-label', 'Amount')
            .next('.input-wrapper')
            .find('input[type="number"]')
            .click()
            .type(5);
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
            .find('input[type="number"]')
            .click()
            .type(5);
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
            .find('input[type="number"]')
            .click()
            .type(5);
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

    it('should not close a vault because of insufficient IST to repay the debt', () => {
      cy.contains('Close Out Vault').click();

      cy.contains('button.bg-interPurple', 'Close Out Vault').click();

      cy.confirmTransaction().then(taskCompleted => {
        expect(taskCompleted).to.be.true;

        cy.get('.Toastify__toast-body').should('exist');
        cy.get('.Toastify__toast-body').should(
          'contain',
          'Offer failed: Error: cannot grab',
        );
      });
    });

    it('should create a new vault and approve the transaction successfully', () => {
      cy.visit('/');
      cy.contains('button', 'Add new vault').click();
      cy.contains('button', /ATOM/).click();

      cy.contains('.input-label', 'ATOM to lock up *')
        .next()
        .find('input[type="number"]')
        .click()
        .clear()
        .type(5);

      cy.get('tr')
        .contains('td', /^Collateralization Ratio$/)
        .siblings('td.text-right.font-black')
        .invoke('text')
        .then(value => {
          collateralizationRatio = value.trim();
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

    it('should close the vault and approve the transaction successfully', () => {
      cy.visit('/');

      cy.get('tr.leading-7')
        .contains('td.text-right.font-black', collateralizationRatio)
        .prev('td.text-left')
        .should('contain', 'Collateralization Ratio')
        .parent('tr')
        .click();

      cy.contains('Close Out Vault').click();
      cy.contains('button.bg-interPurple', 'Close Out Vault').click();

      cy.confirmTransaction().then(taskCompleted => {
        expect(taskCompleted).to.be.true;
      });
    });
  });
});
