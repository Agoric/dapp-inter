import create from 'zustand';

interface VaultState {
  vaultIdsLoadingError: string | null;
  vaultLoadingErrors: Map<string, unknown>;
  vaultManagerIds: string[] | null;
  vaultManagers: Map<string, unknown>;
  vaultGovernedParams: Map<string, unknown>;
  vaultMetrics: Map<string, unknown>;
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
}));
