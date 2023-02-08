import { calculateCurrentDebt } from '@agoric/inter-protocol/src/interest-math';
import {
  ceilMultiplyBy,
  makeRatioFromAmounts,
} from '@agoric/zoe/src/contractSupport';
import { atom } from 'jotai';
import { vaultKeyToAdjustAtom, vaultStoreAtom } from './vaults';

export const vaultToAdjustAtom = atom(get => {
  const key = get(vaultKeyToAdjustAtom);
  const { vaults, vaultManagers, prices, vaultGovernedParams } =
    get(vaultStoreAtom);

  const vault = key && vaults?.get(key);
  if (!vault) {
    return null;
  }

  const { locked, debtSnapshot, managerId } = vault;
  const manager = vaultManagers.get(managerId);
  const price = locked && prices.get(locked.brand);
  const params = vaultGovernedParams.get(managerId);
  if (!(locked && debtSnapshot && manager && price && params)) {
    return null;
  }

  const totalLockedValue = ceilMultiplyBy(
    locked,
    makeRatioFromAmounts(price.amountOut, price.amountIn),
  );

  const totalDebt = calculateCurrentDebt(
    debtSnapshot.debt,
    debtSnapshot.interest,
    manager.compoundedInterest,
  );

  return {
    totalLockedValue,
    totalDebt,
    collateralPrice: price,
    locked,
    indexWithinManager: vault.indexWithinManager,
    params,
  };
});

export enum CollateralAction {
  None = 'No Action',
  Deposit = 'Deposit',
  Withdraw = 'Withdraw',
}

export enum DebtAction {
  None = 'No Action',
  Repay = 'Repay',
  Borrow = 'Borrow More',
}

const collateralActionAtomInternal = atom(CollateralAction.None);

export const collateralActionAtom = atom(
  get => get(collateralActionAtomInternal),
  (_get, set, action: CollateralAction) => {
    set(collateralActionAtomInternal, action);
  },
);

const debtActionAtomInternal = atom(DebtAction.None);

export const debtActionAtom = atom(
  get => get(debtActionAtomInternal),
  (_get, set, action: DebtAction) => {
    set(debtActionAtomInternal, action);
  },
);
