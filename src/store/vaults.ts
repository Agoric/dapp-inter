import createStore from 'zustand/vanilla';
import create from 'zustand';
import type { Brand, Amount } from '@agoric/ertp/src/types';
import { atom } from 'jotai';

// XXX PriceDescription type not exported from zoe package
import {
  getPriceDescription,
  makeRatio,
} from '@agoric/zoe/src/contractSupport';
import { atomWithStore } from 'jotai-zustand';
export type PriceDescription = ReturnType<typeof getPriceDescription>;
export type Ratio = ReturnType<typeof makeRatio>;

export enum ViewMode {
  // Manage all vaults.
  Manage,
  // Adjust a vault, or create a new vault if `vaultKeyToAdjustAtom` is `null`.
  Edit,
}

export type VaultParams = {
  debtLimit: Amount<'nat'>;
  interestRate: Ratio;
  liquidationPenalty: Ratio;
  liquidationMargin: Ratio;
  loanFee: Ratio;
};

export type VaultMetrics = {
  numActiveVaults: number;
  numLiquidatingVaults: number;
  numLiquidationsCompleted: number;
  retainedCollateral: Amount<'nat'>;
  totalCollateral: Amount<'nat'>;
  totalDebt: Amount<'nat'>;
  totalOverageReceived: Amount<'nat'>;
  totalProceedsReceived: Amount<'nat'>;
  totalShortfallReceived: Amount<'nat'>;
};

export type VaultManager = {
  compoundedInterest: Ratio;
  latestInterestUpdate: bigint;
};

export type VaultFactoryParams = {
  minInitialDebt: Amount<'nat'>;
};

export type VaultInfoChainData = {
  debtSnapshot?: {
    debt: Amount<'nat'>;
    interest: Ratio;
  };
  locked?: Amount<'nat'>;
  vaultState?: string;
};

export type VaultInfo = VaultInfoChainData & {
  createdByOfferId: string;
  managerId: string;
  isLoading: boolean;
  indexWithinManager: number;
};

export type VaultKey = string;

// UNTIL: We get this from zoe https://github.com/Agoric/agoric-sdk/pull/6884
export type PriceQuote = unknown;

interface VaultState {
  managerIdsLoadingError: string | null;
  vaultFactoryParamsLoadingError: string | null;
  vaultFactoryInstanceHandleLoadingError: string | null;
  vaultManagerLoadingErrors: Map<string, unknown>;
  vaultManagerIds: string[] | null;
  vaultManagers: Map<string, VaultManager>;
  vaultGovernedParams: Map<string, VaultParams>;
  vaultMetrics: Map<string, VaultMetrics>;
  vaults: Map<string, VaultInfo> | null;
  vaultErrors: Map<string, unknown>;
  prices: Map<Brand, PriceDescription>;
  priceErrors: Map<Brand, unknown>;
  vaultFactoryParams: VaultFactoryParams | null;
  vaultFactoryInstanceHandle: unknown;
  setPrice: (brand: Brand, priceQuote: PriceQuote) => void;
  setPriceError: (brand: Brand, e: unknown) => void;
  setVaultManagerLoadingError: (id: string, error: unknown) => void;
  setVaultManager: (id: string, manager: VaultManager) => void;
  setVaultGovernedParams: (id: string, params: VaultParams) => void;
  setVaultMetrics: (id: string, metrics: VaultMetrics) => void;
  setVault: (vaultKey: string, vault: VaultInfo) => void;
  setVaultError: (vaultKey: string, error: unknown) => void;
  markVaultForLoading: (
    vaultKey: string,
    managerId: string,
    createdByOfferId: string,
    indexWithinManager: number,
  ) => void;
}

export const vaultStore = createStore<VaultState>()(set => ({
  managerIdsLoadingError: null,
  vaultFactoryParamsLoadingError: null,
  vaultFactoryInstanceHandleLoadingError: null,
  vaultManagerLoadingErrors: new Map(),
  vaultManagerIds: null,
  vaultManagers: new Map(),
  vaultFactoryParams: null,
  vaultFactoryInstanceHandle: null,
  vaultGovernedParams: new Map<string, VaultParams>(),
  vaultMetrics: new Map<string, VaultMetrics>(),
  prices: new Map<Brand, PriceDescription>(),
  priceErrors: new Map<Brand, unknown>(),
  vaults: null,
  vaultErrors: new Map<string, unknown>(),
  setVaultManagerLoadingError: (id: string, error: unknown) =>
    set(state => {
      const newErrors = new Map(state.vaultManagerLoadingErrors);
      newErrors.set(id, error);
      return { vaultManagerLoadingErrors: newErrors };
    }),
  setVaultManager: (id: string, manager: VaultManager) =>
    set(state => {
      const newManagers = new Map(state.vaultManagers);
      newManagers.set(id, manager);
      return { vaultManagers: newManagers };
    }),
  setVaultGovernedParams: (id: string, params: VaultParams) =>
    set(state => {
      const newParams = new Map(state.vaultGovernedParams);
      newParams.set(id, params);
      return { vaultGovernedParams: newParams };
    }),
  setVaultMetrics: (id: string, metrics: VaultMetrics) =>
    set(state => {
      const newMetrics = new Map(state.vaultMetrics);
      newMetrics.set(id, metrics);
      return { vaultMetrics: newMetrics };
    }),
  setPrice: (brand: Brand, priceQuote: PriceQuote) =>
    set(state => {
      const newPrices = new Map(state.prices);
      newPrices.set(brand, getPriceDescription(priceQuote));
      return { prices: newPrices };
    }),
  setPriceError: (brand: Brand, e: unknown) =>
    set(state => {
      const newPriceErrors = new Map(state.priceErrors);
      newPriceErrors.set(brand, e);
      return { priceErrors: newPriceErrors };
    }),
  setVault: (vaultKey: string, vault: VaultInfo) =>
    set(state => {
      const newVaults = new Map(state.vaults);
      newVaults.set(vaultKey, vault);
      return { vaults: newVaults };
    }),
  setVaultError: (vaultKey: string, e: unknown) =>
    set(state => {
      const newVaultErrors = new Map(state.vaultErrors);
      newVaultErrors.set(vaultKey, e);
      return { vaultErrors: newVaultErrors };
    }),
  markVaultForLoading: (
    vaultKey: string,
    managerId: string,
    createdByOfferId: string,
    indexWithinManager: number,
  ) =>
    set(state => {
      // Only set the vault as loading if it doesn't exist yet.
      if (state.vaults?.get(vaultKey)) {
        return {};
      }
      const newVaults = new Map(state.vaults);
      newVaults.set(vaultKey, {
        isLoading: true,
        managerId,
        createdByOfferId,
        indexWithinManager,
      });
      return { vaults: newVaults };
    }),
}));

export const viewModeAtom = atom(ViewMode.Edit);

const vaultKeyToAdjustAtomInternal = atom<VaultKey | null>(null);

export const vaultKeyToAdjustAtom = atom(
  get => get(vaultKeyToAdjustAtomInternal),
  (_get, set, key: VaultKey | null) => {
    set(vaultKeyToAdjustAtomInternal, key);
    set(viewModeAtom, ViewMode.Edit);
  },
);

export const vaultStoreAtom = atomWithStore(vaultStore);

export const useVaultStore = create(vaultStore);
