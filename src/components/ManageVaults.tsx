import { chainConnectionAtom } from 'store/app';
import { useCallback } from 'react';
import { useVaultStore, vaultKeyToAdjustAtom, vaultsAtom } from 'store/vaults';
import VaultSummary from 'components/VaultSummary';
import { useAtomValue, useSetAtom } from 'jotai';
import { FaPlusCircle } from 'react-icons/fa';
import VaultSymbol from 'svg/vault-symbol';
import { motion } from 'framer-motion';
import type { PropsWithChildren } from 'react';
import {
  ceilMultiplyBy,
  makeRatioFromAmounts,
  ratioGTE,
} from '@agoric/zoe/src/contractSupport/ratio';
import { AmountMath } from '@agoric/ertp';
import { calculateCurrentDebt } from '@agoric/inter-protocol/src/interest-math';
import { currentCollateralization } from 'utils/vaultMath';

const EmptyView = ({ children }: PropsWithChildren) => {
  return (
    <div className="mt-8 mx-auto w-full relative">
      <div className="w-full h-full z-10 absolute flex flex-col items-center justify-center pb-[20%]">
        <div className="max-w-lg shadow-[0_28px_40px_rgba(116,116,116,0.25)] rounded-xl text-lg bg-white">
          <div className="bg-interYellow w-full h-4 rounded-t-xl"></div>
          <div className="p-6">{children}</div>
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
};

const noticeProps = {
  className: 'overflow-hidden',
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  transition: { type: 'tween' },
};

const ManageVaults = () => {
  const setVaultKeyToAdjust = useSetAtom(vaultKeyToAdjustAtom);
  const vaults = useAtomValue(vaultsAtom);
  const { prices, vaultParams, managers } = useVaultStore(state => ({
    vaultParams: state.vaultGovernedParams,
    prices: state.prices,
    managers: state.vaultManagers,
  }));

  const chainConnection = useAtomValue(chainConnectionAtom);

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

  let content;

  if (!chainConnection) {
    content = <EmptyView>Connect your wallet to manage your vaults.</EmptyView>;
  } else if (vaults?.size === 0) {
    content = <EmptyView>You have not opened any vaults yet.</EmptyView>;
  } else if (!vaults) {
    content = (
      <EmptyView>
        <span className="animate-pulse">Loading your vaults...</span>
      </EmptyView>
    );
  } else {
    content = (
      <div className="mt-12 flex flex-wrap gap-x-6 gap-y-8 justify-center xl:justify-start xl:px-2">
        {[...vaults.keys()].map(vaultKey => (
          <VaultSummary key={vaultKey} vaultKey={vaultKey} />
        ))}
      </div>
    );
  }

  const isAnyVaultLiquidating =
    vaults && [...vaults.values()].find(v => v.vaultState === 'liquidating');

  const isAnyVaultAtRisk =
    vaults &&
    [...vaults.values()].find(vault => {
      const isLiquidating = vault.vaultState === 'liquidating';
      const manager = managers.get(vault.managerId ?? '');
      const params = vaultParams.get(vault.managerId ?? '');
      const { debtSnapshot, locked } = vault;
      const brand = locked?.brand;
      const price = brand && prices.get(brand);

      if (!(debtSnapshot && manager && price && params)) {
        return false;
      }

      const collateralizationRatio = currentCollateralization(
        debtSnapshot,
        manager.compoundedInterest,
        price,
        locked,
      );

      return (
        collateralizationRatio &&
        !ratioGTE(collateralizationRatio, params.liquidationMargin) &&
        !isLiquidating
      );
    });

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
          className="text-[#f9fafe] text-btn-xs flex flex-row justify-center items-center p-3 bg-interPurple rounded-md shadow-[0_10px_14px_-4px_rgba(183,135,245,0.3)] hover:opacity-80 active:opacity-60"
          onClick={buttonProps.onClick}
        >
          {buttonProps.text}
        </button>
      </div>
      <div className="text-[#E22951] text-lg mt-4 font-serif font-medium">
        {isAnyVaultLiquidating && (
          <motion.div {...noticeProps}>A vault is liquidating.</motion.div>
        )}
        {isAnyVaultAtRisk && (
          <motion.div {...noticeProps}>
            A vault is at risk. Please increase your collateral or repay your
            outstanding IST debt.
          </motion.div>
        )}
      </div>
      {content}
    </>
  );
};

export default ManageVaults;
