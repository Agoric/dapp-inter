import AmountInput from 'components/AmountInput';
import RatioPercentInput from 'components/RatioPercentInput';
import { useAtom, useAtomValue } from 'jotai';
import { useEffect } from 'react';
import {
  collateralizationRatioAtom,
  selectedCollateralIdAtom,
  valueToLockAtom,
  valueToReceiveAtom,
} from 'store/createVault';
import { useVaultStore } from 'store/vaults';
import type { Ratio } from 'store/vaults';
import {
  floorDivideBy,
  floorMultiplyBy,
  makeRatioFromAmounts,
} from '@agoric/zoe/src/contractSupport';
import { AmountMath } from '@agoric/ertp';

const computeToReceive = (
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

const computeToLock = (
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

const ConfigureNewVault = () => {
  const { metrics, params, prices } = useVaultStore(vaults => ({
    metrics: vaults.vaultMetrics,
    params: vaults.vaultGovernedParams,
    prices: vaults.prices,
  }));

  const [valueToLock, setValueToLock] = useAtom(valueToLockAtom);
  const [valueToReceive, setValueToReceive] = useAtom(valueToReceiveAtom);
  const [collateralizationRatio, setCollateralizationRatio] = useAtom(
    collateralizationRatioAtom,
  );

  const selectedCollateralId = useAtomValue(selectedCollateralIdAtom);

  const collateralBrand =
    selectedCollateralId && metrics?.has(selectedCollateralId)
      ? metrics.get(selectedCollateralId)?.retainedCollateral.brand
      : null;

  const borrowedBrand =
    selectedCollateralId && metrics?.has(selectedCollateralId)
      ? metrics.get(selectedCollateralId)?.totalDebt.brand
      : null;

  const selectedParams =
    selectedCollateralId && params?.has(selectedCollateralId)
      ? params.get(selectedCollateralId)
      : null;

  // TODO: Set this to min. collat. ratio when available.
  const defaultCollateralizationRatio =
    selectedParams && selectedParams.liquidationMargin;

  const collateralPriceDescription =
    collateralBrand && prices.get(collateralBrand);

  const priceRate =
    collateralPriceDescription &&
    makeRatioFromAmounts(
      collateralPriceDescription.amountOut,
      collateralPriceDescription.amountIn,
    );

  const canHandleInputs = !!priceRate && !!defaultCollateralizationRatio;

  const onLockedValueChange = (value: bigint) => {
    if (!canHandleInputs) return;

    const toReceive = computeToReceive(
      priceRate,
      collateralizationRatio,
      value,
      defaultCollateralizationRatio,
    );

    setValueToReceive(toReceive);
    setValueToLock(value);
  };

  const onReceivedValueChange = (value: bigint) => {
    if (!canHandleInputs) return;

    const toLock = computeToLock(
      priceRate,
      collateralizationRatio,
      value,
      defaultCollateralizationRatio,
    );

    setValueToLock(toLock);
    setValueToReceive(value);
  };

  const onCollateralizationRatioChange = (value: Ratio) => {
    if (!canHandleInputs) return;

    const toReceive = computeToReceive(
      priceRate,
      value,
      valueToLock ?? 0n,
      defaultCollateralizationRatio,
    );

    setValueToReceive(toReceive);
    setCollateralizationRatio(value);
  };

  // Set defaults when new collateral type is selected.
  useEffect(() => {
    setCollateralizationRatio(defaultCollateralizationRatio);
  }, [defaultCollateralizationRatio, setCollateralizationRatio]);

  return (
    <div className="mt-8 px-12 py-8 bg-white rounded-[20px] shadow-[0_40px_40px_0_rgba(116,116,116,0.25)]">
      <h3 className="mb-3 font-serif font-bold leading-[26px]">Configure</h3>
      <p className="font-serif text-[#666980] leading-[26px]">
        Choose your vault parameters.
      </p>
      <div className="mt-12 flex gap-x-20 gap-y-6 flex-wrap">
        <AmountInput
          onChange={onLockedValueChange}
          brand={collateralBrand}
          value={valueToLock}
          disabled={!canHandleInputs}
          label="Atom to lock up *"
        />
        <RatioPercentInput
          onChange={onCollateralizationRatioChange}
          value={collateralizationRatio}
          disabled={!canHandleInputs}
          label="Collateralization percent *"
        />
        <AmountInput
          onChange={onReceivedValueChange}
          brand={borrowedBrand}
          value={valueToReceive}
          disabled={!canHandleInputs}
          label="IST to receive *"
        />
      </div>
      <p className="mt-12 italic font-serif text-[#666980] text-sm leading-[22px]">
        A vault creation fee will be charged on vault creation.
      </p>
    </div>
  );
};

export default ConfigureNewVault;
