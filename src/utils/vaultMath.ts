import {
  floorDivideBy,
  floorMultiplyBy,
} from '@agoric/zoe/src/contractSupport';
import { AmountMath } from '@agoric/ertp';
import { Ratio } from 'store/vaults';
import { Amount } from '@agoric/ertp/src/types';

export const computeToReceive = (
  priceRate: Ratio,
  collateralizationRatio: Ratio,
  toLock: bigint,
  defaultCollateralization: Ratio,
) => {
  const collateralizationRatioOrDefault =
    collateralizationRatio.numerator.value === 0n
      ? defaultCollateralization
      : collateralizationRatio;

  const lockedPrice = floorMultiplyBy(
    AmountMath.make(priceRate.denominator.brand, toLock),
    priceRate,
  );

  return floorDivideBy(lockedPrice, collateralizationRatioOrDefault).value;
};

export const computeToLock = (
  priceRate: Ratio,
  collateralizationRatio: Ratio,
  toReceive: bigint,
  defaultCollateralization: Ratio,
) => {
  const collateralizationRatioOrDefault =
    collateralizationRatio.numerator.value === 0n
      ? defaultCollateralization
      : collateralizationRatio;

  const receiveMargin = floorMultiplyBy(
    AmountMath.make(priceRate.numerator.brand, toReceive),
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
