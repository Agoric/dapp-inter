import { atom } from 'jotai';
import { vaultStoreAtom } from './vaults';
import { makeRatioFromAmounts } from '@agoric/zoe/src/contractSupport';
import { computeToLock, computeToReceive } from 'utils/vaultMath';
import { pursesAtom } from './app';
import {
  addRatios,
  ceilMultiplyBy,
  ratioGTE,
} from '@agoric/zoe/src/contractSupport/ratio';
import { AmountMath } from '@agoric/ertp';
import type { Ratio } from './vaults';
import type { Amount } from '@agoric/ertp/src/types';
import type { Getter } from 'jotai';

const valueToLockInternal = atom<bigint | null>(null);
const valueToReceiveInternal = atom<bigint | null>(null);
const collateralizationRatioInternal = atom<Ratio | null>(null);
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

  return { defaultCollateralizationRatio, priceRate, loanFee };
};

export type VaultCreationErrors = {
  toLockError?: string;
  toReceiveError?: string;
  collateralizationRatioError?: string;
};

export const valueToLockAtom = atom(
  get => get(valueToLockInternal),
  (get, set, value: bigint) => {
    set(valueToLockInternal, value);

    const selectedCollateralId = get(selectedCollateralIdInternal);
    if (!selectedCollateralId) {
      return;
    }

    const collateralizationRatio = get(collateralizationRatioInternal);
    const { priceRate, defaultCollateralizationRatio, loanFee } =
      getVaultInputData(get, selectedCollateralId);

    if (
      priceRate &&
      defaultCollateralizationRatio &&
      collateralizationRatio &&
      loanFee
    ) {
      set(
        valueToReceiveInternal,
        computeToReceive(
          priceRate,
          collateralizationRatio,
          value,
          defaultCollateralizationRatio,
          loanFee,
        ),
      );
    }
  },
);

export const valueToReceiveAtom = atom(
  get => get(valueToReceiveInternal),
  (get, set, value: bigint) => {
    set(valueToReceiveInternal, value);

    const selectedCollateralId = get(selectedCollateralIdInternal);
    if (!selectedCollateralId) {
      return;
    }

    const collateralizationRatio = get(collateralizationRatioInternal);
    const { priceRate, defaultCollateralizationRatio, loanFee } =
      getVaultInputData(get, selectedCollateralId);

    if (
      priceRate &&
      defaultCollateralizationRatio &&
      collateralizationRatio &&
      loanFee
    ) {
      set(
        valueToLockInternal,
        computeToLock(
          priceRate,
          collateralizationRatio,
          value,
          defaultCollateralizationRatio,
          loanFee,
        ),
      );
    }
  },
);

export const collateralizationRatioAtom = atom(
  get => get(collateralizationRatioInternal),
  (get, set, ratio: Ratio) => {
    set(collateralizationRatioInternal, ratio);

    const valueToLock = get(valueToLockInternal);
    const selectedCollateralId = get(selectedCollateralIdInternal);
    if (!(valueToLock && selectedCollateralId)) {
      return;
    }

    const { priceRate, defaultCollateralizationRatio, loanFee } =
      getVaultInputData(get, selectedCollateralId);

    if (priceRate && defaultCollateralizationRatio && loanFee) {
      set(
        valueToReceiveInternal,
        computeToReceive(
          priceRate,
          ratio,
          valueToLock,
          defaultCollateralizationRatio,
          loanFee,
        ),
      );
    }
  },
);

export const selectedCollateralIdAtom = atom(
  get => get(selectedCollateralIdInternal),
  (get, set, selectedCollateralId: string | null) => {
    set(selectedCollateralIdInternal, selectedCollateralId);

    if (selectedCollateralId === null) {
      set(valueToReceiveInternal, null);
      set(valueToLockInternal, null);
      set(collateralizationRatioInternal, null);
      return;
    }

    const { priceRate, defaultCollateralizationRatio, loanFee } =
      getVaultInputData(get, selectedCollateralId);

    if (defaultCollateralizationRatio) {
      set(collateralizationRatioInternal, defaultCollateralizationRatio);
    } else {
      set(collateralizationRatioInternal, null);
    }

    const { vaultFactoryParams } = get(vaultStoreAtom);
    const defaultValueReceived = vaultFactoryParams?.minInitialDebt;
    if (defaultValueReceived) {
      set(valueToReceiveInternal, defaultValueReceived.value);
    } else {
      set(valueToReceiveInternal, null);
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
      );
      set(valueToLockInternal, valueToLock);
    } else {
      set(valueToLockInternal, null);
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

  if (selectedMetrics && selectedParams && valueToReceive) {
    const istAvailable = AmountMath.subtract(
      selectedParams.debtLimit,
      selectedMetrics.totalDebt,
    ).value;

    const { loanFee } = selectedParams;
    const loanFeeMultiplier = addRatios(
      loanFee,
      makeRatioFromAmounts(loanFee.denominator, loanFee.denominator),
    );

    const resultingDebt = ceilMultiplyBy(
      AmountMath.make(selectedMetrics.totalDebt.brand, valueToReceive),
      loanFeeMultiplier,
    ).value;

    if (istAvailable < resultingDebt) {
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
