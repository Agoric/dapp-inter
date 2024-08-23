import { webWalletURL } from '../test.utils';

describe('Wallet App Test Cases', () => {
  let a;
  let b;
  context('Setting up accounts', () => {
    it('should set up bidder wallet', () => {
      cy.setupWallet({
        secretWords:
          'eager disorder volcano purpose cross doll proud drama fetch loyal front elegant join crew sausage super zero search defy remove recycle resemble sadness shiver',
        walletName: 'bidder2',
      }).then(taskCompleted => {
        expect(taskCompleted).to.be.true;
      });
    });
    it('should setup the web wallet', () => {
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

  
    it('test', () => {
      cy.reloadAndWaitForWebWalletToBecomeStable();
      cy.getTokenAmountByLabel('ATOM').then(amount => {
        cy.task('info', `The extracted amount is: ${amount}`);
        a = amount;
      });
    });

    it('test ii', () => {
      cy.reloadAndWaitForWebWalletToBecomeStable();
      cy.getTokenAmountByLabel('ATOM').then(amount => {
        cy.task('info', `The extracted amount is: ${amount}`);
        b = amount;
        expect(b - a).to.be.at.least(0);
      });
    });
  });
});
