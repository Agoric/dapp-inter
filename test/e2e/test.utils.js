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

export const LIQUIDATING_TIMEOUT = 20 * 60 * 1000;
export const LIQUIDATED_TIMEOUT = 10 * 60 * 1000;
export const MINUTE_MS = 60000;

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
export const econGovURL = 'https://econ-gov.inter.trade/?agoricNet=local';

export const AGORIC_NET = Cypress.env('AGORIC_NET') || 'local';

export const user1Mnemonic =
  AGORIC_NET === networks.LOCAL
    ? mnemonics.user1
    : Cypress.env('CYPRESS_USER1_MNEMONIC');
export const user1Address =
  AGORIC_NET === networks.LOCAL
    ? accountAddresses.user1
    : Cypress.env('CYPRESS_USER1_ADDRESS');

export const bidderMnemonic =
  AGORIC_NET === networks.LOCAL
    ? mnemonics.gov1
    : Cypress.env('CYPRESS_BIDDER_MNEMONIC');
export const bidderAddress =
  AGORIC_NET === networks.LOCAL
    ? accountAddresses.gov1
    : Cypress.env('CYPRESS_BIDDER_ADDRESS');
export const bidderWalletName =
  AGORIC_NET === networks.LOCAL ? 'gov1' : 'bidder';

export const gov1Mnemonic =
  AGORIC_NET === networks.LOCAL
    ? mnemonics.gov1
    : Cypress.env('CYPRESS_GOV1_MNEMONIC');
export const gov1Address =
  AGORIC_NET === networks.LOCAL
    ? accountAddresses.gov1
    : Cypress.env('CYPRESS_GOV1_ADDRESS');

export const gov2Mnemonic =
  AGORIC_NET === networks.LOCAL
    ? mnemonics.gov2
    : Cypress.env('CYPRESS_GOV2_MNEMONIC');
export const gov2Address =
  AGORIC_NET === networks.LOCAL
    ? accountAddresses.gov2
    : Cypress.env('CYPRESS_GOV2_ADDRESS');
