import { motion } from 'framer-motion';
import { AmountMath } from '@agoric/ertp';
import {
  ceilMultiplyBy,
  makeRatioFromAmounts,
} from '@agoric/zoe/src/contractSupport';
import { useAtomValue } from 'jotai';
import { PropsWithChildren, useMemo } from 'react';
import { displayFunctionsAtom } from 'store/app';
import { useVaultStore } from 'store/vaults';

type TickerItemProps = {
  label: string;
  value?: string;
  fallback: string;
};

const TickerItem = ({ label, value, fallback }: TickerItemProps) => {
  const rhs = value ? (
    <motion.div
      className="font-bold font-serif text-primary overflow-hidden inline-block"
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 'auto', opacity: 1 }}
      transition={{ type: 'tween' }}
    >
      {value}
    </motion.div>
  ) : (
    <div className="font-bold font-serif text-primary">
      <span className="absolute">{fallback}</span>
    </div>
  );

  return (
    <div className="h-12 leading-[48px] flex">
      <div className="font-medium font-serif text-alternative mr-2">
        {label}
      </div>
      {rhs}
    </div>
  );
};

const MainContentWrapper = ({ children }: PropsWithChildren) => {
  const { managerIds, metrics, prices } = useVaultStore(state => ({
    managerIds: state.vaultManagerIds,
    metrics: state.vaultMetrics,
    prices: state.prices,
  }));
  const displayFunctions = useAtomValue(displayFunctionsAtom);

  const subheader = useMemo(() => {
    let totalDebtForDisplay;
    let tvlForDisplay;
    let numVaultsForDisplay;

    if (displayFunctions && metrics.size === managerIds?.length) {
      const areCollateralPricesLoaded = [...metrics.values()].every(m =>
        prices.get(m.totalCollateral.brand),
      );

      if (areCollateralPricesLoaded) {
        const { displayAmount } = displayFunctions;

        const firstManagerMetrics = metrics.get(managerIds[0]);
        assert(
          firstManagerMetrics,
          'Metrics arent loaded yet, cannot calculate info.',
        );
        // All managers use the same debt.
        const debtBrand = firstManagerMetrics.totalDebt.brand;

        let totalDebt = AmountMath.makeEmpty(debtBrand);
        let totalLocked = AmountMath.makeEmpty(debtBrand);
        let numVaults = 0;

        [...metrics.values()].forEach(
          ({ numActiveVaults, totalCollateral, totalDebt: managerDebt }) => {
            numVaults += numActiveVaults;
            totalDebt = AmountMath.add(totalDebt, managerDebt);

            const price = prices.get(totalCollateral.brand);
            assert(
              price,
              'areCollateralPricesLoaded is true but a price isnt loaded',
            );
            const collateralValue = ceilMultiplyBy(
              totalCollateral,
              makeRatioFromAmounts(price.amountOut, price.amountIn),
            );
            totalLocked = AmountMath.add(totalLocked, collateralValue);
          },
        );

        totalDebtForDisplay = `${displayAmount(totalDebt, 0, 'usd')}`;
        tvlForDisplay = `${displayAmount(totalLocked, 0, 'usd')}`;
        numVaultsForDisplay = new Intl.NumberFormat().format(numVaults);
      }
    }

    return (
      <div className="p-3 h-full bg-interYellow flex flex-row items-center justify-around flex-wrap gap-x-4 rounded-t-[48px]">
        <TickerItem
          label="IST Outstanding (Vaults)"
          value={totalDebtForDisplay}
          fallback="$ --"
        />
        <TickerItem
          label="Total Value Locked ($)"
          value={tvlForDisplay}
          fallback="$ --"
        />
        <TickerItem
          label="Total # of Active Vaults"
          value={numVaultsForDisplay}
          fallback="--"
        />
      </div>
    );
  }, [displayFunctions, managerIds, metrics, prices]);

  return (
    <div className="mt-[2px] flex flex-col flex-grow bg-gradient-to-br from-[#fffcf2] to-[#ffffff] rounded-t-[48px] shadow-[0px_34px_50px_0px_#ff7a1a] relative">
      <div className="bg-interYellow rounded-t-[48px] before:h-full before:-z-50 before:rounded-t-[48px] before:w-full before:bg-[#FFE04B] before:absolute before:-top-[2px]">
        {subheader}
      </div>
      <div className="p-2 pt-4 md:p-10 overflow-hidden flex-grow min-h-[840px]">
        {children}
      </div>
    </div>
  );
};

export default MainContentWrapper;
