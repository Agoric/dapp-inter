import {
  KeyboardEventHandler,
  PropsWithChildren,
  useMemo,
  useState,
} from 'react';
import { useVaultStore, vaultKeyToAdjustAtom } from 'store/vaults';
import { currentTimeAtom, displayFunctionsAtom } from 'store/app';
import { calculateCurrentDebt } from '@agoric/inter-protocol/src/interest-math';
import {
  ceilMultiplyBy,
  makeRatioFromAmounts,
} from '@agoric/zoe/src/contractSupport';
import clsx from 'clsx';
import { useAtomValue, useSetAtom } from 'jotai';
import { isLiquidationPriceBelowGivenPrice, netValue } from 'utils/vaultMath';
import type { VaultKey } from 'store/vaults';
import {
  CollateralAction,
  collateralActionAtom,
  DebtAction,
  debtActionAtom,
} from 'store/adjustVault';
import { AmountMath } from '@agoric/ertp/src/index';
import CloseVaultDialog from './CloseVaultDialog';
import { multiplyBy } from '@agoric/zoe/src/contractSupport/index';
import { motion } from 'framer-motion';
import LeapLiquidityModal, { Direction } from './leap-elements/LiquidityModal';
import type { Brand } from '@agoric/ertp/src/index';

const cardVariant = {
  active: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
  inactive: {
    opacity: 0,
    y: 10,
    transition: {
      duration: 0.5,
    },
  },
};

type CardProps = PropsWithChildren<{ onClick?: () => void }>;

const VaultCard = ({ children, onClick }: CardProps) => {
  const onKeyDownHandler: KeyboardEventHandler<HTMLDivElement> = e => {
    if (onClick && ['Enter', ' '].includes(e.key)) {
      onClick();
    }
  };

  return (
    <motion.div
      onClick={onClick}
      variants={cardVariant}
      {...{ tabIndex: onClick ? 0 : -1 }}
      whileHover={{
        scale: onClick ? 1.05 : 1,
        transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
      }}
      onKeyDown={onKeyDownHandler}
      className={clsx(
        onClick ? 'cursor-pointer' : 'cursor-not-allowed',
        'shadow-card rounded-xl bg-white w-[580px] relative',
      )}
    >
      {children}
    </motion.div>
  );
};

const SkeletonVaultSummary = () => (
  <>
    <div className="flex justify-between mt-14 mx-8 mb-10 items-center">
      <div className="flex items-end gap-4">
        <div className="h-20 w-20 bg-gray-200 rounded-full transition animate-pulse" />
        <div className="flex flex-col gap-2 justify-end">
          <div className="h-[38px] w-32 bg-gray-200 rounded transition animate-pulse" />
          <div className="text-secondary h-3 w-6 bg-gray-200 rounded transition animate-pulse" />
        </div>
      </div>
      <div className="h-[38px] w-52 bg-gray-200 rounded transition animate-pulse" />
    </div>
    <div className="divider-light w-full" />
    <div className="mx-11 mt-5 mb-5">
      <div className="w-full rounded bg-gray-200 h-4 my-4 transition animate-pulse" />
      <div className="w-full rounded bg-gray-200 h-4 my-4 transition animate-pulse" />
      <div className="w-full rounded bg-gray-200 h-4 my-4 transition animate-pulse" />
    </div>
    <div className="flex justify-around gap-3 mx-[30px] mb-[30px]">
      <div className="h-[72px] flex-auto bg-gray-200 rounded-lg transition animate-pulse" />
      <div className="h-[72px] flex-auto bg-gray-200 rounded-lg transition animate-pulse" />
      <div className="h-[72px] flex-auto bg-gray-200 rounded-lg transition animate-pulse" />
    </div>
  </>
);

const bigTextClasses = 'text-[32px] leading-[38px] font-semibold';

const subpanelClasses =
  'px-5 py-3 flex-auto bg-white flex flex-col content-between gap-1 text-center rounded-lg border-solid border-2 shadow-[0_10px_12px_-6px_#F0F0F0] text-sm';

type TableRowProps = {
  left: string;
  leftSubtext?: string;
  right: string;
  light?: boolean;
};

const TableRow = ({
  left,
  leftSubtext,
  right,
  light = false,
}: TableRowProps) => (
  <tr className={clsx('leading-7', light && 'text-secondary')}>
    <td className="text-left">
      {left}
      {leftSubtext && (
        <span className="normal-case text-sm"> - {leftSubtext}</span>
      )}
    </td>
    <td className="text-right font-black">{right}</td>
  </tr>
);

type ClosedVaultParams = {
  brand: Brand;
  brandPetname: string;
  brandIcon?: string;
  collateralLabel: string;
  indexWithinManager: number;
};

const ClosedVault = ({
  brand,
  brandPetname,
  brandIcon,
  collateralLabel,
  indexWithinManager,
}: ClosedVaultParams) => (
  <>
    <div className="leading-[19px] absolute bg-primary w-full rounded-t-xl text-white px-8 py-3 font-medium uppercase">
      Closed
    </div>
    <div className="flex justify-between mt-14 mx-8 mb-10 items-center flex-wrap">
      <div className="flex items-end gap-4">
        <img height="80" width="80" alt={brandPetname} src={brandIcon}></img>
        <div className="flex flex-col justify-end">
          <div className={bigTextClasses}>{collateralLabel}</div>
          <div className="text-secondary text-sm">#{indexWithinManager}</div>
        </div>
      </div>
      <LeapLiquidityModal
        direction={Direction.withdraw}
        selectedAsset={brand}
      />
    </div>
    <div className="divider-light w-full" />
    <div className="mx-11 mt-3 mb-5 font-black flex flex-col justify-center h-[192px]">
      Closed
    </div>
  </>
);

type LiquidatedVaultParams = {
  brandPetname: string;
  brandIcon?: string;
  collateralLabel: string;
  indexWithinManager: number;
  totalCollateral: string;
  isEmpty: boolean;
};

const LiquidatedVault = ({
  brandPetname,
  brandIcon,
  collateralLabel,
  indexWithinManager,
  totalCollateral,
  isEmpty,
}: LiquidatedVaultParams) => (
  <>
    <div className="leading-[19px] absolute bg-primary w-full rounded-t-xl text-white px-8 py-3 font-medium uppercase flex justify-between">
      <span>Liquidated</span>
      {isEmpty ? (
        <></>
      ) : (
        <span className="font-light text-sm normal-case">
          Click to claim collateral
        </span>
      )}
    </div>
    <div className="flex justify-between mt-14 mx-8 mb-10 items-end flex-wrap">
      <div className="flex items-end gap-4">
        <img height="80" width="80" alt={brandPetname} src={brandIcon}></img>
        <div className="flex flex-col justify-end">
          <div className={bigTextClasses}>{collateralLabel}</div>
          <div className="text-secondary text-sm">#{indexWithinManager}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-secondary text-xl leading-[23px]">
          Collateral left to claim
        </div>
        <div className="text-interGreen text-[32px] font-semibold leading-[38px]">
          {totalCollateral}
        </div>
      </div>
    </div>
    <div className="divider-light w-full" />
    <div className="mx-11 mt-3 mb-5 font-black flex flex-col justify-center h-[192px]">
      <span>
        Closed&nbsp;&nbsp;
        <span className="font-normal">|&nbsp;&nbsp;Liquidated</span>{' '}
      </span>
    </div>
  </>
);

type Props = {
  vaultKey: VaultKey;
};

const VaultSummary = ({ vaultKey }: Props) => {
  const {
    vaults,
    errors,
    prices,
    priceErrors,
    vaultMetrics,
    vaultGovernedParams,
    vaultManagerLoadingErrors,
    managers,
    liquidationSchedule,
  } = useVaultStore(state => ({
    vaults: state.vaults,
    vaultMetrics: state.vaultMetrics,
    vaultGovernedParams: state.vaultGovernedParams,
    errors: state.vaultErrors,
    prices: state.prices,
    priceErrors: state.priceErrors,
    vaultManagerLoadingErrors: state.vaultManagerLoadingErrors,
    managers: state.vaultManagers,
    liquidationSchedule: state.liquidationSchedule,
  }));

  const currentTime = useAtomValue(currentTimeAtom);

  const vault = vaults?.get(vaultKey);
  assert(vault, `Cannot render summary for nonexistent vault ${vaultKey}`);

  const displayFunctions = useAtomValue(displayFunctionsAtom);
  const setVaultToAdjustKey = useSetAtom(vaultKeyToAdjustAtom);
  const setCollateralAction = useSetAtom(collateralActionAtom);
  const setDebtAction = useSetAtom(debtActionAtom);
  const [isCloseVaultDialogOpen, setIsCloseVaultDialogOpen] = useState(false);

  const metrics = vaultMetrics.get(vault?.managerId ?? '');
  const params = vaultGovernedParams.get(vault?.managerId ?? '');
  const brand = metrics?.totalCollateral?.brand;
  const price = brand && prices.get(brand);
  const manager = managers.get(vault?.managerId ?? '');
  const error =
    errors.get(vaultKey) ||
    (brand && priceErrors.get(brand)) ||
    vaultManagerLoadingErrors.get(vault?.managerId ?? '');

  const { content, onClick } = useMemo(() => {
    if (error) {
      return {
        content: (
          <>
            <div className="flex justify-between mt-14 mx-8 mb-10 items-center">
              <div className="flex items-end gap-4">
                <div className="h-20" />
                <div className="h-[58px] text-alert text-lg">
                  Error Loading Vault
                </div>
                <div className="h-3 w-6 " />
              </div>
            </div>
            <div className="divider-light w-full" />
            <div className="mx-11 mt-5 mb-5 h-36 overflow-y-auto">
              {error.toString()}
            </div>
          </>
        ),
      };
    }

    if (
      vault.isLoading ||
      !price ||
      !metrics ||
      !params ||
      !manager ||
      !displayFunctions
    ) {
      return { content: <SkeletonVaultSummary /> };
    }

    const {
      displayBrandPetname,
      displayBrandIcon,
      displayPrice,
      displayAmount,
      displayPercent,
    } = displayFunctions;

    const { locked, debtSnapshot } = vault;
    assert(locked && debtSnapshot, 'Vault must be loading still');

    if (vault.vaultState === 'transfer') {
      // XXX Need to know whether we still own this vault after transfer.
      // https://github.com/Agoric/agoric-sdk/issues/6974
      return {};
    }

    const brandIcon = displayBrandIcon(locked.brand);
    const brandPetname = displayBrandPetname(locked.brand);

    const collateralLabel = brandPetname;

    if (vault.vaultState === 'closed') {
      return {
        content: (
          <ClosedVault
            brand={locked.brand}
            brandIcon={brandIcon}
            brandPetname={brandPetname}
            collateralLabel={collateralLabel}
            indexWithinManager={vault.indexWithinManager}
          />
        ),
      };
    }

    const totalDebt = calculateCurrentDebt(
      debtSnapshot.debt,
      debtSnapshot.stabilityFee,
      manager.compoundedStabilityFee,
    );

    if (vault.vaultState === 'liquidated') {
      const isEmpty = AmountMath.isEmpty(locked);
      return {
        content: (
          <>
            <LiquidatedVault
              brandIcon={brandIcon}
              brandPetname={brandPetname}
              collateralLabel={collateralLabel}
              indexWithinManager={vault.indexWithinManager}
              totalCollateral={`${displayAmount(
                locked,
                2,
                'locale',
              )} ${displayBrandPetname(locked.brand)}`}
              isEmpty={isEmpty}
            />
            <CloseVaultDialog
              isOpen={isCloseVaultDialogOpen}
              onClose={() => setIsCloseVaultDialogOpen(false)}
              totalCollateral={locked}
              totalDebt={totalDebt}
              vaultOfferId={vault.createdByOfferId}
            />
          </>
        ),
        onClick: isEmpty ? undefined : () => setIsCloseVaultDialogOpen(true),
      };
    }

    const totalLockedValue = ceilMultiplyBy(
      locked,
      makeRatioFromAmounts(price.amountOut, price.amountIn),
    );

    const nextAuctionPrice = metrics?.lockedQuote;

    const collateralizationRatio = AmountMath.isEmpty(totalDebt)
      ? undefined
      : makeRatioFromAmounts(totalLockedValue, totalDebt);

    const isLiquidating = vault.vaultState === 'liquidating';

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

    const isLiquidationImminent =
      isLiquidationPriceBelowNextAuctionPrice &&
      liquidationSchedule?.nextStartTime &&
      Number(liquidationSchedule.nextStartTime.absValue) > currentTime;

    const minutesUntilNextAuction =
      liquidationSchedule?.nextStartTime &&
      Math.ceil(
        (Number(liquidationSchedule.nextStartTime.absValue) - currentTime) / 60,
      );

    const atRiskNotice = isAtRisk && (
      <div className="leading-[19px] absolute w-full rounded-t-xl text-white px-8 py-3 font-medium uppercase bg-alert">
        Vault at risk
        {isLiquidationImminent && (
          <span className="pl-6 normal-case font-normal">
            {minutesUntilNextAuction} min
            {minutesUntilNextAuction === 1 ? '' : 's'} until liquidation
          </span>
        )}
      </div>
    );

    const liquidatingNotice = isLiquidating && (
      <div className="leading-[19px] absolute w-full rounded-t-xl text-white px-8 py-3 font-medium uppercase bg-interOrange">
        Liquidating... please wait
      </div>
    );

    const maximumLockedValueForLiquidation = ceilMultiplyBy(
      totalDebt,
      params.liquidationMargin,
    );

    const maximumLockedPriceForLiquidation = AmountMath.isEmpty(locked)
      ? undefined
      : {
          amountIn: locked,
          amountOut: maximumLockedValueForLiquidation,
        };

    const [netVaultValue, isNetValueNegative] = netValue(
      totalLockedValue,
      totalDebt,
    );

    const adjustVault = () => {
      setCollateralAction(CollateralAction.None);
      setDebtAction(DebtAction.None);
      setVaultToAdjustKey(vaultKey);
    };

    const isBookLiquidating = !!liquidationSchedule?.activeStartTime;

    const timeUntilAuction =
      (!isBookLiquidating &&
        minutesUntilNextAuction &&
        `in ${minutesUntilNextAuction} minute` +
          `${minutesUntilNextAuction === 1 ? '' : 's'}`) ||
      undefined;

    const tableBody = isLiquidating ? (
      <tbody>
        <TableRow
          left="Initial IST Debt"
          right={`${displayAmount(
            totalDebt,
            2,
            'locale',
          )} ${displayBrandPetname(totalDebt.brand)}`}
          light={true}
        />
        <TableRow
          left={`Penalty (${displayPercent(params.liquidationPenalty, 2)}%)`}
          right={`${displayAmount(
            multiplyBy(totalDebt, params.liquidationPenalty),
            2,
            'locale',
          )} ${displayBrandPetname(totalDebt.brand)}`}
          light={true}
        />
        <TableRow
          left="Collateral Being Liquidated"
          right={`${displayAmount(locked, 2, 'locale')} ${displayBrandPetname(
            locked.brand,
          )}`}
        />
      </tbody>
    ) : isAtRisk ? (
      <tbody>
        <TableRow
          left="Current Price"
          right={displayPrice(price, 2)}
          light={true}
        />
        <TableRow
          left="Next Liquidation Price"
          leftSubtext={timeUntilAuction}
          right={
            nextAuctionPrice
              ? displayPrice(
                  {
                    amountIn: nextAuctionPrice.denominator,
                    amountOut: nextAuctionPrice.numerator,
                  },
                  2,
                )
              : 'N/A'
          }
          light={true}
        />
        <TableRow
          left="Liquidation Price"
          right={
            maximumLockedPriceForLiquidation
              ? displayPrice(maximumLockedPriceForLiquidation, 2)
              : 'N/A'
          }
        />
      </tbody>
    ) : (
      <tbody>
        <TableRow
          left="Liquidation Price"
          right={
            maximumLockedPriceForLiquidation
              ? displayPrice(maximumLockedPriceForLiquidation, 2)
              : 'N/A'
          }
          light={true}
        />
        <TableRow
          left="Liquidation Ratio"
          right={`${displayPercent(params.liquidationMargin, 0)}%`}
          light={true}
        />
        <TableRow
          left="Collateralization Ratio"
          right={
            collateralizationRatio
              ? `${displayPercent(collateralizationRatio, 0)}%`
              : '--'
          }
        />
      </tbody>
    );

    return {
      onClick: isLiquidating ? undefined : adjustVault,
      content: (
        <>
          {atRiskNotice}
          {liquidatingNotice}
          <div className="flex justify-between mt-14 mx-8 mb-10 items-center flex-wrap">
            <div className="flex items-end gap-4">
              <img
                height="80"
                width="80"
                alt={brandPetname}
                src={brandIcon}
              ></img>
              <div className="flex flex-col justify-end">
                <div className={bigTextClasses}>{collateralLabel}</div>
                <div className="text-secondary text-sm">
                  #{vault.indexWithinManager}
                </div>
              </div>
            </div>
            <div className="h-20">
              <div className="text-sm font-medium">Net Equity</div>
              <div className={bigTextClasses}>
                {isNetValueNegative && '-'}
                {displayAmount(netVaultValue, 2, 'usd')}
              </div>
            </div>
          </div>
          <div className="divider-light w-full" />
          <div className="mx-11 mt-3 mb-5">
            <table className="w-full">{tableBody}</table>
          </div>
          <div className="flex justify-around gap-3 mx-[30px] mb-[30px]">
            <div className={subpanelClasses}>
              <span className="text-secondary">Stab. Fee</span>
              <span className="font-extrabold">
                {displayPercent(params.stabilityFee, 2)}%
              </span>
            </div>
            <div className={subpanelClasses}>
              <span className="text-secondary">Debt</span>
              <span className="font-extrabold">
                {displayAmount(totalDebt, 2, 'locale')}{' '}
                {displayBrandPetname(totalDebt.brand)}
              </span>
            </div>
            <div className={subpanelClasses}>
              <span className="text-secondary">Collat. Locked ($ value)</span>
              <span className="font-extrabold">
                {displayAmount(totalLockedValue, 2, 'usd')}
              </span>
            </div>
          </div>
        </>
      ),
    };
  }, [
    error,
    vault,
    price,
    metrics,
    params,
    manager,
    displayFunctions,
    liquidationSchedule,
    currentTime,
    isCloseVaultDialogOpen,
    setCollateralAction,
    setDebtAction,
    setVaultToAdjustKey,
    vaultKey,
  ]);

  return content ? <VaultCard onClick={onClick}>{content}</VaultCard> : null;
};

export default VaultSummary;
