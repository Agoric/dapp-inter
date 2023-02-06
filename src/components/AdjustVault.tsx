import { useAtomValue, useSetAtom } from 'jotai';
import { displayFunctionsAtom } from 'store/app';
import {
  useVaultStore,
  vaultKeyToAdjustAtom,
  ViewMode,
  viewModeAtom,
} from 'store/vaults';
import { AmountMath } from '@agoric/ertp';
import {
  ceilMultiplyBy,
  makeRatioFromAmounts,
} from '@agoric/zoe/src/contractSupport';
import { calculateCurrentDebt } from '@agoric/inter-protocol/src/interest-math';
import VaultSymbol from 'svg/vault-symbol';
import clsx from 'clsx';
import AdjustVaultForm from './AdjustVaultForm';
import AdjustVaultSummary from './AdjustVaultSummary';
import { useCallback } from 'react';

const AdjustVault = () => {
  const vaultKey = useAtomValue(vaultKeyToAdjustAtom);

  const {
    displayPrice,
    displayPriceTimestamp,
    displayAmount,
    displayBrandPetname,
  } = useAtomValue(displayFunctionsAtom) ?? {};

  const { vaults, prices, managers } = useVaultStore(state => ({
    vaults: state.vaults,
    prices: state.prices,
    managers: state.vaultManagers,
  }));

  const vault = vaultKey && vaults?.get(vaultKey);
  assert(vault, 'Cannot adjust nonexistent vault ' + vaultKey);

  const { locked, debtSnapshot, managerId } = vault;
  const manager = managers.get(managerId);
  assert(locked && debtSnapshot && manager, 'Vault must be loading still');

  const setMode = useSetAtom(viewModeAtom);

  const backButtonProps = {
    text: 'Back to vaults',
    onClick: useCallback(() => setMode(ViewMode.Manage), [setMode]),
  };

  const brand = locked.brand;
  const price = brand && prices.get(brand);

  const totalLockedValue =
    locked &&
    ceilMultiplyBy(
      locked,
      makeRatioFromAmounts(price.amountOut, price.amountIn),
    );

  const totalDebt = calculateCurrentDebt(
    debtSnapshot.debt,
    debtSnapshot.interest,
    manager.compoundedInterest,
  );

  const [netVaultValue, netValueSignum] = AmountMath.isGTE(
    totalLockedValue,
    totalDebt,
  )
    ? [AmountMath.subtract(totalLockedValue, totalDebt), undefined]
    : [AmountMath.subtract(totalDebt, totalLockedValue), '-'];

  // TODO: Update dynamically.
  const vaultLabel = 'ATOM';

  return (
    <>
      <div className="w-full flex justify-between mt-6 flex-wrap">
        <div className="font-serif flex items-baseline gap-3">
          <div className="font-medium text-2xl">{vaultLabel}</div>
          <div className="text-[#A3A5B9] text-sm">
            #{vault.indexWithinManager}
          </div>
        </div>
        <div className="flex gap-8">
          <div>
            Current Price:{' '}
            <span className="text-[#00B1A6] font-medium text-lg">
              {displayPrice && displayPrice(price)}
            </span>
          </div>
          <div>
            Last Price Update:{' '}
            <span className="font-medium text-lg whitespace-nowrap">
              {displayPriceTimestamp && displayPriceTimestamp(price)}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-6 rounded-[10px] p-4 px-8 flex justify-between flex-wrap gap-8 bg-[#FFF4C0]">
        <div className="flex items-center gap-3">
          <span className="fill-interYellow align-bottom relative top-[1px]">
            <VaultSymbol />
          </span>
          <span className="font-medium text-xl">
            {vault.locked &&
              displayAmount &&
              displayAmount(vault.locked, 2, 'locale')}{' '}
            {brand && displayBrandPetname && displayBrandPetname(brand)}
          </span>
        </div>
        <div className="text-lg">
          Net Equity:{' '}
          <span
            className={clsx(
              'font-medium',
              netValueSignum ? 'text-red-500' : 'text-[#00B1A6]',
            )}
          >
            {netValueSignum}
            {displayAmount && displayAmount(netVaultValue, 2, 'usd')}
          </span>
        </div>
        <div className="text-lg">
          Collateral Value:{' '}
          <span className="font-medium">
            {displayAmount && displayAmount(totalLockedValue, 2, 'usd')}
          </span>
        </div>
        <div className="text-lg">
          Outstanding Debt:{' '}
          <span className="font-medium">
            {displayAmount && displayAmount(totalDebt, 2, 'usd')}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap justify-between mt-12">
        <div className="text-xl font-bold font-serif">Adjust Vault</div>
        <button
          className="text-btn-xs transition mr-1 text-[#A3A5B9] rounded-[6px] border-2 border-solid border-[#A3A5B9] py-3 px-7 leading-[14px] font-bold text-xs bg-gray-500 bg-opacity-0 hover:bg-opacity-10 active:bg-opacity-20"
          onClick={backButtonProps.onClick}
        >
          {backButtonProps.text}
        </button>
      </div>
      <div className="mt-8 grid grid-cols-5 gap-8">
        <div className="col-span-9 lg:col-span-3">
          <AdjustVaultForm />
        </div>
        <div className="col-span-9 lg:col-span-2">
          <AdjustVaultSummary
            locked={locked}
            debt={totalDebt}
            lockedValue={totalLockedValue}
            managerId={managerId}
          />
        </div>
      </div>
    </>
  );
};

export default AdjustVault;
