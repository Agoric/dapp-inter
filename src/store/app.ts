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

interface AppState {
  brandToInfo: Map<Brand, BrandInfo> | null;
  watchVbankError: string | null;
  importContext: ImportContext;
  leader: Leader | null;
}

export const appStore = create<AppState>()(() => ({
  brandToInfo: null,
  watchVbankError: null,
  importContext: makeImportContext(),
  leader: null,
}));

export const appAtom = atomWithStore(appStore);

export const displayFunctionsAtom = atom(get => {
  const brandToInfo = get(appAtom).brandToInfo;
  return brandToInfo && makeDisplayFunctions(brandToInfo);
});

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
