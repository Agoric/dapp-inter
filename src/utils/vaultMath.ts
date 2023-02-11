import {
  addRatios,
  ceilMultiplyBy,
  floorDivideBy,
  floorMultiplyBy,
  makeRatioFromAmounts,
} from '@agoric/zoe/src/contractSupport';
import { AmountMath } from '@agoric/ertp';
import { PriceDescription, Ratio } from 'store/vaults';
import { Amount, NatValue } from '@agoric/ertp/src/types';
import { CollateralAction, DebtAction } from 'store/adjustVault';

export const computeToReceive = (
  priceRate: Ratio,
  collateralizationRatio: Ratio,
  toLock: NatValue,
  defaultCollateralization: Ratio,
  loanFee: Ratio,
): NatValue => {
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
  toReceive: NatValue,
  defaultCollateralization: Ratio,
  loanFee: Ratio,
): NatValue => {
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

export const debtAfterChange = (
  debtAction: DebtAction,
  loanFee: Ratio,
  totalDebt: Amount<'nat'>,
  debtChange: Amount<'nat'> | null,
): Amount<'nat'> => {
  if (debtAction === DebtAction.None || !debtChange) {
    return totalDebt;
  }

  if (debtAction === DebtAction.Borrow) {
    const loanFeeMultiplier = addRatios(
      loanFee,
      makeRatioFromAmounts(loanFee.denominator, loanFee.denominator),
    );

    return AmountMath.add(
      totalDebt,
      ceilMultiplyBy(debtChange, loanFeeMultiplier),
    );
  }

  if (AmountMath.isGTE(totalDebt, debtChange)) {
    return AmountMath.subtract(totalDebt, debtChange);
  }

  return AmountMath.makeEmpty(totalDebt.brand);
};

export const lockedAfterChange = (
  collateralAction: CollateralAction,
  locked: Amount<'nat'>,
  lockedChange: Amount<'nat'> | null,
): Amount<'nat'> => {
  if (collateralAction === CollateralAction.None || !lockedChange?.value) {
    return locked;
  }

  if (collateralAction === CollateralAction.Deposit) {
    return AmountMath.add(locked, lockedChange);
  }

  if (AmountMath.isGTE(locked, lockedChange)) {
    return AmountMath.subtract(locked, lockedChange);
  }

  return AmountMath.makeEmpty(locked.brand);
};

export const istAvailable = (
  debtLimit: Amount<'nat'>,
  totalDebt: Amount<'nat'>,
): Amount<'nat'> =>
  AmountMath.isGTE(debtLimit, totalDebt)
    ? AmountMath.subtract(debtLimit, totalDebt)
    : AmountMath.makeEmpty(debtLimit.brand);

export const maxCollateralForNewVault = (
  debtLimit: Amount<'nat'>,
  totalDebt: Amount<'nat'>,
  loanFee: Ratio,
  price: PriceDescription,
  desiredCollateralization: Ratio,
  collateralPurseBalance: Amount<'nat'>,
): NatValue => {
  const istAvailableAfterLoanFee = istAvailable(debtLimit, totalDebt);

  const loanFeeMultiplier = addRatios(
    loanFee,
    makeRatioFromAmounts(loanFee.denominator, loanFee.denominator),
  );

  const istAvailableBeforeLoanFee = floorDivideBy(
    istAvailableAfterLoanFee,
    loanFeeMultiplier,
  );

  const collateralForAvailableIst = computeToLock(
    makeRatioFromAmounts(price.amountOut, price.amountIn),
    desiredCollateralization,
    istAvailableBeforeLoanFee.value,
    desiredCollateralization,
    loanFee,
  );

  return AmountMath.min(
    AmountMath.make(collateralPurseBalance.brand, collateralForAvailableIst),
    collateralPurseBalance,
  ).value;
};

export const maxIstToBorrowFromVault = (
  debtLimit: Amount<'nat'>,
  totalDebt: Amount<'nat'>,
  currentDebt: Amount<'nat'>,
  loanFee: Ratio,
  locked: Amount<'nat'>,
  price: PriceDescription,
  minCollateralization: Ratio,
): NatValue => {
  const istAvailableAfterLoanFee = istAvailable(debtLimit, totalDebt);

  const loanFeeMultiplier = addRatios(
    loanFee,
    makeRatioFromAmounts(loanFee.denominator, loanFee.denominator),
  );

  const istAvailableBeforeLoanFee = floorDivideBy(
    istAvailableAfterLoanFee,
    loanFeeMultiplier,
  );

  const lockedValue = floorMultiplyBy(
    locked,
    makeRatioFromAmounts(price.amountOut, price.amountIn),
  );

  const currentDebtCeiling = floorDivideBy(lockedValue, minCollateralization);
  const maxDebtDeltaAfterLoanFee = AmountMath.isGTE(
    currentDebtCeiling,
    currentDebt,
  )
    ? AmountMath.subtract(currentDebtCeiling, currentDebt)
    : AmountMath.makeEmpty(currentDebt.brand);

  const maxDebtDeltaBeforeLoanFee = floorDivideBy(
    maxDebtDeltaAfterLoanFee,
    loanFeeMultiplier,
  );

  return AmountMath.min(istAvailableBeforeLoanFee, maxDebtDeltaBeforeLoanFee)
    .value;
};
