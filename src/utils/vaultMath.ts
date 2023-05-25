import {
  addRatios,
  ceilDivideBy,
  ceilMultiplyBy,
  floorDivideBy,
  floorMultiplyBy,
  makeRatioFromAmounts,
} from '@agoric/zoe/src/contractSupport';
import { AmountMath } from '@agoric/ertp';
import {
  DebtSnapshot,
  LiquidationAuctionBook,
  LiquidationSchedule,
  PriceDescription,
  Ratio,
  VaultInfo,
  VaultManager,
  VaultParams,
} from 'store/vaults';
import { Amount, Brand, NatValue } from '@agoric/ertp/src/types';
import { CollateralAction, DebtAction } from 'store/adjustVault';
import { calculateCurrentDebt } from '@agoric/inter-protocol/src/interest-math';
import { ratioGTE } from '@agoric/zoe/src/contractSupport/ratio';

export const isLiquidationPriceBelowGivenPrice = (
  locked: Amount<'nat'>,
  debt: Amount<'nat'>,
  price: Ratio,
  liquidationMargin: Ratio,
) => {
  const totalLockedValue = ceilMultiplyBy(locked, price);

  const collateralizationRatioAtGivenPrice =
    AmountMath.isEmpty(debt) || !totalLockedValue
      ? undefined
      : makeRatioFromAmounts(totalLockedValue, debt);

  return (
    collateralizationRatioAtGivenPrice &&
    !ratioGTE(collateralizationRatioAtGivenPrice, liquidationMargin)
  );
};

export const computeToLock = (
  quotePrice: Ratio,
  collateralizationRatio: Ratio,
  toReceive: NatValue,
  defaultCollateralization: Ratio,
  mintFee: Ratio,
  remainderHandling: 'floor' | 'ceil' = 'floor',
  lockedPrice?: Ratio,
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

  const priceToUse = lowestPrice(quotePrice, lockedPrice);

  return divide(receiveMargin, priceToUse).value;
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

const lowestPrice = (priceA: Ratio, priceB?: Ratio) =>
  priceB ? (ratioGTE(priceA, priceB) ? priceB : priceA) : priceA;

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
  lockedPrice?: Ratio,
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

  const priceRatio = makeRatioFromAmounts(price.amountOut, price.amountIn);

  // The lower of the next start price (if price lock period is active) and
  // the quote price.
  const priceToUse = lowestPrice(priceRatio, lockedPrice);

  const lockedValue = floorMultiplyBy(locked, priceToUse);

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
  quotePrice: PriceDescription,
  locked: Amount<'nat'>,
  debt: Amount<'nat'>,
  lockedPrice?: Ratio,
) => {
  const priceRatio = makeRatioFromAmounts(
    quotePrice.amountOut,
    quotePrice.amountIn,
  );
  const priceToUse = lowestPrice(priceRatio, lockedPrice);

  const totalLockedValue = ceilMultiplyBy(locked, priceToUse);

  return AmountMath.isEmpty(debt)
    ? undefined
    : makeRatioFromAmounts(totalLockedValue, debt);
};

export const currentCollateralization = (
  debtSnapshot: DebtSnapshot,
  compoundedInterest: Ratio,
  quotePrice: PriceDescription,
  locked: Amount<'nat'>,
  lockedPrice?: Ratio,
): Ratio | undefined => {
  const priceRatio = makeRatioFromAmounts(
    quotePrice.amountOut,
    quotePrice.amountIn,
  );
  const priceToUse = lowestPrice(priceRatio, lockedPrice);

  const totalDebt = calculateCurrentDebt(
    debtSnapshot.debt,
    debtSnapshot.interest,
    compoundedInterest,
  );

  return collateralizationRatio(
    { amountIn: priceToUse.denominator, amountOut: priceToUse.numerator },
    locked,
    totalDebt,
  );
};

export const isVaultAtRisk = (
  vault: VaultInfo,
  managers: Map<string, VaultManager>,
  vaultParams: Map<string, VaultParams>,
  prices: Map<Brand, PriceDescription>,
  books: Map<string, LiquidationAuctionBook>,
  schedule: LiquidationSchedule | null,
) => {
  const isLiquidating = vault.vaultState === 'liquidating';
  const manager = managers.get(vault.managerId ?? '');
  const params = vaultParams.get(vault.managerId ?? '');
  const { debtSnapshot, locked } = vault;
  const brand = locked?.brand;
  const price = brand && prices.get(brand);
  const book = books.get(vault?.managerId ?? '');

  if (!(debtSnapshot && manager && price && params)) {
    return false;
  }

  // If `activeStartTime` is truthy, then `startPrice` is the *current* auction price, so ignore.
  const nextAuctionPrice = !schedule?.activeStartTime && book?.startPrice;

  const totalDebt = calculateCurrentDebt(
    debtSnapshot.debt,
    debtSnapshot.interest,
    manager.compoundedInterest,
  );

  const isLiquidationPriceBelowOraclePrice = isLiquidationPriceBelowGivenPrice(
    locked,
    totalDebt,
    makeRatioFromAmounts(price.amountOut, price.amountIn),
    params.liquidationMargin,
  );

  const isLiquidationPriceBelowNextAuctionPrice =
    nextAuctionPrice &&
    isLiquidationPriceBelowGivenPrice(
      locked,
      totalDebt,
      nextAuctionPrice,
      params.liquidationMargin,
    );

  return (
    (isLiquidationPriceBelowOraclePrice ||
      isLiquidationPriceBelowNextAuctionPrice) &&
    !isLiquidating
  );
};
