import {
  branchBridgeHref,
  localBridgeHref,
  networkConfigs,
  prodBridgeHref,
} from 'config';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { atomWithStore } from 'jotai-zustand';
import {
  ImportContext,
  makeImportContext,
} from '@agoric/smart-wallet/src/marshal-contexts';
import createStore from 'zustand/vanilla';
import { persist } from 'zustand/middleware';
import { makeDisplayFunctions } from 'utils/displayFunctions';
import { makeWalletService } from 'service/wallet';
import type { DisplayInfo, Brand, AssetKind } from '@agoric/ertp/src/types';
import type { Leader } from '@agoric/casting';
import type { PursesJSONState } from '@agoric/wallet-backend';
import { secondsSinceEpoch } from 'utils/date';

export type BrandInfo = DisplayInfo<'nat'> & {
  petname: string;
};

export type OfferConfig = {
  instanceHandle?: import('@endo/marshal').CapData<'Instance'>;
  publicInvitationMaker?: string;
  p?: unknown;
  proposalTemplate: unknown;
};

export type ChainConnection = {
  chainId: string;
  address: string;
  pursesNotifier: unknown;
  publicSubscribersNotifier: unknown;
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
  purses: PursesJSONState<AssetKind>[] | null;
  walletService: ReturnType<typeof makeWalletService>;
  offerIdsToPublicSubscribers: Record<string, Record<string, string>> | null;
  isDisclaimerDialogShowing: boolean;
}

export const appStore = createStore<AppState>()(() => ({
  brandToInfo: null,
  watchVbankError: null,
  importContext: makeImportContext(),
  leader: null,
  isWalletConnectionInProgress: false,
  chainConnection: null,
  offerSigner: { isDappApproved: false },
  purses: null,
  walletService: makeWalletService(),
  offerIdsToPublicSubscribers: null,
  isDisclaimerDialogShowing: false,
}));

export const appAtom = atomWithStore(appStore);

export const currentTimeAtom = atom(secondsSinceEpoch());

export const offerIdsToPublicSubscribersAtom = atom(
  get => get(appAtom).offerIdsToPublicSubscribers,
);

export type DisplayFunctions = ReturnType<typeof makeDisplayFunctions>;

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
  (_get, set, offerSigner: OfferSigner) =>
    set(appAtom, state => ({ ...state, offerSigner })),
);

export const isDisclaimerDialogShowingAtom = atom(
  get => get(appAtom).isDisclaimerDialogShowing,
  (_get, set, isDisclaimerDialogShowing: boolean) =>
    set(appAtom, state => ({ ...state, isDisclaimerDialogShowing })),
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

export const networkConfigAtom = import.meta.env.VITE_NETWORK_CONFIG_URL
  ? atom({ url: import.meta.env.VITE_NETWORK_CONFIG_URL, label: undefined })
  : atomWithStorage('agoric-network-config', networkConfigs.localhost);

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

// Increment whenever the terms on https://docs.inter.trade/disclaimer change.
export const latestDisclaimerIndex = 1;

interface LocalStorageState {
  latestDisclaimerAgreedIndex: number;
  setlatestDisclaimerAgreedIndex: (index: number) => void;
  hasWalletPreviouslyConnected: boolean;
  setHasWalletPreviouslyConnected: (hasConnected: boolean) => void;
}

export const localStorageStore = createStore<LocalStorageState>()(
  persist(
    set => ({
      latestDisclaimerAgreedIndex: -1,
      setlatestDisclaimerAgreedIndex: (index: number) =>
        set({ latestDisclaimerAgreedIndex: index }),
      hasWalletPreviouslyConnected: false,
      setHasWalletPreviouslyConnected: (hasConnected: boolean) =>
        set({ hasWalletPreviouslyConnected: hasConnected }),
    }),
    { name: 'app-local-storage' },
  ),
);

export const isAppVersionOutdatedAtom = atom(false);
