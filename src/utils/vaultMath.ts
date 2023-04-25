import {
  addRatios,
  ceilDivideBy,
  ceilMultiplyBy,
  floorDivideBy,
  floorMultiplyBy,
  makeRatioFromAmounts,
} from '@agoric/zoe/src/contractSupport';
import { AmountMath } from '@agoric/ertp';
import { DebtSnapshot, PriceDescription, Ratio } from 'store/vaults';
import { Amount, NatValue } from '@agoric/ertp/src/types';
import { CollateralAction, DebtAction } from 'store/adjustVault';
import { calculateCurrentDebt } from '@agoric/inter-protocol/src/interest-math';

export const computeToLock = (
  priceRate: Ratio,
  collateralizationRatio: Ratio,
  toReceive: NatValue,
  defaultCollateralization: Ratio,
  mintFee: Ratio,
  remainderHandling: 'floor' | 'ceil' = 'floor',
): NatValue => {
  const multiply =
    remainderHandling === 'floor' ? floorMultiplyBy : ceilMultiplyBy;
  const divide = remainderHandling === 'floor' ? floorDivideBy : ceilDivideBy;

  const collateralizationRatioOrDefault =
    collateralizationRatio.numerator.value === 0n
      ? defaultCollateralization
      : collateralizationRatio;

  const receiveAmount = AmountMath.make(mintFee.numerator.brand, toReceive);
  const resultingDebt = AmountMath.add(
    receiveAmount,
    multiply(receiveAmount, mintFee),
  );
  const receiveMargin = multiply(
    resultingDebt,
    collateralizationRatioOrDefault,
  );

  return divide(receiveMargin, priceRate).value;
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
  mintFee: Ratio,
  totalDebt: Amount<'nat'>,
  debtChange: Amount<'nat'> | null,
): Amount<'nat'> => {
  if (debtAction === DebtAction.None || !debtChange) {
    return totalDebt;
  }

  if (debtAction === DebtAction.Mint) {
    const mintFeeMultiplier = addRatios(
      mintFee,
      makeRatioFromAmounts(mintFee.denominator, mintFee.denominator),
    );

    return AmountMath.add(
      totalDebt,
      ceilMultiplyBy(debtChange, mintFeeMultiplier),
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

export const maxIstToMintFromVault = (
  debtLimit: Amount<'nat'>,
  totalDebt: Amount<'nat'>,
  currentDebt: Amount<'nat'>,
  mintFee: Ratio,
  locked: Amount<'nat'>,
  price: PriceDescription,
  minCollateralization: Ratio,
): NatValue => {
  const istAvailableAfterMintFee = istAvailable(debtLimit, totalDebt);

  const mintFeeMultiplier = addRatios(
    mintFee,
    makeRatioFromAmounts(mintFee.denominator, mintFee.denominator),
  );

  const istAvailableBeforeMintFee = floorDivideBy(
    istAvailableAfterMintFee,
    mintFeeMultiplier,
  );

  const lockedValue = floorMultiplyBy(
    locked,
    makeRatioFromAmounts(price.amountOut, price.amountIn),
  );

  const currentDebtCeiling = floorDivideBy(lockedValue, minCollateralization);
  const maxDebtDeltaAfterMintFee = AmountMath.isGTE(
    currentDebtCeiling,
    currentDebt,
  )
    ? AmountMath.subtract(currentDebtCeiling, currentDebt)
    : AmountMath.makeEmpty(currentDebt.brand);

  const maxDebtDeltaBeforeMintFee = floorDivideBy(
    maxDebtDeltaAfterMintFee,
    mintFeeMultiplier,
  );

  return AmountMath.min(istAvailableBeforeMintFee, maxDebtDeltaBeforeMintFee)
    .value;
};

export const collateralizationRatio = (
  price: PriceDescription,
  locked: Amount<'nat'>,
  debt: Amount<'nat'>,
) => {
  const totalLockedValue = ceilMultiplyBy(
    locked,
    makeRatioFromAmounts(price.amountOut, price.amountIn),
  );

  return AmountMath.isEmpty(debt)
    ? undefined
    : makeRatioFromAmounts(totalLockedValue, debt);
};

export const currentCollateralization = (
  debtSnapshot: DebtSnapshot,
  compoundedInterest: Ratio,
  price: PriceDescription,
  locked: Amount<'nat'>,
): Ratio | undefined => {
  const totalDebt = calculateCurrentDebt(
    debtSnapshot.debt,
    debtSnapshot.interest,
    compoundedInterest,
  );

  return collateralizationRatio(price, locked, totalDebt);
};
