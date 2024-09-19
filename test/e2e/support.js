import '@agoric/synpress/support/index';
import {
  networks,
  configMap,
  FACUET_HEADERS,
  agoricNetworks,
} from './test.utils';
import { makeMarshal, Far } from './unmarshal.js';

const AGORIC_NET = Cypress.env('AGORIC_NET') || 'local';
const network = AGORIC_NET !== 'local' ? 'testnet' : 'local';
const COMMAND_TIMEOUT = configMap[network].COMMAND_TIMEOUT;

const agops = '/usr/src/agoric-sdk/packages/agoric-cli/bin/agops';

Cypress.Commands.add('addKeys', params => {
  const { keyName, mnemonic, expectedAddress } = params;
  const command = `echo ${mnemonic} | agd keys add ${keyName} --recover --keyring-backend=test`;

  cy.exec(command, {
    failOnNonZeroExit: false,
  }).then(({ stdout }) => {
    expect(stdout).to.contain(expectedAddress);
  });
});

Cypress.Commands.add('setOraclePrice', price => {
  cy.exec(
    `${agops} oracle setPrice --keys gov1,gov2 --pair ATOM.USD --price ${price} --keyring-backend=test`,
    {
      env: { AGORIC_NET },
      timeout: COMMAND_TIMEOUT,
    },
  ).then(({ stdout }) => {
    expect(stdout).to.not.contain('Error');
    expect(stdout).to.not.contain('error');
  });
});

Cypress.Commands.add('createVault', params => {
  const { wantMinted, giveCollateral, userKey } = params;

  const createVaultCommand = `${agops} vaults open --wantMinted "${wantMinted}" --giveCollateral "${giveCollateral}" > /tmp/want-ist.json`;

  cy.exec(createVaultCommand, {
    env: { AGORIC_NET },
    timeout: COMMAND_TIMEOUT,
  }).then(({ stdout }) => {
    expect(stdout).not.to.contain('Error');

    const broadcastCommand = `${agops} perf satisfaction --executeOffer /tmp/want-ist.json --from "${userKey}" --keyring-backend=test`;

    cy.exec(broadcastCommand, {
      env: { AGORIC_NET },
      timeout: COMMAND_TIMEOUT,
    }).then(({ stdout }) => {
      expect(stdout).not.to.contain('Error');
    });
  });
});

Cypress.Commands.add('placeBidByPrice', params => {
  const { fromAddress, giveAmount, price } = params;
  const command = `${agops} inter bid by-price --from ${fromAddress} --give ${giveAmount} --price ${price} --keyring-backend=test`;

  cy.exec(command, {
    env: { AGORIC_NET },
    timeout: COMMAND_TIMEOUT,
    failOnNonZeroExit: false,
  }).then(({ stdout }) => {
    expect(stdout).to.contain('Your bid has been accepted');
  });
});

Cypress.Commands.add('placeBidByDiscount', params => {
  const { fromAddress, giveAmount, discount } = params;

  const command = `${agops} inter bid by-discount --from ${fromAddress} --give ${giveAmount} --discount ${discount} --keyring-backend=test`;

  cy.exec(command, {
    env: { AGORIC_NET },
    timeout: COMMAND_TIMEOUT,
    failOnNonZeroExit: false,
  }).then(({ stdout }) => {
    expect(stdout).to.contain('Your bid has been accepted');
  });
});

Cypress.Commands.add('verifyAuctionData', (propertyName, expectedValue) => {
  return cy
    .exec(`${agops} inter auction status`, {
      env: { AGORIC_NET },
      failOnNonZeroExit: false,
      timeout: COMMAND_TIMEOUT,
    })
    .then(({ stdout }) => {
      const output = JSON.parse(stdout);
      const propertyValue = Cypress._.get(output, propertyName);

      if (!propertyValue) {
        throw new Error(`Error: ${propertyName} property is missing or empty`);
      }

      expect(propertyValue).to.equal(expectedValue);
    });
});

const { fromCapData } = makeMarshal(undefined, (s, iface) =>
  Far(iface, { getSlot: () => s }),
);

Cypress.Commands.add('pauseOldAuctioneer', () => {
  const agopsOpts = {
    env: { AGORIC_NET },
    timeout: COMMAND_TIMEOUT,
  };
  const netConfig =
    AGORIC_NET === 'local'
      ? ''
      : `-B https://${AGORIC_NET}.agoric.net/network-config`;
  cy.exec(
    `agoric follow ${netConfig} -lF :published.agoricNames.instance -o text`,
  ).then(async ({ stdout }) => {
    cy.wait(1 * 60 * 1000);
    const byName = Object.fromEntries(fromCapData(JSON.parse(stdout)));
    cy.expect(byName).to.have.property('auctioneer');
    cy.task('info', `Object is: ${JSON.stringify(byName)}`);
    const auctioneer = byName.auctioneer;
    // cy.expect(byName).to.have.property('auctioneer175');
    const oldAuctioneer = byName.auctioneer175;

    cy.exec(
      `${agops} ec find-continuing-id --from gov1 --for 'charter member invitation'`,
      agopsOpts,
    ).then(({ stdout }) => {
      const acceptId = stdout.trim();
      cy.expect(acceptId).to.be.a('string');
      cy.expect(acceptId).to.have.length.of.at.least(2);

      const changeFile = '/tmp/proposeChange.json';
      cy.expect(acceptId).to.be.a('string');
      cy.expect(acceptId).to.have.length.of.at.least(2);
      cy.exec(
        `${agops} auctioneer proposeParamChange --charterAcceptOfferId ${acceptId} --start-frequency 100000000000000`,
        agopsOpts,
      ).then(({ stdout }) => {
        const offerSpec = JSON.parse(stdout);
        cy.expect(offerSpec.slots[0]).to.equal(auctioneer.getSlot());
        offerSpec.slots[0] = oldAuctioneer.getSlot();
        cy.writeFile(changeFile, JSON.stringify(offerSpec), 'utf8');

        const broadcastCommand = `${agops} perf satisfaction --executeOffer ${changeFile} --from gov1 --keyring-backend=test`;

        cy.exec(broadcastCommand, {
          env: { AGORIC_NET },
          timeout: COMMAND_TIMEOUT,
          failOnNonZeroExit: false, //@@@
        }).then(({ stdout, stderr }) => {
          console.log('@@broadcast', { stdout, stderr });
          expect(stdout).not.to.contain('Error');
        });

        cy.exec(`${agops} ec vote --send-from gov1 --forPosition 0`, agopsOpts);
        cy.exec(`${agops} ec vote --send-from gov2 --forPosition 0`, agopsOpts);
      });
    });
  });
});

Cypress.Commands.add('skipWhen', function (expression) {
  if (expression) {
    this.skip();
  }
});

const connectWalletLocalChain = ({ isVaultsTests = false }) => {
  cy.contains('Connect Wallet').click();

  if (isVaultsTests) {
    cy.acceptAccess().then(taskCompleted => {
      expect(taskCompleted).to.be.true;
    });
  }

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

  if (!isVaultsTests) {
    cy.acceptAccess().then(taskCompleted => {
      expect(taskCompleted).to.be.true;
    });
  }
};

const connectWalletTestnet = () => {
  cy.contains('button', 'Dismiss').click();
  cy.get('button').contains('Local Network').click();
  cy.get('button').contains(agoricNetworks[AGORIC_NET]).click();
  cy.get('body').then($body => {
    if ($body.find('button:contains("Keep using Old Version")').length > 0) {
      cy.get('button').contains('Keep using Old Version').click();
    }
  });

  cy.contains('Connect Wallet').click();

  cy.acceptAccess().then(taskCompleted => {
    expect(taskCompleted).to.be.true;
  });

  cy.get('label input[type="checkbox"]').check();
  cy.contains('Proceed').click();

  cy.acceptAccess().then(taskCompleted => {
    expect(taskCompleted).to.be.true;
  });
};

Cypress.Commands.add('connectWithWallet', (options = {}) => {
  const { isVaultsTests = false } = options;

  cy.visit('/');
  if (AGORIC_NET === networks.LOCAL) {
    connectWalletLocalChain({ isVaultsTests });
  } else {
    connectWalletTestnet();
  }
});

Cypress.Commands.add('provisionFromFaucet', (walletAddress, command) => {
  const TRANSACTION_STATUS = {
    FAILED: 1000,
    NOT_FOUND: 1001,
    SUCCESSFUL: 1002,
  };

  const getStatus = txHash =>
    cy
      .request({
        method: 'GET',
        url: `https://${AGORIC_NET}.faucet.agoric.net/api/transaction-status/${txHash}`,
      })
      .then(resp => {
        const { transactionStatus } = resp.body;
        if (transactionStatus === TRANSACTION_STATUS.NOT_FOUND)
          // eslint-disable-next-line cypress/no-unnecessary-waiting
          return cy.wait(2000).then(() => getStatus(txHash));
        else return cy.wrap(transactionStatus);
      });

  cy.request({
    body: {
      address: walletAddress,
      command,
      clientType: 'SMART_WALLET',
    },
    followRedirect: false,
    headers: FACUET_HEADERS,
    method: 'POST',
    url: `https://${AGORIC_NET}.faucet.agoric.net/go`,
  })
    .then(resp =>
      getStatus(/\/transaction-status\/(.*)/.exec(resp.headers.location)[1]),
    )
    .then(status => expect(status).to.eq(TRANSACTION_STATUS.SUCCESSFUL));
});

afterEach(function () {
  if (this.currentTest.state === 'failed') {
    const testName = this.currentTest.title;
    const errorMessage = this.currentTest.err.message;
    cy.task('info', `Test "${testName}" failed with error: ${errorMessage}`);
  }
});
