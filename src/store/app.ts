import { networkConfigs } from 'config';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { atomWithStore } from 'jotai-zustand';
import { makeImportContext } from '@agoric/wallet/api/src/marshal-contexts';
import create from 'zustand/vanilla';
import { makeDisplayFunctions } from 'utils/displayFunctions';
import type { DisplayInfo, Brand } from '@agoric/ertp/src/types';

export type BrandInfo = DisplayInfo<'nat'> & {
  petname: string;
};

interface AppState {
  brandToInfo: Map<Brand, BrandInfo> | null;
  watchVbankError: string | null;
}

export const appStore = create<AppState>()(() => ({
  brandToInfo: null,
  watchVbankError: null,
}));

export const appAtom = atomWithStore(appStore);

export const displayFunctionsAtom = atom(get => {
  const brandToInfo = get(appAtom).brandToInfo;
  return brandToInfo && makeDisplayFunctions(brandToInfo);
});

export const networkConfigAtom = atomWithStorage(
  'agoric-network-config',
  networkConfigs.mainnet,
);

export const importContextAtom = atom(() => makeImportContext());

export const leaderAtom = atom(null);
