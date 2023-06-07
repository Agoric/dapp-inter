import createStore from 'zustand/vanilla';
import create from 'zustand';
import type { Brand, Amount } from '@agoric/ertp/src/types';
import { atom } from 'jotai';
import { getPriceDescription } from '@agoric/zoe/src/contractSupport';
import { atomWithStore } from 'jotai-zustand';
import { persist } from 'zustand/middleware';

// XXX PriceDescription type not exported from zoe package
export type PriceDescription = {
  amountIn: Amount<'nat'>;
  amountOut: Amount<'nat'>;
  timestamp?: { absValue: bigint };
};

export type Ratio = {
  numerator: Amount<'nat'>;
  denominator: Amount<'nat'>;
};

export enum ViewMode {
  // Manage all vaults.
  Manage,
  // Adjust a vault, or create a new vault if `vaultKeyToAdjustAtom` is `null`.
  Edit,
}

export type VaultParams = {
  debtLimit: Amount<'nat'>;
  stabilityFee: Ratio;
  liquidationPenalty: Ratio;
  liquidationMargin: Ratio;
  inferredMinimumCollateralization: Ratio;
  mintFee: Ratio;
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

export type LiquidationAuctionBook = {
  // Null when outside the price lock period, otherwise the locked price.
  startPrice: Ratio | null;
};

export type VaultManager = {
  compoundedInterest: Ratio;
  latestInterestUpdate: bigint;
};

export type VaultFactoryParams = {
  minInitialDebt: Amount<'nat'>;
  referencedUI: string;
};

// XXX Should get type from
// https://github.com/Agoric/agoric-sdk/blob/1323a207983fbdb69aa09752d613d8d695324d4a/packages/inter-protocol/src/vaultFactory/vault.js#L58-L64
export type VaultPhase =
  | 'active'
  | 'liquidated'
  | 'liquidating'
  | 'closed'
  | 'transfer';

export type DebtSnapshot = {
  debt: Amount<'nat'>;
  interest: Ratio;
};

export type VaultInfoChainData = {
  debtSnapshot?: DebtSnapshot;
  locked?: Amount<'nat'>;
  vaultState?: VaultPhase;
};

export type VaultInfo = VaultInfoChainData & {
  createdByOfferId: string;
  managerId: string;
  isLoading: boolean;
  indexWithinManager: number;
};

// Number of seconds since Unix epoch January 1, 1970.
type UnixSeconds = { absValue: bigint };

export type LiquidationSchedule = {
  // Null if liquidation is not in progress.
  activeStartTime?: UnixSeconds;
  // Time of the next auction.
  nextStartTime?: UnixSeconds;
};

export type VaultKey = string;

// UNTIL: We get this from zoe https://github.com/Agoric/agoric-sdk/pull/6884
export type PriceQuote = unknown;

interface VaultState {
  managerIdsLoadingError: string | null;
  vaultFactoryParamsLoadingError: string | null;
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
  liquidationSchedule: LiquidationSchedule | null;
  liquidationAuctionBooks: Map<string, LiquidationAuctionBook>;
  setLiquidationAuctionBook: (id: string, book: LiquidationAuctionBook) => void;
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
  vaultManagerLoadingErrors: new Map(),
  vaultManagerIds: null,
  vaultManagers: new Map(),
  vaultFactoryParams: null,
  vaultGovernedParams: new Map<string, VaultParams>(),
  vaultMetrics: new Map<string, VaultMetrics>(),
  liquidationAuctionBooks: new Map<string, LiquidationAuctionBook>(),
  prices: new Map<Brand, PriceDescription>(),
  priceErrors: new Map<Brand, unknown>(),
  vaults: null,
  vaultErrors: new Map<string, unknown>(),
  liquidationSchedule: null,
  setLiquidationAuctionBook: (id: string, book: LiquidationAuctionBook) =>
    set(state => {
      const newBooks = new Map(state.liquidationAuctionBooks);
      newBooks.set(id, book);
      return { liquidationAuctionBooks: newBooks };
    }),
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

interface VaultLocalStorageState {
  hasPreviouslyCreatedVault: boolean;
  setHasPreviouslyCreatedVault: (hasCreated: boolean) => void;
}

export const vaultLocalStorageStore = createStore<VaultLocalStorageState>()(
  persist(
    set => ({
      hasPreviouslyCreatedVault: false,
      setHasPreviouslyCreatedVault: (hasCreated: boolean) =>
        set({ hasPreviouslyCreatedVault: hasCreated }),
    }),
    { name: 'vault-local-storage' },
  ),
);

export const viewModeAtom = atom(
  vaultLocalStorageStore.getState().hasPreviouslyCreatedVault
    ? ViewMode.Manage
    : ViewMode.Edit,
);

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

export const vaultsAtom = atom(get => get(vaultStoreAtom).vaults);
