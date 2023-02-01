import { useCallback } from 'react';
import { useVaultStore, ViewMode, viewModeAtom } from 'store/vaults';
import { useAtomValue, useSetAtom } from 'jotai';
import CollateralChoice from 'components/CollateralChoice';
import ConfigureNewVault from 'components/ConfigureNewVault';
import NewVaultOfferSummary from 'components/NewVaultOfferSummary';
import {
  collateralizationRatioAtom,
  selectedCollateralIdAtom,
  valueToLockAtom,
  valueToReceiveAtom,
} from 'store/createVault';
import { compareRatios } from 'utils/vaultMath';
import { AmountMath } from '@agoric/ertp';
import { pursesAtom } from 'store/app';
import type { Amount } from '@agoric/ertp/src/types';

const useVaultInputValidation = () => {
  let toLockError;
  let toReceiveError;
  let collateralizationRatioError;

  const collateralizationRatio = useAtomValue(collateralizationRatioAtom);
  const selectedCollateralId = useAtomValue(selectedCollateralIdAtom);
  const valueToReceive = useAtomValue(valueToReceiveAtom);
  const valueToLock = useAtomValue(valueToLockAtom);
  const purses = useAtomValue(pursesAtom);

  const { vaultGovernedParams, vaultMetrics, vaultFactoryParams } =
    useVaultStore.getState();

  const selectedParams =
    selectedCollateralId && vaultGovernedParams?.has(selectedCollateralId)
      ? vaultGovernedParams.get(selectedCollateralId)
      : null;

  if (selectedParams && collateralizationRatio) {
    // TODO: Use min collateral ratio rather than liquidation margin when available.
    const defaultCollateralizationRatio = selectedParams.liquidationMargin;
    if (
      collateralizationRatio.numerator.value === 0n ||
      compareRatios(defaultCollateralizationRatio, collateralizationRatio) > 0
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

    if (istAvailable < valueToReceive) {
      toReceiveError = 'Exceeds amount available';
    }
  }

  const minInitialDebt = vaultFactoryParams?.minInitialDebt?.value ?? 0n;

  if (!valueToReceive || valueToReceive < minInitialDebt) {
    toReceiveError = 'Below minimum';
  }

  const collateralPurse = (purses ?? []).find(
    ({ brand }) => brand === selectedMetrics?.totalCollateral.brand,
  );

  if (
    !collateralPurse ||
    (collateralPurse.currentAmount as Amount<'nat'>).value < (valueToLock ?? 0n)
  ) {
    toLockError = 'Need to obtain funds';
  }

  return { toLockError, toReceiveError, collateralizationRatioError };
};

const CreateVault = () => {
  const setMode = useSetAtom(viewModeAtom);
  const { vaultManagerIds } = useVaultStore();

  const buttonProps = {
    text: 'Cancel',
    onClick: useCallback(() => setMode(ViewMode.Manage), [setMode]),
  };

  const inputErrors = useVaultInputValidation();

  return (
    <>
      <div className="flex justify-between mt-6 flex-wrap gap-4">
        <div className="font-serif font-medium text-2xl">
          Creating New Vault
        </div>
        <button
          className="transition mr-1 text-[#A3A5B9] uppercase rounded-[6px] border-2 border-solid border-[#A3A5B9] py-2 px-7 leading-[14px] font-semibold text-xs bg-[#A3A5B9] bg-opacity-0 hover:bg-opacity-10 active:bg-opacity-20"
          onClick={buttonProps.onClick}
        >
          {buttonProps.text}
        </button>
      </div>
      <div className="mt-16 grid grid-cols-11 lg:gap-x-[51px]">
        <div className="col-span-11 lg:col-span-7">
          <div className="font-serif font-medium text-2xl mb-8">
            Choose Collateral
          </div>
          <div className="flex flex-row flex-wrap gap-[18.5px]">
            {vaultManagerIds &&
              vaultManagerIds.map(id => <CollateralChoice key={id} id={id} />)}
          </div>
          <ConfigureNewVault inputErrors={inputErrors} />
        </div>
        <div className="mt-8 col-span-11 lg:col-span-4 lg:mt-0">
          <NewVaultOfferSummary inputErrors={inputErrors} />
        </div>
      </div>
    </>
  );
};

export default CreateVault;
