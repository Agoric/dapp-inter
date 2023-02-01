import { atom } from 'jotai';
import type { Ratio } from './vaults';

export const valueToLockAtom = atom<bigint | null>(null);

export const valueToReceiveAtom = atom<bigint | null>(null);

export const collateralizationRatioAtom = atom<Ratio | null>(null);

const selectedCollateralIdInternal = atom<string | null>(null);

export const selectedCollateralIdAtom = atom(
  get => get(selectedCollateralIdInternal),
  (_get, set, value: string) => {
    set(valueToLockAtom, null);
    set(valueToReceiveAtom, null);
    set(selectedCollateralIdInternal, value);
  },
);
