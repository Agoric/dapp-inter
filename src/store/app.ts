import {
  branchBridgeHref,
  localBridgeHref,
  networkConfigs,
  prodBridgeHref,
} from 'config';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { atomWithStore } from 'jotai-zustand';
import { makeImportContext } from '@agoric/wallet/api/src/marshal-contexts';
import create from 'zustand/vanilla';
import { makeDisplayFunctions } from 'utils/displayFunctions';
import { makeWalletService } from 'service/wallet';
import type { DisplayInfo, Brand } from '@agoric/ertp/src/types';
import type { Marshal } from '@endo/marshal';
import type { Leader } from '@agoric/casting';
import type { PursesJSONState } from '@agoric/wallet-backend';

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
  pursesNotifier: unknown;
};

export type OfferSigner = {
  isDappApproved: boolean;
  addOffer?: (offer: OfferConfig) => void;
};

interface AppState {
  brandToInfo: Map<Brand, BrandInfo> | null;
  watchVbankError: string | null;
  importContext: ImportContext;
  leader: Leader | null;
  isWalletConnectionInProgress: boolean;
  chainConnection: ChainConnection | null;
  offerSigner: OfferSigner;
  purses: PursesJSONState[] | null;
  walletService: ReturnType<typeof makeWalletService>;
}

export const appStore = create<AppState>()(() => ({
  brandToInfo: null,
  watchVbankError: null,
  importContext: makeImportContext(),
  leader: null,
  isWalletConnectionInProgress: false,
  chainConnection: null,
  offerSigner: { isDappApproved: false },
  purses: null,
  walletService: makeWalletService(),
}));

export const appAtom = atomWithStore(appStore);

export const displayFunctionsAtom = atom(get => {
  const brandToInfo = get(appAtom).brandToInfo;
  return brandToInfo && makeDisplayFunctions(brandToInfo);
});

export const walletServiceAtom = atom(get => get(appAtom).walletService);

export const pursesAtom = atom(get => get(appAtom).purses);

export const isWalletConnectionInProgressAtom = atom(
  get => get(appAtom).isWalletConnectionInProgress,
);

export const offerSignerAtom = atom(
  get => get(appAtom).offerSigner,
  (_get, set, newBridge: OfferSigner) =>
    set(appAtom, state => ({ ...state, walletBridge: newBridge })),
);

export const setIsDappApprovedAtom = atom(
  null,
  (_get, set, isDappApproved: boolean) =>
    set(appAtom, state => ({
      ...state,
      offerSigner: { ...state.offerSigner, isDappApproved },
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
