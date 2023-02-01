import AmountInput from 'components/AmountInput';
import RatioPercentInput from 'components/RatioPercentInput';
import { useAtom, useAtomValue } from 'jotai';
import {
  collateralizationRatioAtom,
  selectedCollateralIdAtom,
  valueToLockAtom,
  valueToReceiveAtom,
} from 'store/createVault';
import { useVaultStore } from 'store/vaults';

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

  const selectedMetrics =
    selectedCollateralId && metrics?.has(selectedCollateralId)
      ? metrics.get(selectedCollateralId)
      : null;

  const collateralBrand = selectedMetrics
    ? selectedMetrics.retainedCollateral.brand
    : null;

  const hasPriceFeed = !!collateralBrand && prices.has(collateralBrand);

  const borrowedBrand = selectedMetrics
    ? selectedMetrics.totalDebt.brand
    : null;

  const selectedParams =
    selectedCollateralId && params?.has(selectedCollateralId)
      ? params.get(selectedCollateralId)
      : null;

  const isInputReady = hasPriceFeed && !!selectedParams && !!selectedMetrics;

  return (
    <div className="mt-8 px-12 py-8 bg-white rounded-[20px] shadow-[0_40px_40px_0_rgba(116,116,116,0.25)]">
      <h3 className="mb-3 font-serif font-bold leading-[26px]">Configure</h3>
      <p className="font-serif text-[#666980] leading-[26px]">
        Choose your vault parameters.
      </p>
      <div className="mt-12 flex gap-x-20 gap-y-6 flex-wrap">
        <AmountInput
          onChange={setValueToLock}
          brand={collateralBrand}
          value={valueToLock}
          disabled={!isInputReady}
          label="Atom to lock up *"
        />
        <RatioPercentInput
          onChange={setCollateralizationRatio}
          value={collateralizationRatio}
          disabled={!isInputReady}
          label="Collateralization percent *"
        />
        <AmountInput
          onChange={setValueToReceive}
          brand={borrowedBrand}
          value={valueToReceive}
          disabled={!isInputReady}
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
