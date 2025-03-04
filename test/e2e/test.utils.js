export const mnemonics = {
  user1:
    'tackle hen gap lady bike explain erode midnight marriage wide upset culture model select dial trial swim wood step scan intact what card symptom',
  gov1: 'such field health riot cost kitten silly tube flash wrap festival portion imitate this make question host bitter puppy wait area glide soldier knee',
  gov2: 'physical immune cargo feel crawl style fox require inhale law local glory cheese bring swear royal spy buyer diesel field when task spin alley',
  validator:
    'soap hub stick bomb dish index wing shield cruel board siren force glory assault rotate busy area topple resource okay clown wedding hint unhappy',
};

export const accountAddresses = {
  user1: 'agoric1ydzxwh6f893jvpaslmaz6l8j2ulup9a7x8qvvq',
  gov1: 'agoric1ee9hr0jyrxhy999y755mp862ljgycmwyp4pl7q',
  gov2: 'agoric1wrfh296eu2z34p6pah7q04jjuyj3mxu9v98277',
  validator: 'agoric1estsewt6jqsx77pwcxkn5ah0jqgu8rhgflwfdl',
};

export const webWalletURL = 'https://wallet.agoric.app/';
export const MINUTE_MS = 1 * 60 * 1000;
export const QUICK_WAIT_LOCAL = 10 * 1000;
export const QUICK_WAIT_TESTNET = 20 * 1000;
export const THIRTY_SECONDS = 30 * 1000;

export const agoricNetworks = {
  emerynet: 'Agoric Emerynet',
  devnet: 'Agoric Devnet',
  ollinet: 'Agoric Ollinet',
  xnet: 'Agoric Xnet',
};

export const networks = {
  EMERYNET: 'emerynet',
  LOCAL: 'local',
  DEVNET: 'devnet',
};

export const webWalletSelectors = {
  emerynet: 'Emerynet',
  devnet: 'Devnet',
  local: 'Local',
};

export const configMap = {
  emerynet: {
    DEFAULT_TIMEOUT: 3 * 60 * 1000,
    DEFAULT_TASK_TIMEOUT: 3 * 60 * 1000,
    LIQUIDATING_TIMEOUT: 13 * 60 * 1000,
    LIQUIDATED_TIMEOUT: 5 * 60 * 1000,
    COMMAND_TIMEOUT: 6 * 60 * 1000,
    bidderMnemonic: mnemonics.validator,
    bidderAddress: accountAddresses.validator,
    bidderWalletName: 'bidder',
    gov1Mnemonic: mnemonics.gov1,
    gov1Address: accountAddresses.gov1,
    gov1WalletName: 'gov1',
    gov2Mnemonic: mnemonics.gov2,
    gov2Address: accountAddresses.gov2,
    gov2WalletName: 'gov2',
    econGovURL: `https://econ-gov.inter.trade/?agoricNet=${Cypress.env('AGORIC_NET')}`,
    auctionURL: `https://${Cypress.env('AGORIC_NET')?.trim()}.api.agoric.net/agoric/vstorage/data/published.auction.book0`,
    reserveURL: `https://${Cypress.env('AGORIC_NET')?.trim()}.api.agoric.net/agoric/vstorage/data/published.reserve.metrics`,
  },
  testnet: {
    DEFAULT_TIMEOUT: 3 * 60 * 1000,
    DEFAULT_TASK_TIMEOUT: 3 * 60 * 1000,
    LIQUIDATING_TIMEOUT: 13 * 60 * 1000,
    LIQUIDATED_TIMEOUT: 5 * 60 * 1000,
    COMMAND_TIMEOUT: 6 * 60 * 1000,
    bidderMnemonic: Cypress.env('BIDDER_MNEMONIC'),
    bidderAddress: Cypress.env('BIDDER_ADDRESS'),
    bidderWalletName: 'bidder',
    gov1Mnemonic: Cypress.env('GOV1_MNEMONIC'),
    gov1Address: Cypress.env('GOV1_ADDRESS'),
    gov1WalletName: 'gov1',
    gov2Mnemonic: Cypress.env('GOV2_MNEMONIC'),
    gov2Address: Cypress.env('GOV2_ADDRESS'),
    gov2WalletName: 'gov2',
    econGovURL: `https://econ-gov.inter.trade/?agoricNet=${Cypress.env('AGORIC_NET')}`,
    auctionURL: `https://${Cypress.env('AGORIC_NET')?.trim()}.api.agoric.net/agoric/vstorage/data/published.auction.book0`,
    reserveURL: `https://${Cypress.env('AGORIC_NET')?.trim()}.api.agoric.net/agoric/vstorage/data/published.reserve.metrics`,
  },
  local: {
    DEFAULT_TIMEOUT: 1 * 60 * 1000,
    DEFAULT_TASK_TIMEOUT: 1 * 60 * 1000,
    LIQUIDATING_TIMEOUT: 20 * 60 * 1000,
    LIQUIDATED_TIMEOUT: 10 * 60 * 1000,
    COMMAND_TIMEOUT: 2 * 60 * 1000,
    user1Mnemonic: mnemonics.user1,
    user1Address: accountAddresses.user1,
    bidderMnemonic: mnemonics.gov1,
    bidderAddress: accountAddresses.gov1,
    bidderWalletName: 'gov1',
    gov1Mnemonic: mnemonics.gov1,
    gov1Address: accountAddresses.gov1,
    gov1WalletName: 'gov1',
    gov2Mnemonic: mnemonics.gov2,
    gov2Address: accountAddresses.gov2,
    gov2WalletName: 'gov2',
    econGovURL: 'https://econ-gov.inter.trade/?agoricNet=local',
    auctionURL:
      'http://localhost:1317/agoric/vstorage/data/published.auction.book0',
    reserveURL: `http://localhost:1317/agoric/vstorage/data/published.reserve.metrics`,
  },
};

export const FACUET_HEADERS = {
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Content-Type': 'application/x-www-form-urlencoded',
};

const COMMON_DENOMS = {
  IST: 'uist',
  BLD: 'ubld',
};

export const ATOM_DENOMS = {
  local: 'ibc/BA313C4A19DFBF943586C0387E6B11286F9E416B4DD27574E6909CABE0E342FA',
  emerynet:
    'ibc/06362C6F7F4FB702B94C13CD2E7C03DEC357683FD978936340B43FBFBC5351EB',
  devnet: 'ibc/toyatom',
  xnet: 'ibc/06362C6F7F4FB702B94C13CD2E7C03DEC357683FD978936340B43FBFBC5351EB',
};

export const DENOMS = {
  ATOM: ATOM_DENOMS,
  IST: {
    local: COMMON_DENOMS.IST,
    emerynet: COMMON_DENOMS.IST,
    devnet: COMMON_DENOMS.IST,
    xnet: COMMON_DENOMS.IST,
  },
  BLD: {
    local: COMMON_DENOMS.BLD,
    emerynet: COMMON_DENOMS.BLD,
    devnet: COMMON_DENOMS.BLD,
    xnet: COMMON_DENOMS.BLD,
  },
};

export const tokens = {
  ATOM: 'ATOM',
  IST: 'IST',
  BLD: 'BLD',
};

export const extractNumber = expectedValue => {
  const match = expectedValue.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
};
