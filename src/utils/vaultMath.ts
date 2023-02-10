import {
  addRatios,
  ceilMultiplyBy,
  floorDivideBy,
  floorMultiplyBy,
  makeRatioFromAmounts,
} from '@agoric/zoe/src/contractSupport';
import { AmountMath } from '@agoric/ertp';
import { Ratio } from 'store/vaults';
import { Amount } from '@agoric/ertp/src/types';
import { CollateralAction, DebtAction } from 'store/adjustVault';

export const computeToReceive = (
  priceRate: Ratio,
  collateralizationRatio: Ratio,
  toLock: bigint,
  defaultCollateralization: Ratio,
  loanFee: Ratio,
): bigint => {
  const collateralizationRatioOrDefault =
    collateralizationRatio.numerator.value === 0n
      ? defaultCollateralization
      : collateralizationRatio;

  const lockedPrice = floorMultiplyBy(
    AmountMath.make(priceRate.denominator.brand, toLock),
    priceRate,
  );

  const maxDebtAfterLoanFee = floorDivideBy(
    lockedPrice,
    collateralizationRatioOrDefault,
  );

  return floorDivideBy(
    maxDebtAfterLoanFee,
    addRatios(
      loanFee,
      makeRatioFromAmounts(loanFee.denominator, loanFee.denominator),
    ),
  ).value;
};

export const computeToLock = (
  priceRate: Ratio,
  collateralizationRatio: Ratio,
  toReceive: bigint,
  defaultCollateralization: Ratio,
  loanFee: Ratio,
): bigint => {
  const collateralizationRatioOrDefault =
    collateralizationRatio.numerator.value === 0n
      ? defaultCollateralization
      : collateralizationRatio;

  const receiveAmount = AmountMath.make(loanFee.numerator.brand, toReceive);
  const resultingDebt = AmountMath.add(
    receiveAmount,
    ceilMultiplyBy(receiveAmount, loanFee),
  );
  const receiveMargin = floorMultiplyBy(
    resultingDebt,
    collateralizationRatioOrDefault,
  );

  return floorDivideBy(receiveMargin, priceRate).value;
};

/**
 * @returns tuple of [value of difference, boolean of whether it's negative]
 */
export const netValue = (lockedValue: Amount<'nat'>, debt: Amount<'nat'>) =>
  AmountMath.isGTE(lockedValue, debt)
    ? [AmountMath.subtract(lockedValue, debt), false]
    : [AmountMath.subtract(debt, lockedValue), true];

export const debtAfterDelta = (
  debtAction: DebtAction,
  loanFee: Ratio,
  totalDebt: Amount<'nat'>,
  debtDeltaValue: bigint | null,
): Amount<'nat'> => {
  if (debtAction === DebtAction.None || !debtDeltaValue) {
    return totalDebt;
  }

  if (debtAction === DebtAction.Borrow) {
    const loanFeeMultiplier = addRatios(
      loanFee,
      makeRatioFromAmounts(loanFee.denominator, loanFee.denominator),
    );

    return AmountMath.add(
      totalDebt,
      ceilMultiplyBy(
        AmountMath.make(totalDebt.brand, debtDeltaValue),
        loanFeeMultiplier,
      ),
    );
  }

  if (debtDeltaValue <= totalDebt.value) {
    return AmountMath.make(totalDebt.brand, totalDebt.value - debtDeltaValue);
  }

  return AmountMath.makeEmpty(totalDebt.brand);
};

export const lockedAfterDelta = (
  collateralAction: CollateralAction,
  locked: Amount<'nat'>,
  collateralDeltaValue: bigint | null,
): Amount<'nat'> => {
  if (collateralAction === CollateralAction.None || !collateralDeltaValue) {
    return locked;
  }

  if (collateralAction === CollateralAction.Deposit) {
    return AmountMath.make(locked.brand, locked.value + collateralDeltaValue);
  }

  if (collateralDeltaValue <= locked.value) {
    return AmountMath.make(locked.brand, locked.value - collateralDeltaValue);
  }

  return AmountMath.makeEmpty(locked.brand);
};
