import create from 'zustand';

// Ambient
import '@agoric/ertp/src/types';

interface VaultState {
  vaultIdsLoadingError: string | null;
  vaultLoadingErrors: Map<string, unknown>;
  vaultManagerIds: string[] | null;
  vaultManagers: Map<string, unknown>;
  vaultGovernedParams: Map<string, unknown>;
  vaultMetrics: Map<string, unknown>;
  prices: Map<Brand, unknown>;
  priceErrors: Map<Brand, unknown>;
  setPrice: (brand: Brand, price: unknown) => void;
  setPriceError: (brand: Brand, e: unknown) => void;
  setVaultLoadingError: (id: string, error: unknown) => void;
  setVaultManager: (id: string, manager: unknown) => void;
  setVaultGovernedParams: (id: string, params: unknown) => void;
  setVaultMetrics: (id: string, metrics: unknown) => void;
}

export const useVaultStore = create<VaultState>()(set => ({
  vaultIdsLoadingError: null,
  vaultLoadingErrors: new Map(),
  vaultManagerIds: null,
  vaultManagers: new Map(),
  vaultGovernedParams: new Map<string, unknown>(),
  vaultMetrics: new Map<string, unknown>(),
  prices: new Map<Brand, unknown>(),
  priceErrors: new Map<Brand, unknown>(),
  setVaultLoadingError: (id: string, error: unknown) =>
    set(state => {
      const newErrors = new Map(state.vaultLoadingErrors);
      newErrors.set(id, error);
      return { vaultLoadingErrors: newErrors };
    }),
  setVaultManager: (id: string, manager: unknown) =>
    set(state => {
      const newManagers = new Map(state.vaultManagers);
      newManagers.set(id, manager);
      return { vaultManagers: newManagers };
    }),
  setVaultGovernedParams: (id: string, params: unknown) =>
    set(state => {
      const newParams = new Map(state.vaultGovernedParams);
      newParams.set(id, params);
      return { vaultGovernedParams: newParams };
    }),
  setVaultMetrics: (id: string, metrics: unknown) =>
    set(state => {
      const newMetrics = new Map(state.vaultMetrics);
      newMetrics.set(id, metrics);
      return { vaultMetrics: newMetrics };
    }),
  setPrice: (brand: Brand, price: unknown) =>
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
