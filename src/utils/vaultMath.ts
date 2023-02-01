import {
  floorDivideBy,
  floorMultiplyBy,
} from '@agoric/zoe/src/contractSupport';
import { AmountMath } from '@agoric/ertp';
import type { Ratio } from 'store/vaults';

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
