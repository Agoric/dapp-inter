import {
  chainConnectionAtom,
  isWalletConnectionInProgressAtom,
  localStorageStore,
} from 'store/app';
import { useCallback } from 'react';
import { useVaultStore, vaultKeyToAdjustAtom, vaultsAtom } from 'store/vaults';
import VaultSummary from 'components/VaultSummary';
import { useAtomValue, useSetAtom } from 'jotai';
import { FaPlusCircle } from 'react-icons/fa';
import VaultSymbol from 'svg/vault-symbol';
import { motion } from 'framer-motion';
import type { PropsWithChildren } from 'react';
import { makeRatioFromAmounts } from '@agoric/zoe/src/contractSupport/ratio';
import { isLiquidationPriceBelowGivenPrice } from 'utils/vaultMath';
import { calculateCurrentDebt } from '@agoric/inter-protocol/src/interest-math';
import { useStore } from 'zustand';

const Popup = ({ children }: PropsWithChildren) => {
  return (
    <div className="mt-40 mx-auto w-full absolute">
      <div className="w-full h-full z-10 absolute flex flex-col items-center justify-center pb-[20%]">
        <div className="max-w-lg shadow-[0_28px_40px_rgba(116,116,116,0.25)] rounded-xl text-lg bg-white">
          <div className="bg-interYellow w-full h-4 rounded-t-xl"></div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
};

const Backdrop = () => (
  <div className="absolute mx-auto w-full">
    <div className="w-full h-full z-10 absolute flex flex-col items-center justify-center pb-[20%]">
      <div className="max-w-lg shadow-[0_28px_40px_rgba(116,116,116,0.25)] rounded-xl text-lg bg-white">
        <div className="bg-interYellow w-full h-4 rounded-t-xl"></div>
      </div>
    </div>
    <div className="opacity-30 mt-10 mx-auto w-fit">
      <img
        className="object-none object-[bottom_-220px_left_-210px] h-[620px] w-[860px]"
        src="./donut-lock.png"
        alt="vaults unavailable"
      ></img>
    </div>
  </div>
);

const noticeProps = {
  className: 'overflow-hidden',
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  transition: { type: 'tween' },
};

const ManageVaults = () => {
  const setVaultKeyToAdjust = useSetAtom(vaultKeyToAdjustAtom);
  const vaults = useAtomValue(vaultsAtom);
  const { prices, vaultParams, managers, books, schedule } = useVaultStore(
    state => ({
      vaultParams: state.vaultGovernedParams,
      prices: state.prices,
      managers: state.vaultManagers,
      books: state.liquidationAuctionBooks,
      schedule: state.liquidationSchedule,
    }),
  );

  const chainConnection = useAtomValue(chainConnectionAtom);
  const isConnectionInProgress = useAtomValue(isWalletConnectionInProgressAtom);
  const { hasWalletPreviouslyConnected } = useStore(localStorageStore);

  const buttonProps = {
    text: (
      <>
        <FaPlusCircle size={16} />
        <span>&nbsp;&nbsp;Add new vault</span>
      </>
    ),
    onClick: useCallback(() => {
      setVaultKeyToAdjust(null);
    }, [setVaultKeyToAdjust]),
  };

  const cards = (
    <>
      <div className="mt-12 flex flex-wrap gap-x-6 gap-y-8 justify-center xl:justify-start xl:px-2 relative z-10">
        {[...(vaults?.keys() ?? [])].map(vaultKey => (
          <VaultSummary key={vaultKey} vaultKey={vaultKey} />
        ))}
      </div>
    </>
  );

  let popup;

  if (
    isConnectionInProgress ||
    (hasWalletPreviouslyConnected && !chainConnection)
  ) {
    popup = (
      <Popup>
        <span className="animate-pulse">Loading your vaults...</span>
      </Popup>
    );
  } else if (!chainConnection) {
    popup = <Popup>Connect your wallet to manage your vaults.</Popup>;
  } else if (vaults?.size === 0) {
    popup = <Popup>You have not opened any vaults yet.</Popup>;
  } else if (!vaults) {
    popup = (
      <Popup>
        <span className="animate-pulse">Loading your vaults...</span>
      </Popup>
    );
  }

  const liquidatingVaultCount =
    vaults &&
    [...vaults.values()].filter(v => v.vaultState === 'liquidating').length;

  const vaultAtRiskCount =
    vaults &&
    [...vaults.values()].filter(vault => {
      const isLiquidating = vault.vaultState === 'liquidating';
      const manager = managers.get(vault.managerId ?? '');
      const params = vaultParams.get(vault.managerId ?? '');
      const { debtSnapshot, locked } = vault;
      const brand = locked?.brand;
      const price = brand && prices.get(brand);
      const book = books.get(vault?.managerId ?? '');

      if (!(debtSnapshot && manager && price && params)) {
        return false;
      }

      // If `activeStartTime` is truthy, then `startPrice` is the *current* auction price, so ignore.
      const nextAuctionPrice = !schedule?.activeStartTime && book?.startPrice;

      const totalDebt = calculateCurrentDebt(
        debtSnapshot.debt,
        debtSnapshot.interest,
        manager.compoundedInterest,
      );

      const isLiquidationPriceBelowOraclePrice =
        isLiquidationPriceBelowGivenPrice(
          locked,
          totalDebt,
          makeRatioFromAmounts(price.amountOut, price.amountIn),
          params.liquidationMargin,
        );

      const isLiquidationPriceBelowNextAuctionPrice =
        nextAuctionPrice &&
        isLiquidationPriceBelowGivenPrice(
          locked,
          totalDebt,
          nextAuctionPrice,
          params.liquidationMargin,
        );

      const isAtRisk =
        (isLiquidationPriceBelowOraclePrice ||
          isLiquidationPriceBelowNextAuctionPrice) &&
        !isLiquidating;

      return isAtRisk;
    }).length;

  return (
    <>
      <div className="w-full flex justify-between mt-6">
        <div className="font-serif font-medium text-2xl">
          <div className="flex items-center gap-3">
            <span className="fill-interYellow align-bottom relative top-[1px]">
              <VaultSymbol />
            </span>
            <span>My Vaults{vaults?.size ? ` (${vaults?.size})` : ''}</span>
          </div>
        </div>
        <button
          className="transition text-[#f9fafe] text-btn-xs flex flex-row justify-center items-center p-3 bg-interPurple rounded-md shadow-[0_10px_14px_-4px_rgba(183,135,245,0.3)] hover:opacity-80 active:opacity-60"
          onClick={buttonProps.onClick}
        >
          {buttonProps.text}
        </button>
      </div>
      <div className="text-[#E22951] text-lg mt-4 font-serif font-medium">
        {liquidatingVaultCount ? (
          <motion.div {...noticeProps}>
            {liquidatingVaultCount === 1
              ? 'A vault is liquidating.'
              : `${liquidatingVaultCount} vaults are liquidating.`}
          </motion.div>
        ) : (
          ''
        )}
        {vaultAtRiskCount ? (
          <motion.div {...noticeProps}>
            {vaultAtRiskCount === 1
              ? 'A vault is'
              : `${vaultAtRiskCount} vaults are`}{' '}
            at risk. Please increase your collateral or repay your outstanding
            IST debt.
          </motion.div>
        ) : (
          ''
        )}
      </div>
      <Backdrop />
      {popup}
      {cards}
    </>
  );
};

export default ManageVaults;
