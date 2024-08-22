export const mnemonics = {
  user1:
    'tackle hen gap lady bike explain erode midnight marriage wide upset culture model select dial trial swim wood step scan intact what card symptom',
  gov1: 'such field health riot cost kitten silly tube flash wrap festival portion imitate this make question host bitter puppy wait area glide soldier knee',
  gov2: 'physical immune cargo feel crawl style fox require inhale law local glory cheese bring swear royal spy buyer diesel field when task spin alley',
};

export const accountAddresses = {
  user1: 'agoric1ydzxwh6f893jvpaslmaz6l8j2ulup9a7x8qvvq',
  gov1: 'agoric1ee9hr0jyrxhy999y755mp862ljgycmwyp4pl7q',
  gov2: 'agoric1wrfh296eu2z34p6pah7q04jjuyj3mxu9v98277',
};

export const webWalletURL = 'https://wallet.agoric.app/';
export const MINUTE_MS = 1 * 60 * 1000;

export const phrasesList = {
  emerynet: {
    interNetwork: 'Agoric Emerynet',
    isLocal: false,
  },
  local: {
    interNetwork: 'Local Network',
    isLocal: true,
  },
};

export const networks = {
  EMERYNET: 'emerynet',
  LOCAL: 'local',
};

export const configMap = {
  emerynet: {
    DEFAULT_TIMEOUT: 3 * 60 * 1000,
    DEFAULT_TASK_TIMEOUT: 3 * 60 * 1000,
    LIQUIDATING_TIMEOUT: 13 * 60 * 1000,
    LIQUIDATED_TIMEOUT: 5 * 60 * 1000,
    COMMAND_TIMEOUT: 6 * 60 * 1000,
    user1Mnemonic:
      Cypress.env('USER1_MNEMONIC_INPUT') || Cypress.env('USER1_MNEMONIC'),
    user1Address:
      Cypress.env('USER1_ADDRESS_INPUT') || Cypress.env('USER1_ADDRESS'),
    // Bidder 1
    bidder1Mnemonic:
      Cypress.env('BIDDER1_MNEMONIC_INPUT') || Cypress.env('BIDDER1_MNEMONIC'),
    bidder1Address:
      Cypress.env('BIDDER1_ADDRESS_INPUT') || Cypress.env('BIDDER1_ADDRESS'),
    bidder1WalletName: 'bidder1',
    // Bidder 2
    bidder2Mnemonic:
      Cypress.env('BIDDER2_MNEMONIC_INPUT') || Cypress.env('BIDDER2_MNEMONIC'),
    bidder2Address:
      Cypress.env('BIDDER2_ADDRESS_INPUT') || Cypress.env('BIDDER2_ADDRESS'),
    bidder2WalletName: 'bidder2',
    // Bidder 3
    bidder3Mnemonic:
      Cypress.env('BIDDER3_MNEMONIC_INPUT') || Cypress.env('BIDDER3_MNEMONIC'),
    bidder3Address:
      Cypress.env('BIDDER3_ADDRESS_INPUT') || Cypress.env('BIDDER3_ADDRESS'),
    bidder3WalletName: 'bidder3',
    gov1Mnemonic: Cypress.env('GOV1_MNEMONIC'),
    gov1Address: Cypress.env('GOV1_ADDRESS'),
    gov1WalletName: 'emerynetGov1',
    gov2Mnemonic: Cypress.env('GOV2_MNEMONIC'),
    gov2Address: Cypress.env('GOV2_ADDRESS'),
    gov2WalletName: 'emerynetGov2',
    econGovURL: 'https://econ-gov.inter.trade/?agoricNet=emerynet',
  },
  local: {
    DEFAULT_TIMEOUT: 1 * 60 * 1000,
    DEFAULT_TASK_TIMEOUT: 1 * 60 * 1000,
    LIQUIDATING_TIMEOUT: 20 * 60 * 1000,
    LIQUIDATED_TIMEOUT: 10 * 60 * 1000,
    COMMAND_TIMEOUT: 2 * 60 * 1000,
    user1Mnemonic: mnemonics.user1,
    user1Address: accountAddresses.user1,
    bidder1Mnemonic: mnemonics.gov1,
    bidder1Address: accountAddresses.gov1,
    bidder1WalletName: 'gov1',
    gov1Mnemonic: mnemonics.gov1,
    gov1Address: accountAddresses.gov1,
    gov1WalletName: 'gov1',
    gov2Mnemonic: mnemonics.gov2,
    gov2Address: accountAddresses.gov2,
    gov2WalletName: 'gov2',
    econGovURL: 'https://econ-gov.inter.trade/?agoricNet=local',
  },
};

export const FACUET_URL = 'https://emerynet.faucet.agoric.net/go';

export const FACUET_HEADERS = {
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Content-Type': 'application/x-www-form-urlencoded',
};
