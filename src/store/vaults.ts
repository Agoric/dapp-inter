import create from 'zustand';
import type { Brand, Amount } from '@agoric/ertp/src/types';

export type Ratio = {
  numerator: Amount<'nat'>;
  denominator: Amount<'nat'>;
};

// XXX PriceDescription type not exported from zoe package
import { getPriceDescription } from '@agoric/zoe/src/contractSupport';
export type PriceDescription = ReturnType<typeof getPriceDescription>;

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
  debtSnapShot: {
    debt: Amount<'nat'>;
    interest: Ratio;
  };
  locked: Amount<'nat'>;
  vaultState: string;
};

export type VaultInfo = VaultInfoChainData & {
  managerId: string;
};

type VaultKey = string;
export const keyForVault = (managerId: string, vaultId: string) =>
  `${managerId}.${vaultId}` as VaultKey;

interface VaultState {
  managerIdsLoadingError: string | null;
  vaultFactoryParamsLoadingError: string | null;
  vaultFactoryInstanceHandleLoadingError: string | null;
  vaultManagerLoadingErrors: Map<string, unknown>;
  vaultManagerIds: string[] | null;
  vaultManagers: Map<string, VaultManager>;
  vaultGovernedParams: Map<string, VaultParams>;
  vaultMetrics: Map<string, VaultMetrics>;
  vaults: Map<VaultKey, VaultInfo>;
  vaultErrors: Map<VaultKey, unknown>;
  prices: Map<Brand, PriceDescription>;
  priceErrors: Map<Brand, unknown>;
  vaultFactoryParams: VaultFactoryParams | null;
  vaultFactoryInstanceHandle: unknown;
  setPrice: (brand: Brand, price: PriceDescription) => void;
  setPriceError: (brand: Brand, e: unknown) => void;
  setVaultManagerLoadingError: (id: string, error: unknown) => void;
  setVaultManager: (id: string, manager: VaultManager) => void;
  setVaultGovernedParams: (id: string, params: VaultParams) => void;
  setVaultMetrics: (id: string, metrics: VaultMetrics) => void;
  setVault: (key: VaultKey, vault: VaultInfo) => void;
  setVaultError: (key: VaultKey, error: unknown) => void;
}

export const useVaultStore = create<VaultState>()(set => ({
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
  vaults: new Map<VaultKey, VaultInfo>(),
  vaultErrors: new Map<VaultKey, unknown>(),
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
  setPrice: (brand: Brand, price: PriceDescription) =>
    set(state => {
      const newPrices = new Map(state.prices);
      newPrices.set(brand, price);
      return { prices: newPrices };
    }),
  setPriceError: (brand: Brand, e: unknown) =>
    set(state => {
      const newPriceErrors = new Map(state.priceErrors);
      newPriceErrors.set(brand, e);
      return { priceErrors: newPriceErrors };
    }),
  setVault: (key: VaultKey, vault: VaultInfo) =>
    set(state => {
      const newVaults = new Map(state.vaults);
      newVaults.set(key, vault);
      return { vaults: newVaults };
    }),
  setVaultError: (key: VaultKey, e: unknown) =>
    set(state => {
      const newVaultErrors = new Map(state.vaultErrors);
      newVaultErrors.set(key, e);
      return { vaultErrors: newVaultErrors };
    }),
}));
