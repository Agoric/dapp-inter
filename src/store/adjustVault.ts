import { AmountMath } from '@agoric/ertp';
import { calculateCurrentDebt } from '@agoric/inter-protocol/src/interest-math';
import {
  ceilMultiplyBy,
  makeRatioFromAmounts,
} from '@agoric/zoe/src/contractSupport';
import {
  floorMultiplyBy,
  ratioGTE,
} from '@agoric/zoe/src/contractSupport/ratio';
import { atom } from 'jotai';
import {
  debtAfterChange,
  istAvailable,
  lockedAfterChange,
} from 'utils/vaultMath';
import { pursesAtom } from './app';
import { vaultKeyToAdjustAtom, vaultStoreAtom } from './vaults';
import type {
  VaultMetrics,
  VaultParams,
  Ratio,
  VaultPhase,
  PriceDescription,
} from './vaults';
import type { Amount, NatValue } from '@agoric/ertp/src/types';

type VaultToAdjust = {
  totalLockedValue: Amount<'nat'>;
  totalDebt: Amount<'nat'>;
  collateralPrice: PriceDescription;
  locked: Amount<'nat'>;
  indexWithinManager: number;
  params: VaultParams;
  metrics: VaultMetrics;
  collateralizationRatio?: Ratio;
  createdByOfferId: string;
  vaultState?: VaultPhase;
};

export const vaultToAdjustAtom = atom<VaultToAdjust | null>(get => {
  const { vaults, vaultManagers, prices, vaultGovernedParams, vaultMetrics } =
    get(vaultStoreAtom);
  const key = get(vaultKeyToAdjustAtom);

  const vault = key && vaults?.get(key);
  if (!vault) {
    return null;
  }

  const { locked, debtSnapshot, managerId, createdByOfferId, vaultState } =
    vault;
  const manager = vaultManagers.get(managerId);
  const price = locked && prices.get(locked.brand);
  const params = vaultGovernedParams.get(managerId);
  const metrics = vaultMetrics.get(managerId);
  if (!(locked && debtSnapshot && manager && price && params && metrics)) {
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

  const collateralizationRatio = AmountMath.isEmpty(totalDebt)
    ? undefined
    : makeRatioFromAmounts(totalLockedValue, totalDebt);

  return {
    totalLockedValue,
    totalDebt,
    collateralPrice: price,
    locked,
    indexWithinManager: vault.indexWithinManager,
    params,
    metrics,
    collateralizationRatio,
    createdByOfferId,
    vaultState,
  };
});

export const collateralInputValueAtom = atom<NatValue | null>(null);

export const debtInputValueAtom = atom<NatValue | null>(null);

export const collateralInputAmountAtom = atom<Amount<'nat'> | null>(get => {
  const collateralBrand = get(vaultToAdjustAtom)?.locked.brand;
  const collateralInputValue = get(collateralInputValueAtom);

  if (!collateralBrand || collateralInputValue === null) {
    return null;
  }

  return AmountMath.make(collateralBrand, collateralInputValue);
});

export const debtInputAmountAtom = atom<Amount<'nat'> | null>(get => {
  const debtBrand = get(vaultToAdjustAtom)?.totalDebt.brand;
  const debtInputValue = get(debtInputValueAtom);

  if (!debtBrand || debtInputValue === null) {
    return null;
  }

  return AmountMath.make(debtBrand, debtInputValue);
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
    set(collateralInputValueAtom, null);
    set(collateralActionAtomInternal, action);
  },
);

const debtActionAtomInternal = atom(DebtAction.None);

export const debtActionAtom = atom(
  get => get(debtActionAtomInternal),
  (_get, set, action: DebtAction) => {
    set(debtInputValueAtom, null);
    set(debtActionAtomInternal, action);
  },
);

type VaultAfterAdjustment = {
  newDebt: Amount<'nat'>;
  newLocked: Amount<'nat'>;
  newCollateralizationRatio?: Ratio;
};

export const vaultAfterAdjustmentAtom = atom<VaultAfterAdjustment | null>(
  get => {
    const vaultToAdjust = get(vaultToAdjustAtom);
    if (!vaultToAdjust) {
      return null;
    }

    const debtAction = get(debtActionAtom);
    const collateralAction = get(collateralActionAtom);
    const collateralInputAmount = get(collateralInputAmountAtom);
    const debtInputAmount = get(debtInputAmountAtom);

    const { totalDebt, locked, params, collateralPrice } = vaultToAdjust;

    const newDebt = debtAfterChange(
      debtAction,
      params.loanFee,
      totalDebt,
      debtInputAmount,
    );

    const newLocked = lockedAfterChange(
      collateralAction,
      locked,
      collateralInputAmount,
    );

    const newLockedPrice = floorMultiplyBy(
      newLocked,
      makeRatioFromAmounts(collateralPrice.amountOut, collateralPrice.amountIn),
    );

    const newCollateralizationRatio = AmountMath.isEmpty(newDebt)
      ? undefined
      : makeRatioFromAmounts(newLockedPrice, newDebt);

    return { newDebt, newLocked, newCollateralizationRatio };
  },
);

export const adjustVaultErrorsAtom = atom(get => {
  let debtError;
  let collateralError;

  const vaultToAdjust = get(vaultToAdjustAtom);
  const vaultAfterAdjustment = get(vaultAfterAdjustmentAtom);
  if (!vaultToAdjust || !vaultAfterAdjustment) {
    return {};
  }

  const debtAction = get(debtActionAtom);
  const collateralAction = get(collateralActionAtom);
  const collateralInputAmount = get(collateralInputAmountAtom);
  const debtInputAmount = get(debtInputAmountAtom);

  const { params, metrics, totalDebt } = vaultToAdjust;
  const { newCollateralizationRatio, newDebt, newLocked } =
    vaultAfterAdjustment;

  if (
    newCollateralizationRatio &&
    !ratioGTE(
      newCollateralizationRatio,
      params.inferredMinimumCollateralization,
    )
  ) {
    if (debtAction === DebtAction.Borrow) {
      debtError = "Can't borrow below min. collat. ratio";
    }
    if (collateralAction === CollateralAction.Withdraw) {
      collateralError = "Can't withdraw below min. collat. ratio";
    }
  }

  const purses = get(pursesAtom);
  const collateralPurse = purses?.find(p => p.brand === newLocked.brand);
  const debtPurse = purses?.find(p => p.brand === newDebt.brand);

  const debtPurseAmount = debtPurse?.currentAmount as Amount<'nat'> | undefined;
  if (
    debtAction === DebtAction.Repay &&
    debtInputAmount?.value &&
    (!debtPurseAmount || !AmountMath.isGTE(debtPurseAmount, debtInputAmount))
  ) {
    debtError = 'Insufficient funds.';
  }

  const collateralPurseAmount = collateralPurse?.currentAmount as
    | Amount<'nat'>
    | undefined;
  if (
    collateralAction === CollateralAction.Deposit &&
    collateralInputAmount?.value &&
    (!collateralPurseAmount ||
      !AmountMath.isGTE(collateralPurseAmount, collateralInputAmount))
  ) {
    collateralError = 'Insufficient funds.';
  }

  if (debtAction === DebtAction.Borrow) {
    const mintedAvailable = istAvailable(params.debtLimit, metrics.totalDebt);

    const debtDelta = AmountMath.subtract(newDebt, totalDebt);
    if (!AmountMath.isGTE(mintedAvailable, debtDelta)) {
      debtError = 'Not enough IST available for this vault type.';
    }
  }

  return { collateralError, debtError };
});
