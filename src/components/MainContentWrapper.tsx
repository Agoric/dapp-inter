import { AmountMath } from '@agoric/ertp';
import {
  ceilMultiplyBy,
  makeRatioFromAmounts,
} from '@agoric/zoe/src/contractSupport';
import { useAtomValue } from 'jotai';
import { PropsWithChildren, ReactNode, useMemo } from 'react';
import { displayFunctionsAtom } from 'store/app';
import { useVaultStore } from 'store/vaults';
import { addCommas } from 'utils/displayFunctions';

type TickerItemProps = {
  label: string;
  value: string;
};

const TickerItem = ({ label, value }: TickerItemProps) => (
  <div className="ml-16 h-12 leading-[48px]">
    <span className="font-medium font-serif text-[#736D6D] mr-2">{label}</span>
    <span className="font-bold font-serif text-mineShaft">{value}</span>
  </div>
);

type Props = PropsWithChildren<{ header?: ReactNode }>;

const MainContentWrapper = ({ children, header }: Props) => {
  const { managerIds, metrics, prices } = useVaultStore(state => ({
    managerIds: state.vaultManagerIds,
    metrics: state.vaultMetrics,
    prices: state.prices,
  }));
  const displayFunctions = useAtomValue(displayFunctionsAtom);

  const subheader = useMemo(() => {
    let totalDebtForDisplay = '$ --';
    let tvlForDisplay = '$ --';
    let numVaultsForDisplay = '--';

    if (displayFunctions && metrics.size === managerIds?.length) {
      let areAllPricesLoaded = true;
      [...metrics.values()].forEach(() => {
        const collateralBrand = metrics.get(managerIds[0])?.totalCollateral
          .brand;
        if (!(collateralBrand && prices.get(collateralBrand))) {
          areAllPricesLoaded = false;
        }
      });

      if (areAllPricesLoaded) {
        const { displayAmount } = displayFunctions;

        const debtBrand = metrics.get(managerIds[0])?.totalDebt.brand;

        let totalDebt = AmountMath.makeEmpty(debtBrand);
        let totalLocked = AmountMath.makeEmpty(debtBrand);
        let numVaults = 0;

        [...metrics.values()].forEach(
          ({ numActiveVaults, totalCollateral, totalDebt: managerDebt }) => {
            numVaults += numActiveVaults;
            totalDebt = AmountMath.add(totalDebt, managerDebt);

            const price = prices.get(totalCollateral.brand);
            const collateralValue = ceilMultiplyBy(
              totalCollateral,
              makeRatioFromAmounts(price.amountOut, price.amountIn),
            );
            totalLocked = AmountMath.add(totalLocked, collateralValue);
          },
        );

        totalDebtForDisplay = `$${addCommas(displayAmount(totalDebt, 0))}`;
        tvlForDisplay = `$${addCommas(displayAmount(totalLocked, 0))}`;
        numVaultsForDisplay = addCommas(numVaults.toString());
      }
    }

    return (
      <div className="h-full flex flex-row items-center flex-wrap">
        <TickerItem
          label="IST Outstanding (Vaults)"
          value={totalDebtForDisplay}
        />
        <TickerItem label="Total Value Locked ($)" value={tvlForDisplay} />
        <TickerItem
          label="Total # of Active Vaults"
          value={numVaultsForDisplay}
        />
      </div>
    );
  }, [displayFunctions, managerIds, metrics, prices]);

  return (
    <div className="mt-[2px] flex-grow bg-gradient-to-br from-[#fffcf2] to-[#ffffff] rounded-t-[48px] shadow-[0px_34px_50px_0px_#ff7a1a] relative">
      <div className="bg-interYellow h-[46px] rounded-t-full before:h-[46px] before:-z-50 before:rounded-t-full before:w-full before:bg-[#FFE04B] before:absolute before:-top-[2px]">
        {header}
      </div>
      <div className="w-full h-[1px] bg-[#f4cd0c]" />
      <div className="w-full h-[1px] bg-[#ffe252]" />
      <div className="bg-interYellow">{subheader}</div>
      <div className="p-2 pt-4 md:p-10">{children}</div>
    </div>
  );
};

export default MainContentWrapper;
