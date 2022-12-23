import create from 'zustand';
import type { Brand, Amount } from '@agoric/ertp/src/types';

export type Ratio = {
  numerator: Amount<'nat'>;
  denominator: Amount<'nat'>;
};

export type QuoteAmount = Amount<'set'>;

export type RatioValue = {
  value: Ratio;
};

export type AmountValue = {
  value: Amount<'nat'>;
};

export type VaultParams = {
  DebtLimit: AmountValue;
  InterestRate: RatioValue;
  LiquidationPenalty: RatioValue;
  LiquidationMargin: RatioValue;
  LoanFee: RatioValue;
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

interface VaultState {
  vaultIdsLoadingError: string | null;
  vaultLoadingErrors: Map<string, unknown>;
  vaultManagerIds: string[] | null;
  vaultManagers: Map<string, VaultManager>;
  vaultGovernedParams: Map<string, VaultParams>;
  vaultMetrics: Map<string, VaultMetrics>;
  prices: Map<Brand, QuoteAmount>;
  priceErrors: Map<Brand, unknown>;
  setPrice: (brand: Brand, price: QuoteAmount) => void;
  setPriceError: (brand: Brand, e: unknown) => void;
  setVaultLoadingError: (id: string, error: unknown) => void;
  setVaultManager: (id: string, manager: VaultManager) => void;
  setVaultGovernedParams: (id: string, params: VaultParams) => void;
  setVaultMetrics: (id: string, metrics: VaultMetrics) => void;
}

export const useVaultStore = create<VaultState>()(set => ({
  vaultIdsLoadingError: null,
  vaultLoadingErrors: new Map(),
  vaultManagerIds: null,
  vaultManagers: new Map(),
  vaultGovernedParams: new Map<string, VaultParams>(),
  vaultMetrics: new Map<string, VaultMetrics>(),
  prices: new Map<Brand, QuoteAmount>(),
  priceErrors: new Map<Brand, unknown>(),
  setVaultLoadingError: (id: string, error: unknown) =>
    set(state => {
      const newErrors = new Map(state.vaultLoadingErrors);
      newErrors.set(id, error);
      return { vaultLoadingErrors: newErrors };
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
  setPrice: (brand: Brand, price: QuoteAmount) =>
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
}));