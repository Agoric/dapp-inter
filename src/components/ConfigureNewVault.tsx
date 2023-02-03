import AmountInput from 'components/AmountInput';
import RatioPercentInput from 'components/RatioPercentInput';
import { useAtom, useAtomValue } from 'jotai';
import { displayFunctionsAtom } from 'store/app';
import {
  collateralizationRatioAtom,
  selectedCollateralIdAtom,
  valueToLockAtom,
  valueToReceiveAtom,
  VaultCreationErrors,
} from 'store/createVault';
import { useVaultStore } from 'store/vaults';
import { usePurseBalanceDisplay } from 'utils/hooks';

type Props = {
  inputErrors: VaultCreationErrors;
};

const ConfigureNewVault = ({ inputErrors }: Props) => {
  const { collateralizationRatioError, toLockError, toReceiveError } =
    inputErrors;

  const { metrics, params, prices } = useVaultStore(vaults => ({
    metrics: vaults.vaultMetrics,
    params: vaults.vaultGovernedParams,
    prices: vaults.prices,
  }));

  const { displayPercent, displayBrandPetname } =
    useAtomValue(displayFunctionsAtom) ?? {};

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

  const hasPriceFeed = collateralBrand && prices.has(collateralBrand);

  const borrowedBrand = selectedMetrics
    ? selectedMetrics.totalDebt.brand
    : null;

  const selectedParams =
    selectedCollateralId && params?.has(selectedCollateralId)
      ? params.get(selectedCollateralId)
      : null;

  const isInputReady: boolean = !!(
    hasPriceFeed &&
    selectedParams &&
    selectedMetrics
  );

  const purseBalance = usePurseBalanceDisplay(collateralBrand);

  const toLockLabel =
    displayBrandPetname && collateralBrand
      ? `${displayBrandPetname(collateralBrand)} to lock up *`
      : 'To lock up *';

  return (
    <div className="mt-8 px-12 py-8 bg-white rounded-[20px] shadow-[0_40px_40px_0_rgba(116,116,116,0.25)]">
      <h3 className="mb-3 font-serif font-bold leading-[26px]">Configure</h3>
      <p className="font-serif text-[#666980] leading-[26px]">
        Choose your vault parameters.
      </p>
      <div className="mt-4 mb-4 text-sm font-serif text-[#666980]">
        <span className="font-bold">{purseBalance}</span> Available
      </div>
      <div className="flex gap-x-20 gap-y-6 flex-wrap">
        <AmountInput
          onChange={setValueToLock}
          brand={collateralBrand}
          value={valueToLock}
          disabled={!isInputReady}
          label={toLockLabel}
          error={toLockError}
        />
        <RatioPercentInput
          onChange={setCollateralizationRatio}
          value={collateralizationRatio}
          disabled={!isInputReady}
          label="Collateralization percent *"
          error={collateralizationRatioError}
        />
        <AmountInput
          onChange={setValueToReceive}
          brand={borrowedBrand}
          value={valueToReceive}
          disabled={!isInputReady}
          label="IST to receive *"
          error={toReceiveError}
        />
      </div>
      <p className="mt-12 italic font-serif text-[#666980] text-sm leading-[22px]">
        {selectedParams && displayPercent
          ? `A vault creation fee of ${displayPercent(
              selectedParams.loanFee,
              2,
            )}%
          will be charged on vault creation.`
          : 'A vault creation fee will be charged on vault creation'}
      </p>
    </div>
  );
};

export default ConfigureNewVault;
