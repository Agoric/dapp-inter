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

  const loanFee = selectedParams ? selectedParams.loanFee : null;

  return {
    defaultCollateralizationRatio,
    priceRate,
    loanFee,
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

  const { collateralPriceDescription: price, loanFee } = getVaultInputData(
    get,
    selectedCollateralId,
  );

  if (!price || !loanFee) {
    return undefined;
  }

  const toReceive = AmountMath.make(price.amountOut.brand, valueToReceive);
  const debt = debtAfterChange(
    DebtAction.Borrow,
    loanFee,
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

    const { priceRate, defaultCollateralizationRatio, loanFee } =
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
      loanFee
    ) {
      const valueToLock = computeToLock(
        priceRate,
        defaultCollateralizationRatio,
        defaultValueReceived.value,
        defaultCollateralizationRatio,
        loanFee,
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

    const { loanFee } = selectedParams;

    if (
      loanFee &&
      valueToReceive &&
      !AmountMath.isGTE(
        mintedAvailable,
        debtAfterChange(
          DebtAction.Borrow,
          loanFee,
          AmountMath.makeEmpty(mintedAvailable.brand),
          AmountMath.make(mintedAvailable.brand, valueToReceive),
        ),
      )
    ) {
      toReceiveError = 'Exceeds amount available';
    }
  }

  const minInitialDebt = vaultFactoryParams?.minInitialDebt?.value ?? 0n;

  if (selectedCollateralId && minInitialDebt > 0n) {
    if (!valueToReceive || valueToReceive < minInitialDebt) {
      toReceiveError = 'Below minimum';
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
