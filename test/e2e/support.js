import '@agoric/synpress/support/index';
import { accountAddresses } from './test.utils';

Cypress.Commands.add('addKeys', params => {
  const { keyName, mnemonic, expectedAddress } = params;
  const command = `
    expect -c "
      spawn agd keys add ${keyName} --recover --keyring-backend=test
      expect {
          \\"override\\" {
              send \\"y\\r\\"
              exp_continue
          }
          \\"Enter your bip39 mnemonic\\" {
              send \\"${mnemonic}\\r\\"
              exp_continue
          }
      }
      expect eof
    "
  `;

  cy.exec(command).then(({ stdout }) => {
    expect(stdout).to.contain(expectedAddress);
  });
});

Cypress.Commands.add('setOraclePrice', price => {
  cy.exec(
    `agops oracle setPrice --keys gov1,gov2 --pair ATOM.USD --price ${price} --keyring-backend=test`,
  ).then(({ stdout }) => {
    expect(stdout).to.not.contain('Error');
    expect(stdout).to.not.contain('error');
  });
});

Cypress.Commands.add('createVault', params => {
  const { wantMinted, giveCollateral, userType = 'user1' } = params;

  const accountAddress =
    userType === 'user1' ? accountAddresses.user1 : accountAddresses.gov1;

  const createVaultCommand = `agops vaults open --wantMinted "${wantMinted}" --giveCollateral "${giveCollateral}" > /tmp/want-ist.json`;

  cy.exec(createVaultCommand).then(({ stdout }) => {
    expect(stdout).not.to.contain('Error');

    const broadcastCommand = `agops perf satisfaction --executeOffer /tmp/want-ist.json --from "${accountAddress}" --keyring-backend=test`;

    cy.exec(broadcastCommand).then(({ stdout }) => {
      expect(stdout).not.to.contain('Error');
    });
  });
});

Cypress.Commands.add('placeBidByPrice', params => {
  const { fromAddress, giveAmount, price } = params;
  const command = `agops inter bid by-price --from ${fromAddress} --give ${giveAmount} --price ${price} --keyring-backend=test`;

  cy.exec(command, { env: { AGORIC_NET } }).then(({ stdout }) => {
    expect(stdout).to.contain('Your bid has been accepted');
  });
});

Cypress.Commands.add('placeBidByDiscount', params => {
  const { fromAddress, giveAmount, discount } = params;

  const command = `agops inter bid by-discount --from ${fromAddress} --give ${giveAmount} --discount ${discount} --keyring-backend=test`;

  cy.exec(command, { env: { AGORIC_NET } }).then(({ stdout }) => {
    expect(stdout).to.contain('Your bid has been accepted');
  });
});
