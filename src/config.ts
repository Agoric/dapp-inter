export const networkConfigs = {
  mainnet: {
    label: 'Agoric Mainnet',
    url: 'https://main.agoric.net/network-config',
  },
  testnet: {
    label: 'Agoric Testnet',
    url: 'https://testnet.agoric.net/network-config',
  },
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
  localhost: {
    label: 'Local Network',
    url: 'https://wallet.agoric.app/wallet/network-config',
  },
};

export const prodSignerHref = 'https://wallet.agoric.app/wallet/';
export const prodBridgeHref = prodSignerHref + 'bridge.html';
export const localBridgeHref = 'http://localhost:3000/wallet/bridge.html';
export const branchBridgeHref = (branchName: string) =>
  `https://${branchName}.wallet-app.pages.dev/wallet/bridge.html`;

export const signerTarget = 'wallet';
