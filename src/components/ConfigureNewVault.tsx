import { AmountMath } from '@agoric/ertp';
import AmountInput from 'components/AmountInput';
import RatioPercentInput from 'components/RatioPercentInput';
import { useAtom, useAtomValue } from 'jotai';
import { displayFunctionsAtom } from 'store/app';
import {
  collateralizationRatioAtom,
  inputErrorsAtom,
  selectedCollateralIdAtom,
  valueToLockAtom,
  valueToReceiveAtom,
} from 'store/createVault';
import { useVaultStore } from 'store/vaults';
import {
  useAuctionTimer,
  usePurseBalanceDisplay,
  usePurseForBrand,
} from 'utils/hooks';
import { maxIstToMintFromVault } from 'utils/vaultMath';
import LeapLiquidityModal, { Direction } from './leap-elements/LiquidityModal';
import { useMemo } from 'react';
import { NatValue } from '@agoric/ertp/src/types';

const maxIstWarning =
  'Warning: This will create a vault with the lowest possible collateralization ratio which greatly increases your risk of liquidation if there are downward price movements.';

const ConfigureNewVault = () => {
  const { collateralizationRatioError, toLockError, toReceiveError } =
    useAtomValue(inputErrorsAtom);

  const { metrics, params, prices, schedule } = useVaultStore(vaults => ({
    metrics: vaults.vaultMetrics,
    params: vaults.vaultGovernedParams,
    prices: vaults.prices,
    schedule: vaults.liquidationSchedule,
  }));

  const { displayPercent, displayBrandPetname, displayPrice } =
    useAtomValue(displayFunctionsAtom) ?? {};

  const [valueToLock, setValueToLock] = useAtom(valueToLockAtom);
  const [valueToReceive, setValueToReceive] = useAtom(valueToReceiveAtom);
  const collateralizationRatio = useAtomValue(collateralizationRatioAtom);

  const selectedCollateralId = useAtomValue(selectedCollateralIdAtom);

  const selectedMetrics =
    selectedCollateralId && metrics?.has(selectedCollateralId)
      ? metrics.get(selectedCollateralId)
      : null;

  const collateralBrand = selectedMetrics
    ? selectedMetrics.retainedCollateral.brand
    : null;

  const collateralPrice = collateralBrand && prices.get(collateralBrand);

  const mintedBrand = selectedMetrics ? selectedMetrics.totalDebt.brand : null;

  const selectedParams =
    selectedCollateralId && params?.has(selectedCollateralId)
      ? params.get(selectedCollateralId)
      : null;

  const isInputReady: boolean = !!(
    collateralPrice &&
    selectedParams &&
    selectedMetrics
  );

  const purseBalance = usePurseBalanceDisplay(collateralBrand);

  const toLockLabel =
    displayBrandPetname && collateralBrand
      ? `${displayBrandPetname(collateralBrand)} to lock up *`
      : 'To lock up *';

  const collateralPriceForDisplay =
    displayBrandPetname &&
    displayPrice &&
    collateralPrice &&
    `1 ${displayBrandPetname(collateralBrand)} = ${displayPrice(
      collateralPrice,
    )}`;

  // Start price of next auction if yet determined, otherwise undefined.
  const lockedPrice = selectedMetrics?.lockedQuote;

  const lockedPriceForDisplay =
    displayBrandPetname &&
    displayPrice &&
    lockedPrice &&
    `${displayPrice({
      amountIn: lockedPrice.denominator,
      amountOut: lockedPrice.numerator,
    })}`;

  const maxIst = useMemo(() => {
    if (!(selectedParams && selectedMetrics && collateralPrice)) {
      return undefined;
    }
    return maxIstToMintFromVault(
      selectedParams.debtLimit,
      selectedMetrics.totalDebt,
      AmountMath.makeEmpty(selectedParams.debtLimit.brand),
      selectedParams.mintFee,
      AmountMath.make(collateralBrand, valueToLock ?? 0n),
      collateralPrice,
      selectedParams.inferredMinimumCollateralization,
      lockedPrice,
    );
  }, [
    collateralBrand,
    collateralPrice,
    lockedPrice,
    selectedMetrics,
    selectedParams,
    valueToLock,
  ]);

  const timeUntilAuction = useAuctionTimer(schedule);

  const purse = usePurseForBrand(collateralBrand);

  const onMaxCollateralClicked = () => {
    if (!purse) {
      return;
    }

    setValueToLock(purse.currentAmount.value as NatValue);
  };

  const onMaxDebtClicked = () => {
    if (!maxIst) {
      return;
    }

    setValueToReceive(maxIst);
  };

  const istInputWarning = valueToReceive === maxIst ? maxIstWarning : undefined;

  return (
    <div className="mt-8 px-12 py-8 bg-white rounded-20 shadow-card">
      <h3 className="mb-3 font-serif font-bold leading-[26px]">Configure</h3>
      <p className="font-serif text-alternative leading-[26px]">
        Choose your vault parameters.
      </p>
      <div className="mt-4 mb-4 flex flex-wrap gap-x-10 gap-y-4 text-sm font-serif text-alternative">
        <div>
          <span className="font-bold">{purseBalance}</span> Available
        </div>
        <div>{collateralPriceForDisplay}</div>
        <div>
          {lockedPrice && (
            <>
              Next Liquidation Price: {lockedPriceForDisplay}
              {timeUntilAuction ? ' - ' : ''}
              <span className="italic">{timeUntilAuction}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex gap-x-20 gap-y-6 flex-wrap">
        <AmountInput
          onChange={setValueToLock}
          brand={collateralBrand}
          value={valueToLock}
          disabled={!isInputReady}
          label={toLockLabel}
          error={toLockError}
          actionLabel="Max"
          onAction={onMaxCollateralClicked}
        />
        <RatioPercentInput
          onChange={() => {
            /* always disabled */
          }}
          value={collateralizationRatio}
          disabled={true}
          label="Collateralization Ratio"
          error={collateralizationRatioError}
        />
        <AmountInput
          onChange={setValueToReceive}
          brand={mintedBrand}
          value={valueToReceive}
          disabled={!isInputReady}
          label="IST to receive *"
          actionLabel="Max"
          onAction={onMaxDebtClicked}
          error={toReceiveError || istInputWarning}
        />
      </div>
      <p className="mt-12 italic font-serif text-alternative text-sm leading-[22px]">
        {selectedParams && displayPercent
          ? `A minting fee of ${displayPercent(selectedParams.mintFee, 2)}%
          will be charged upon vault creation.`
          : 'A minting fee will be charged upon vault creation.'}
      </p>
      <div className="flex flex-row justify-end">
        <div className="mt-4">
          <LeapLiquidityModal
            direction={Direction.deposit}
            selectedAsset={collateralBrand}
          />
        </div>
      </div>
    </div>
  );
};

export default ConfigureNewVault;
