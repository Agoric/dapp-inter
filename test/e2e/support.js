import '@agoric/synpress/support/index';
import {
  networks,
  configMap,
  FACUET_HEADERS,
  agoricNetworks,
  DENOMS,
} from './test.utils';

const AGORIC_NET = Cypress.env('AGORIC_NET') || 'local';
const network = AGORIC_NET !== 'local' ? 'testnet' : 'local';
const balanceUrl =
  AGORIC_NET !== 'local'
    ? `https://${AGORIC_NET}.api.agoric.net/cosmos/bank/v1beta1/balances/`
    : 'http://localhost:1317/cosmos/bank/v1beta1/balances/';
const COMMAND_TIMEOUT = configMap[network].COMMAND_TIMEOUT;

const agops = '/usr/src/agoric-sdk/packages/agoric-cli/bin/agops';

Cypress.Commands.add('addKeys', params => {
  const { keyName, mnemonic, expectedAddress } = params;
  const command = `echo ${mnemonic} | agd keys add ${keyName} --recover --keyring-backend=test`;

  cy.exec(command, {
    failOnNonZeroExit: false,
  }).then(({ stdout, stderr }) => {
    if (stderr && !stdout) {
      cy.task('error', `STDERR: ${stderr}`);
      throw Error(stderr);
    }
    cy.task('info', `STDOUT: ${stdout}`);
    expect(stdout).to.contain(expectedAddress);
  });
});

Cypress.Commands.add('setOraclePrice', price => {
  cy.exec(
    `${agops} oracle setPrice --keys gov1,gov2 --pair ATOM.USD --price ${price}  --keyring-backend=test`,
    {
      env: { AGORIC_NET },
      timeout: COMMAND_TIMEOUT,
    },
  ).then(({ stdout, stderr }) => {
    cy.task('info', `STDOUT: ${stdout}`);
    cy.task('info', `STDERR: ${stderr}`);
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
    }).then(({ stdout, stderr }) => {
      if (stderr && !stdout) {
        cy.task('error', `STDERR: ${stderr}`);
        throw Error(stderr);
      }
      cy.task('info', `STDOUT: ${stdout}`);
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
  }).then(({ stdout, stderr }) => {
    if (stderr && !stdout) {
      cy.task('error', `STDERR: ${stderr}`);
      throw Error(stderr);
    }
    cy.task('info', `STDOUT: ${stdout}`);
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
  }).then(({ stdout, stderr }) => {
    if (stderr && !stdout) {
      cy.task('error', `STDERR: ${stderr}`);
      throw Error(stderr);
    }
    cy.task('info', `STDOUT: ${stdout}`);
    expect(stdout).to.contain('Your bid has been accepted');
  });
});

Cypress.Commands.add('getAuctionParam', propertyName => {
  return cy
    .exec(`${agops} inter auction status`, {
      env: { AGORIC_NET },
      failOnNonZeroExit: false,
      timeout: COMMAND_TIMEOUT,
    })
    .then(({ stdout, stderr }) => {
      if (stderr && !stdout) {
        cy.task('error', `STDERR: ${stderr}`);
        throw Error(stderr);
      }
      cy.task('info', `STDOUT: ${stdout}`);

      const output = JSON.parse(stdout)['book0'];
      cy.task('info', `book0: ${JSON.stringify(output)}`);

      const propertyValue = output[propertyName];

      if (!propertyValue) {
        throw new Error(`Error: ${propertyName} property is missing or empty`);
      }

      cy.task('info', `${propertyName}: ${propertyValue}`);

      cy.wrap(propertyValue);
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

Cypress.Commands.add('fetchVStorageData', params => {
  const { url, field, latest = false } = params;
  cy.request(url).then(response => {
    expect(response.status).to.eq(200);
    cy.task('info', `Data fetched successfully for ${field}`);

    const data = JSON.parse(response.body.value);
    cy.task('info', `VStorage Data: ${JSON.stringify(data)}`);

    const arr = data.values.map((value, _) => {
      const parsedValue = JSON.parse(value);
      const body = JSON.parse(parsedValue.body.slice(1));
      return body[`${field}`];
    });

    cy.task('info', `Filtered Data: ${JSON.stringify(arr)}`);

    if (latest) {
      return cy.wrap(arr.at(-1));
    }

    cy.wrap(arr);
  });
});

Cypress.Commands.add(
  'calculateRatios',
  (data, options = { hasDenom: true, useValue: false }) => {
    cy.wrap(
      data.map(item => {
        if (item !== null && item !== undefined) {
          const numerValue = options.useValue
            ? Number(item.value.replace('+', ''))
            : item.numerator
              ? Number(item.numerator.value.replace('+', ''))
              : 0;

          const denomValue =
            options.hasDenom && item.denominator
              ? Number(item.denominator.value.replace('+', ''))
              : 1_000_000;

          const ratio = numerValue / denomValue;
          return ratio;
        }

        return item;
      }),
    );
  },
);

Cypress.Commands.add('getTokenBalance', ({ walletAddress, token }) => {
  const validTokens = Object.keys(DENOMS);
  if (!validTokens.includes(token)) {
    throw new Error(
      `Invalid token. Allowed values are: ${validTokens.join(', ')}`,
    );
  }

  const tokenDenom = DENOMS[token][AGORIC_NET];
  cy.task('info', `Querying balance for ${token} using denom: ${tokenDenom}`);

  cy.request(`${balanceUrl}/${walletAddress}`).then(response => {
    expect(response.status).to.eq(200);
    cy.task(
      'info',
      `Balances fetched successfully for wallet: ${walletAddress}`,
    );

    const balancesArr = response.body?.balances;
    if (!balancesArr || !Array.isArray(balancesArr)) {
      throw new Error('Balances array is missing or invalid');
    }

    cy.task('info', `Fetched Balances: ${JSON.stringify(balancesArr)}`);

    const tokenBalance = balancesArr.find(
      balance => balance.denom === tokenDenom,
    );

    if (!tokenBalance) {
      throw new Error(`${token} balance not found for denom: ${tokenDenom}`);
    }

    cy.task('info', `${token} Balance: ${JSON.stringify(tokenBalance)}`);

    const tokenBalanceNormalized = Number(tokenBalance.amount) / 1_000_000;
    cy.task('info', `Normalized ${token} Balance: ${tokenBalanceNormalized}`);

    cy.wrap(tokenBalanceNormalized);
  });
});

let shouldSkip = false;

beforeEach(function () {
  if (shouldSkip) {
    throw new Error(
      'Test skipped: user1 or bidder do not have sufficient balance.',
    );
  }
});

afterEach(function () {
  if (this.currentTest.state === 'failed') {
    const testName = this.currentTest.title;
    const errorMessage = this.currentTest.err.message;

    if (
      [
        'verify user1 balance is sufficient to create 3 vaults',
        'verify bidder balance is sufficient to place 3 bids',
      ].includes(testName)
    ) {
      shouldSkip = true;
    }

    cy.task('error', `Test "${testName}" failed with error: ${errorMessage}`);
  }
});
