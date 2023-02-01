import { atom } from 'jotai';
import { useVaultStore } from './vaults';
import { makeRatioFromAmounts } from '@agoric/zoe/src/contractSupport';
import type { Ratio } from './vaults';
import { computeToLock, computeToReceive } from 'utils/vaultMath';

const valueToLockInternal = atom<bigint | null>(null);
const valueToReceiveInternal = atom<bigint | null>(null);
const collateralizationRatioInternal = atom<Ratio | null>(null);
const selectedCollateralIdInternal = atom<string | null>(null);

const getVaultInputData = (selectedCollateralId: string) => {
  const { vaultMetrics, vaultGovernedParams, prices } =
    useVaultStore.getState();

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

  // TODO: Use min collateral ratio rather than liquidation margin when available.
  const defaultCollateralizationRatio = selectedParams
    ? selectedParams.liquidationMargin
    : null;

  return { defaultCollateralizationRatio, priceRate };
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
    const { priceRate, defaultCollateralizationRatio } =
      getVaultInputData(selectedCollateralId);

    if (priceRate && defaultCollateralizationRatio && collateralizationRatio) {
      set(
        valueToReceiveInternal,
        computeToReceive(
          priceRate,
          collateralizationRatio,
          value,
          defaultCollateralizationRatio,
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
    const { priceRate, defaultCollateralizationRatio } =
      getVaultInputData(selectedCollateralId);

    if (priceRate && defaultCollateralizationRatio && collateralizationRatio) {
      set(
        valueToLockInternal,
        computeToLock(
          priceRate,
          collateralizationRatio,
          value,
          defaultCollateralizationRatio,
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

    const { priceRate, defaultCollateralizationRatio } =
      getVaultInputData(selectedCollateralId);

    if (priceRate && defaultCollateralizationRatio) {
      set(
        valueToReceiveInternal,
        computeToReceive(
          priceRate,
          ratio,
          valueToLock,
          defaultCollateralizationRatio,
        ),
      );
    }
  },
);

export const selectedCollateralIdAtom = atom(
  get => get(selectedCollateralIdInternal),
  (_get, set, selectedCollateralId: string) => {
    set(selectedCollateralIdInternal, selectedCollateralId);

    const { priceRate, defaultCollateralizationRatio } =
      getVaultInputData(selectedCollateralId);

    if (defaultCollateralizationRatio) {
      set(collateralizationRatioInternal, defaultCollateralizationRatio);
    } else {
      set(collateralizationRatioInternal, null);
    }

    const { vaultFactoryParams } = useVaultStore.getState();
    const defaultValueReceived = vaultFactoryParams?.minInitialDebt;
    if (defaultValueReceived) {
      set(valueToReceiveInternal, defaultValueReceived.value);
    } else {
      set(valueToReceiveInternal, null);
    }

    if (defaultCollateralizationRatio && priceRate && defaultValueReceived) {
      const valueToLock = computeToLock(
        priceRate,
        defaultCollateralizationRatio,
        defaultValueReceived.value,
        defaultCollateralizationRatio,
      );
      set(valueToLockInternal, valueToLock);
    } else {
      set(valueToLockInternal, null);
    }
  },
);
