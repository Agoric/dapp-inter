export const networkConfigs = {
  devnet: {
    label: 'Agoric Devnet',
    url: 'https://devnet.agoric.net/network-config',
  },
  ollinet: {
    label: 'Agoric Ollinet',
    url: 'https://ollinet.agoric.net/network-config',
  },
  emerynet: {
    label: 'Agoric Emerynet',
    url: 'https://emerynet.agoric.net/network-config',
  },
  xnet: {
    label: 'Agoric Xnet',
    url: 'https://xnet.agoric.net/network-config',
  },
  loadtest: {
    label: 'Agoric Loadtest',
    url: 'https://loadtest.agoric.net/network-config',
  },
  localhost: {
    label: 'Local Network',
    url: 'https://local.agoric.net/network-config',
  },
};

export const prodSignerHref = 'https://wallet.agoric.app/wallet/';
export const prodBridgeHref = prodSignerHref + 'bridge.html';
export const localBridgeHref = 'http://localhost:3000/wallet/bridge.html';
export const branchBridgeHref = (branchName: string) =>
  `https://${branchName}.wallet-app.pages.dev/wallet/bridge.html`;

export const signerTarget = 'wallet';

export const disclaimerHref = 'https://docs.inter.trade/disclaimer';

export const psmHref = 'https://psm.inter.trade/';

export const analyticsHref = 'https://info.inter.trade/';

export const mnemonics = {
  user1:
    'tackle hen gap lady bike explain erode midnight marriage wide upset culture model select dial trial swim wood step scan intact what card symptom',
};
