import { atom } from 'jotai';
import { vaultStoreAtom } from './vaults';
import { makeRatioFromAmounts } from '@agoric/zoe/src/contractSupport';
import {
  collateralizationRatio,
  computeToLock,
  debtAfterChange,
  istAvailable,
} from 'utils/vaultMath';
import { pursesAtom } from './app';
import { ratioGTE } from '@agoric/zoe/src/contractSupport/ratio';
import { AmountMath } from '@agoric/ertp';
import type { Amount, NatValue } from '@agoric/ertp/src/types';
import type { Getter } from 'jotai';
import { DebtAction } from './adjustVault';
import { displayFunctionsAtom } from './app';

export const valueToLockAtom = atom<NatValue | null>(null);
export const valueToReceiveAtom = atom<NatValue | null>(null);

const selectedCollateralIdInternal = atom<string | null>(null);

const getVaultInputData = (get: Getter, selectedCollateralId: string) => {
  const { vaultMetrics, vaultGovernedParams, prices } = get(vaultStoreAtom);

  const collateralBrand =
    selectedCollateralId && vaultMetrics?.has(selectedCollateralId)
      ? vaultMetrics.get(selectedCollateralId)?.retainedCollateral.brand
      : null;

  const collateralPriceDescription =
    collateralBrand && prices.get(collateralBrand);

  const priceRate =
    collateralPriceDescription &&
    makeRatioFromAmounts(
      collateralPriceDescription.amountOut,
      collateralPriceDescription.amountIn,
    );

  const selectedParams =
    selectedCollateralId && vaultGovernedParams?.has(selectedCollateralId)
      ? vaultGovernedParams.get(selectedCollateralId)
      : null;

  const defaultCollateralizationRatio = selectedParams
    ? selectedParams.inferredMinimumCollateralization
    : null;

  const mintFee = selectedParams ? selectedParams.mintFee : null;

  return {
    defaultCollateralizationRatio,
    priceRate,
    mintFee,
    collateralPriceDescription,
  };
};

export type VaultCreationErrors = {
  toLockError?: string;
  toReceiveError?: string;
  collateralizationRatioError?: string;
};

export const collateralizationRatioAtom = atom(get => {
  const selectedCollateralId = get(selectedCollateralIdAtom);
  const valueToLock = get(valueToLockAtom);
  const valueToReceive = get(valueToReceiveAtom);

  if (
    !selectedCollateralId ||
    valueToLock === null ||
    valueToReceive === null
  ) {
    return undefined;
  }

  const { collateralPriceDescription: price, mintFee } = getVaultInputData(
    get,
    selectedCollateralId,
  );

  if (!price || !mintFee) {
    return undefined;
  }

  const toReceive = AmountMath.make(price.amountOut.brand, valueToReceive);
  const debt = debtAfterChange(
    DebtAction.Mint,
    mintFee,
    AmountMath.makeEmpty(toReceive.brand),
    toReceive,
  );

  return collateralizationRatio(
    price,
    AmountMath.make(price.amountIn.brand, valueToLock),
    debt,
  );
});

export const selectedCollateralIdAtom = atom(
  get => get(selectedCollateralIdInternal),
  (get, set, selectedCollateralId: string | null) => {
    set(selectedCollateralIdInternal, selectedCollateralId);

    if (selectedCollateralId === null) {
      set(valueToReceiveAtom, null);
      set(valueToLockAtom, null);
      return;
    }

    const { priceRate, defaultCollateralizationRatio, mintFee } =
      getVaultInputData(get, selectedCollateralId);

    const { vaultFactoryParams } = get(vaultStoreAtom);
    const defaultValueReceived = vaultFactoryParams?.minInitialDebt;
    if (defaultValueReceived) {
      set(valueToReceiveAtom, defaultValueReceived.value);
    } else {
      set(valueToReceiveAtom, null);
    }

    if (
      defaultCollateralizationRatio &&
      priceRate &&
      defaultValueReceived &&
      mintFee
    ) {
      const valueToLock = computeToLock(
        priceRate,
        defaultCollateralizationRatio,
        defaultValueReceived.value,
        defaultCollateralizationRatio,
        mintFee,
        'ceil',
      );
      set(valueToLockAtom, valueToLock);
    } else {
      set(valueToLockAtom, null);
    }
  },
);

export const inputErrorsAtom = atom<VaultCreationErrors>(get => {
  let toLockError;
  let toReceiveError;
  let collateralizationRatioError;

  const collateralizationRatio = get(collateralizationRatioAtom);
  const selectedCollateralId = get(selectedCollateralIdAtom);
  const valueToReceive = get(valueToReceiveAtom);
  const valueToLock = get(valueToLockAtom);
  const purses = get(pursesAtom);
  const { displayAmount } = get(displayFunctionsAtom) ?? {};

  const { vaultGovernedParams, vaultMetrics, vaultFactoryParams } =
    get(vaultStoreAtom);

  const selectedParams =
    selectedCollateralId && vaultGovernedParams?.has(selectedCollateralId)
      ? vaultGovernedParams.get(selectedCollateralId)
      : null;

  if (selectedParams && collateralizationRatio) {
    const defaultCollateralizationRatio =
      selectedParams.inferredMinimumCollateralization;
    if (
      collateralizationRatio.numerator.value === 0n ||
      !ratioGTE(collateralizationRatio, defaultCollateralizationRatio)
    ) {
      collateralizationRatioError = 'Below minimum';
    }
  }

  const selectedMetrics =
    selectedCollateralId && vaultMetrics?.has(selectedCollateralId)
      ? vaultMetrics.get(selectedCollateralId)
      : null;

  if (selectedMetrics && selectedParams) {
    const mintedAvailable = istAvailable(
      selectedParams.debtLimit,
      selectedMetrics.totalDebt,
    );

    const { mintFee } = selectedParams;

    if (
      mintFee &&
      valueToReceive &&
      !AmountMath.isGTE(
        mintedAvailable,
        debtAfterChange(
          DebtAction.Mint,
          mintFee,
          AmountMath.makeEmpty(mintedAvailable.brand),
          AmountMath.make(mintedAvailable.brand, valueToReceive),
        ),
      )
    ) {
      toReceiveError = 'Exceeds amount available';
    }
  }

  const { minInitialDebt } = vaultFactoryParams ?? {};
  const minInitialDebtValue = minInitialDebt?.value ?? 0n;

  if (selectedCollateralId && minInitialDebtValue > 0n) {
    if (!valueToReceive || valueToReceive < minInitialDebtValue) {
      if (displayAmount && minInitialDebt) {
        toReceiveError = `Below minimum of ${displayAmount(minInitialDebt)}`;
      } else {
        toReceiveError = 'Below minimum';
      }
    }
  }

  if (selectedMetrics) {
    if (!purses) {
      toLockError = 'Need to connect wallet';
    } else {
      const collateralPurse = purses.find(
        ({ brand }) => brand === selectedMetrics.totalCollateral.brand,
      );

      if (
        !collateralPurse ||
        (collateralPurse.currentAmount as Amount<'nat'>).value <
          (valueToLock ?? 0n)
      ) {
        toLockError = 'Need to obtain funds';
      }
    }
  }

  return { toLockError, toReceiveError, collateralizationRatioError };
});
