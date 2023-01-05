import { networkConfigs } from 'config';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { atomWithStore } from 'jotai-zustand';
import { makeImportContext } from '@agoric/wallet/api/src/marshal-contexts';
import create from 'zustand/vanilla';
import { makeDisplayFunctions } from 'utils/displayFunctions';
import type { DisplayInfo, Brand } from '@agoric/ertp/src/types';
import type { Marshal } from '@endo/marshal';
import type { Leader } from '@agoric/casting';

export type BrandInfo = DisplayInfo<'nat'> & {
  petname: string;
};

export type ImportContext = {
  fromBoard: Marshal<unknown>;
  fromWallet: Marshal<unknown>;
};

export type OfferConfig = {
  instanceHandle: import('@endo/marshal').CapData<'Instance'>;
  publicInvitationMaker: string;
  proposalTemplate: unknown;
};

export type ChainConnection = {
  chainId: string;
  address: string;
};

export type WalletBridge = {
  isDappApproved: boolean;
  addOffer?: (offer: OfferConfig) => void;
};

interface AppState {
  brandToInfo: Map<Brand, BrandInfo> | null;
  watchVbankError: string | null;
  importContext: ImportContext;
  leader: Leader | null;
  chainConnection: ChainConnection | null;
  walletBridge: WalletBridge;
}

export const appStore = create<AppState>()(() => ({
  brandToInfo: null,
  watchVbankError: null,
  importContext: makeImportContext(),
  leader: null,
  chainConnection: null,
  walletBridge: { isDappApproved: false },
}));

export const appAtom = atomWithStore(appStore);

export const displayFunctionsAtom = atom(get => {
  const brandToInfo = get(appAtom).brandToInfo;
  return brandToInfo && makeDisplayFunctions(brandToInfo);
});

export const walletBridgeAtom = atom(
  get => get(appAtom).walletBridge,
  (_get, set, newBridge: WalletBridge) =>
    set(appAtom, state => ({ ...state, walletBridge: newBridge })),
);

export const setIsDappApprovedAtom = atom(
  null,
  (_get, set, isDappApproved: boolean) =>
    set(appAtom, state => ({
      ...state,
      walletBridge: { ...state.walletBridge, isDappApproved },
    })),
);

export const chainConnectionAtom = atom(get => get(appAtom).chainConnection);

export const leaderAtom = atom(
  get => get(appAtom).leader,
  (_get, set, newLeader: Leader) =>
    set(appAtom, state => ({
      ...state,
      leader: newLeader,
    })),
);

export const networkConfigAtom = atomWithStorage(
  'agoric-network-config',
  networkConfigs.mainnet,
);

const prodBridgeHref = 'https://wallet.agoric.app/wallet/bridge.html';
const localBridgeHref = 'http://localhost:3000/wallet/bridge.html';
const branchBridgeHref = (branchName: string) =>
  `https://${branchName}.wallet-app.pages.dev/wallet/bridge.html`;

const usp = new URLSearchParams(window.location.search);
const wallet = usp.get('wallet');
let bridgeHref = prodBridgeHref;
if (wallet === 'local') {
  bridgeHref = localBridgeHref;
} else if (wallet) {
  bridgeHref = branchBridgeHref(wallet);
}

export const bridgeHrefAtom = atom<string>(bridgeHref);

export const walletUiHrefAtom = atom(get => {
  const bridgeUrl = new URL(get(bridgeHrefAtom));

  return bridgeUrl ? bridgeUrl.origin + '/wallet/' : '';
});
