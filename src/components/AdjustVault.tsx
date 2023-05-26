import { useAtomValue, useSetAtom } from 'jotai';
import { displayFunctionsAtom } from 'store/app';
import { ViewMode, useVaultStore, viewModeAtom } from 'store/vaults';
import VaultSymbol from 'svg/vault-symbol';
import clsx from 'clsx';
import AdjustVaultForm from './AdjustVaultForm';
import AdjustVaultSummary from './AdjustVaultSummary';
import { useCallback } from 'react';
import { netValue } from 'utils/vaultMath';
import { vaultToAdjustAtom } from 'store/adjustVault';
import { useAuctionTimer } from 'utils/hooks';
import { AdjustVaultInstructions } from './AdjustVaultInstructions';

const AdjustVault = () => {
  const displayFunctions = useAtomValue(displayFunctionsAtom);
  assert(
    displayFunctions,
    'Adjust vault requires display functions to be loaded',
  );
  const {
    displayPrice,
    displayPriceTimestamp,
    displayAmount,
    displayBrandPetname,
  } = displayFunctions;

  const { schedule } = useVaultStore(vaults => ({
    schedule: vaults.liquidationSchedule,
  }));

  const setMode = useSetAtom(viewModeAtom);

  const backButtonProps = {
    text: 'Back to vaults',
    onClick: useCallback(() => setMode(ViewMode.Manage), [setMode]),
  };

  const vaultToAdjust = useAtomValue(vaultToAdjustAtom);
  assert(vaultToAdjust, 'Adjust vault requires a selected vault');

  const {
    locked,
    indexWithinManager,
    collateralPrice,
    totalLockedValue,
    totalDebt,
    lockedPrice,
    isAtRisk,
  } = vaultToAdjust;

  const [netVaultValue, isNetValueNegative] = netValue(
    totalLockedValue,
    totalDebt,
  );

  // TODO: Update dynamically.
  const vaultLabel = 'ATOM';

  const auctionTimer = useAuctionTimer(schedule);

  return (
    <>
      {isAtRisk && (
        <div className="text-[#E22951] text-lg mt-4 font-serif font-medium">
          This vault is at risk. Please increase your collateral or repay your
          outstanding IST debt to avoid liquidation.
        </div>
      )}
      <div className="w-full flex justify-between mt-6 flex-wrap">
        <div className="font-serif flex items-baseline gap-3">
          <div className="font-medium text-2xl">{vaultLabel}</div>
          <div className="text-[#A3A5B9] text-sm">#{indexWithinManager}</div>
        </div>
        <div className="flex gap-8">
          <div>
            Current Price:{' '}
            <span className="font-medium text-lg">
              {displayPrice(collateralPrice)}
            </span>
          </div>
          <div>
            Last Price Update:{' '}
            <span className="font-medium text-lg whitespace-nowrap">
              {displayPriceTimestamp(collateralPrice)}
            </span>
          </div>
          {lockedPrice && (
            <div>
              Next Liquidation Price:{' '}
              <span className="font-medium text-lg whitespace-nowrap">
                {displayPrice({
                  amountIn: lockedPrice.denominator,
                  amountOut: lockedPrice.numerator,
                })}
              </span>
              {auctionTimer && (
                <>
                  {' - '}
                  <span className="italic">{auctionTimer}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="mt-6 rounded-10 p-4 px-8 flex justify-between flex-wrap gap-8 bg-[#FFF4C0]">
        <div className="flex items-center gap-3">
          <span className="fill-interYellow align-bottom relative top-[1px]">
            <VaultSymbol />
          </span>
          <span className="font-medium text-xl">
            {displayAmount(locked, 2, 'locale')}{' '}
            {displayBrandPetname(locked.brand)}
          </span>
        </div>
        <div className="text-lg">
          Net Equity:{' '}
          <span
            className={clsx(
              'font-medium',
              isNetValueNegative ? 'text-red-500' : 'text-[#00B1A6]',
            )}
          >
            {isNetValueNegative && '-'}
            {displayAmount(netVaultValue, 2, 'usd')}
          </span>
        </div>
        <div className="text-lg">
          Collateral Value:{' '}
          <span className="font-medium">
            {displayAmount(totalLockedValue, 2, 'usd')}
          </span>
        </div>
        <div className="text-lg">
          Outstanding Debt:{' '}
          <span className="font-medium">
            {displayAmount(totalDebt, 2, 'locale')}{' '}
            {displayBrandPetname(totalDebt.brand)}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap justify-between mt-12">
        <div className="text-xl font-bold font-serif">Adjust Vault</div>
        <button
          className="text-btn-xs transition mr-1 text-[#A3A5B9] rounded-md border-2 border-solid border-[#A3A5B9] py-3 px-7 leading-[14px] font-bold text-xs bg-gray-500 bg-opacity-0 hover:bg-opacity-10 active:bg-opacity-20"
          onClick={backButtonProps.onClick}
        >
          {backButtonProps.text}
        </button>
      </div>
      <div className="mt-8 grid grid-cols-5 gap-8">
        <div className="col-span-9 lg:col-span-3">
          <AdjustVaultForm />
        </div>
        <div className="col-span-9 gap-8 lg:col-span-2 flex flex-col lg:gap-16">
          <AdjustVaultSummary />
          <AdjustVaultInstructions />
        </div>
      </div>
    </>
  );
};

export default AdjustVault;
