import {
  branchBridgeHref,
  localBridgeHref,
  networkConfigs,
  prodBridgeHref,
} from 'config';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { atomWithStore } from 'jotai-zustand';
import createStore from 'zustand/vanilla';
import { persist } from 'zustand/middleware';
import { makeDisplayFunctions } from 'utils/displayFunctions';
import { makeWalletService } from 'service/wallet';
import { secondsSinceEpoch } from 'utils/date';
import { makeAgoricChainStorageWatcher } from '@agoric/rpc';
import { makeAgoricWalletConnection } from '@agoric/web-components';
import type { Id as ToastId } from 'react-toastify';
import type { DisplayInfo, Brand, AssetKind } from '@agoric/ertp/src/types';
import type { PursesJSONState } from '@agoric/wallet-backend';

export type BrandInfo = DisplayInfo<'nat'> & {
  petname: string;
};

export type OfferConfig = {
  instanceHandle?: import('@endo/marshal').CapData<'Instance'>;
  publicInvitationMaker?: string;
  p?: unknown;
  proposalTemplate: unknown;
};

export type ChainConnection = Awaited<
  ReturnType<typeof makeAgoricWalletConnection>
>;

export type ChainStorageWatcher = ReturnType<
  typeof makeAgoricChainStorageWatcher
>;

interface AppState {
  brandToInfo: Map<Brand, BrandInfo> | null;
  watchVbankError: string | null;
  isWalletConnectionInProgress: boolean;
  chainConnection: ChainConnection | null;
  purses: PursesJSONState<AssetKind>[] | null;
  walletService: ReturnType<typeof makeWalletService>;
  offerIdsToPublicSubscribers: Record<string, Record<string, string>> | null;
  isDisclaimerDialogShowing: boolean;
  chainStorageWatcher: ChainStorageWatcher | null;
  smartWalletProvisioned: boolean | null;
  rpcNode: string | null;
  chainConnectionError: Error | null;
  setChainConnectionError: (error: Error | null) => void;
}

export const appStore = createStore<AppState>()(set => ({
  brandToInfo: null,
  watchVbankError: null,
  isWalletConnectionInProgress: false,
  chainConnection: null,
  purses: null,
  walletService: makeWalletService(),
  offerIdsToPublicSubscribers: null,
  isDisclaimerDialogShowing: false,
  chainStorageWatcher: null,
  smartWalletProvisioned: null,
  rpcNode: null,
  chainConnectionError: null,
  setChainConnectionError: (error: Error | null) => {
    set(state => {
      if (state.chainConnectionError === null || error === null) {
        return { chainConnectionError: error };
      }
      return {};
    });
  },
}));

export const appAtom = atomWithStore(appStore);

export const currentTimeAtom = atom(secondsSinceEpoch());

export const offerIdsToPublicSubscribersAtom = atom(
  get => get(appAtom).offerIdsToPublicSubscribers,
);

export const chainConnectionErrorAtom = atom(
  get => get(appAtom).chainConnectionError,
  (get, set, error: Error) => {
    if (get(appAtom).chainConnectionError === null) {
      set(appAtom, state => ({ ...state, chainConnectionError: error }));
    }
  },
);

export const isNodeSelectorOpenAtom = atom(false);

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

export const isDisclaimerDialogShowingAtom = atom(
  get => get(appAtom).isDisclaimerDialogShowing,
  (_get, set, isDisclaimerDialogShowing: boolean) =>
    set(appAtom, state => ({ ...state, isDisclaimerDialogShowing })),
);

export const chainConnectionAtom = atom(get => get(appAtom).chainConnection);

export const chainStorageWatcherAtom = atom(
  get => get(appAtom).chainStorageWatcher,
  (_get, set, watcher: ChainStorageWatcher) =>
    set(appAtom, state => ({
      ...state,
      chainStorageWatcher: watcher,
    })),
);

export const rpcNodeAtom = atom(
  get => get(appAtom).rpcNode,
  (_get, set, rpcNode: string) =>
    set(appAtom, state => ({
      ...state,
      rpcNode,
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

export const provisionToastIdAtom = atom<ToastId | undefined>(undefined);

export const smartWalletProvisionedAtom = atom(
  get => get(appAtom).smartWalletProvisioned,
);

export const savedRpcNodeAtom = atomWithStorage<string | null>(
  'savedRpcNode',
  null,
);

export const savedApiNodeAtom = atomWithStorage<string | null>(
  'savedApiNode',
  null,
);
