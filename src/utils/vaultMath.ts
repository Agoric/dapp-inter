import {
  floorDivideBy,
  floorMultiplyBy,
} from '@agoric/zoe/src/contractSupport';
import { AmountMath } from '@agoric/ertp';
import { Ratio } from 'store/vaults';

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
 * Returns negative if left < right, 0 if left = right,
 * positive if left < right.
 */
export const compareRatios = (left: Ratio, right: Ratio) => {
  assert(
    left.numerator.brand === right.numerator.brand &&
      left.denominator.brand === right.denominator.brand,
    'Cannot compare ratios of different brands',
  );

  const leftNumerator = left.numerator.value;
  const leftDenominator = left.denominator.value;
  const rightNumerator = right.numerator.value;
  const rightDenominator = right.denominator.value;

  return (
    (leftNumerator * rightDenominator - rightNumerator * leftDenominator) /
    (leftDenominator * rightDenominator)
  );
};
