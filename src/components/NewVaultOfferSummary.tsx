import { AmountMath } from '@agoric/ertp';
import clsx from 'clsx';
import { useAtomValue } from 'jotai';
import { Fragment, ReactNode, useMemo, useState } from 'react';
import { makeOpenVaultOffer } from 'service/vaults';
import {
  chainConnectionAtom,
  displayFunctionsAtom,
  smartWalletProvisionedAtom,
} from 'store/app';
import {
  collateralizationRatioAtom,
  inputErrorsAtom,
  selectedCollateralIdAtom,
  valueToLockAtom,
  valueToReceiveAtom,
} from 'store/createVault';
import { useVaultStore } from 'store/vaults';
import VaultCreationDialog from './VaultCreationDialog';
import ProvisionSmartWalletNoticeDialog from './ProvisionSmartWalletNoticeDialog';
import { debtAfterChange } from 'utils/vaultMath';
import { DebtAction } from 'store/adjustVault';
import { HiOutlineInformationCircle } from 'react-icons/hi';
import { Popover, Transition } from '@headlessui/react';
import { ceilMultiplyBy } from '@agoric/zoe/src/contractSupport';

type TableRowProps = {
  left: string;
  right: string;
  info?: ReactNode;
};

const TableRow = ({ left, right, info }: TableRowProps) => {
  return (
    <tr className="text-[13px] leading-[21px]">
      <td className="text-secondary">{left}</td>
      <td className="text-right text-alternative font-black relative">
        {right}
        {info}
      </td>
    </tr>
  );
};

const vaultLimit = 150;
const vaultLimitWarningThreshold = 100;

const NewVaultOfferSummary = () => {
  const { collateralizationRatioError, toLockError, toReceiveError } =
    useAtomValue(inputErrorsAtom);

  const selectedCollateralId = useAtomValue(selectedCollateralIdAtom);
  const valueToReceive = useAtomValue(valueToReceiveAtom);
  const valueToLock = useAtomValue(valueToLockAtom);
  const collateralizationRatio = useAtomValue(collateralizationRatioAtom);
  const chainConnection = useAtomValue(chainConnectionAtom);
  const isSmartWalletProvisioned = useAtomValue(smartWalletProvisionedAtom);
  const [isProvisionDialogOpen, setIsProvisionDialogOpen] = useState(false);
  const isSmartWalletStatusLoading = isSmartWalletProvisioned === null;

  const { displayAmount, displayBrandPetname, displayPercent, displayPrice } =
    useAtomValue(displayFunctionsAtom) ?? {};

  const { metrics, params, factoryParams, userVaults } = useVaultStore(
    vaults => ({
      metrics: vaults.vaultMetrics,
      params: vaults.vaultGovernedParams,
      factoryParams: vaults.vaultFactoryParams,
      userVaults: vaults.vaults,
    }),
  );

  const [isVaultCreationDialogOpen, setIsVaultCreationDialogOpen] =
    useState(false);

  const selectedParams =
    selectedCollateralId && params.get(selectedCollateralId);

  const selectedMetrics =
    selectedCollateralId && metrics.get(selectedCollateralId);

  const collateralBrand =
    selectedMetrics && selectedMetrics.totalCollateral.brand;
  const debtBrand = selectedMetrics && selectedMetrics.totalDebt.brand;

  const depositAmount =
    valueToLock &&
    collateralBrand &&
    AmountMath.make(collateralBrand, valueToLock);

  const depositAmountForDisplay =
    displayAmount && displayBrandPetname && depositAmount
      ? `${displayAmount(depositAmount, 2, 'locale')} ${displayBrandPetname(
          collateralBrand,
        )}`
      : '--';

  const mintAmount =
    valueToReceive && debtBrand && AmountMath.make(debtBrand, valueToReceive);

  const maximumLockedPriceForLiquidation =
    depositAmount &&
    mintAmount &&
    selectedParams &&
    !AmountMath.isEmpty(depositAmount)
      ? {
          amountIn: depositAmount,
          amountOut: ceilMultiplyBy(
            mintAmount,
            selectedParams.liquidationMargin,
          ),
        }
      : undefined;

  const maximumLockedPriceForLiquidationForDisplay =
    maximumLockedPriceForLiquidation
      ? displayPrice && displayPrice(maximumLockedPriceForLiquidation, 2)
      : '---';

  const mintAmountForDisplay =
    displayAmount && displayBrandPetname && mintAmount
      ? `${displayAmount(mintAmount, 2, 'locale')} ${displayBrandPetname(
          debtBrand,
        )}`
      : '--';

  const stabilityFeeForDisplay =
    displayPercent && selectedParams
      ? `${displayPercent(selectedParams.stabilityFee, 2)}%`
      : '--';

  const creationFeeForDisplay =
    displayPercent && selectedParams
      ? `${displayPercent(selectedParams.mintFee, 2)}%`
      : '--';

  const liquidationRatioForDisplay =
    displayPercent && selectedParams
      ? `${displayPercent(selectedParams.liquidationMargin, 0)}%`
      : '--';

  const collateralizationRatioForDisplay =
    displayPercent && collateralizationRatio
      ? `${displayPercent(collateralizationRatio, 0)}%`
      : '--';

  const minCollateralizationForDisplay =
    displayPercent && selectedParams
      ? `${displayPercent(selectedParams.inferredMinimumCollateralization, 0)}%`
      : '--';

  const debtBalance =
    selectedParams &&
    mintAmount &&
    debtAfterChange(
      DebtAction.Mint,
      selectedParams.mintFee,
      AmountMath.makeEmpty(debtBrand),
      mintAmount,
    );

  const debtBalanceForDisplay =
    displayAmount && displayBrandPetname && debtBalance
      ? `${displayAmount(debtBalance, 2, 'locale')} ${displayBrandPetname(
          debtBrand,
        )}`
      : '--';

  const hasErrors =
    collateralizationRatioError || toLockError || toReceiveError;

  const userVaultCount = userVaults?.size ?? 0;
  const vaultLimitReached = userVaultCount >= vaultLimit;

  const canCreateVault =
    !hasErrors &&
    selectedMetrics &&
    selectedParams &&
    factoryParams &&
    depositAmount &&
    mintAmount &&
    !isSmartWalletStatusLoading &&
    !vaultLimitReached;

  const createVault = async () => {
    setIsProvisionDialogOpen(false);
    assert(depositAmount);
    assert(mintAmount);
    await makeOpenVaultOffer(depositAmount, mintAmount, () =>
      setIsVaultCreationDialogOpen(true),
    );
  };

  const confirmVaultCreation = () => {
    if (isSmartWalletMissing) {
      setIsProvisionDialogOpen(true);
      return;
    }
    createVault();
  };

  const vaultLimitWarning =
    userVaultCount >= vaultLimitWarningThreshold ? (
      <div className="my-2 text-interOrange font-serif text-xs">
        This account has created {userVaultCount} vaults. There is a limit of
        150 vaults per account.
      </div>
    ) : null;

  const isSmartWalletMissing = isSmartWalletProvisioned === false;

  const createButtonLabel = useMemo(() => {
    if (!chainConnection) {
      return 'Connect Wallet';
    }
    if (vaultLimitReached) {
      return 'Vault Limit Reached';
    }

    return 'Create Vault';
  }, [chainConnection, vaultLimitReached]);

  const debtBalanceInfo = debtBalance ? (
    <Popover className="inline absolute -right-5 top-[3px]">
      <Popover.Button className="text-base">
        <HiOutlineInformationCircle />
      </Popover.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="absolute text-center z-10 w-44 -left-40">
          <div className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black/5">
            <div className="relative bg-slate-700 text-white font-normal p-2">
              Minted IST + Minting Fee
            </div>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  ) : (
    ''
  );

  return (
    <>
      <div className="pt-[28px] pb-3 bg-white rounded-10 shadow-card">
        <div className="px-8">
          <h3 className="mb-4 font-serif text-[22px] font-extrabold leading-[35px]">
            Vault Summary
          </h3>
          <h4 className="font-serif font-bold leading-[26px]">
            Confirm Details
          </h4>
          <div className="w-full p-2">
            <table className="w-full">
              <tbody>
                <TableRow left="Depositing" right={depositAmountForDisplay} />
                <TableRow left="Minting" right={mintAmountForDisplay} />
                <TableRow
                  left="Your Debt Balance"
                  right={debtBalanceForDisplay}
                  info={debtBalanceInfo}
                />
                <TableRow
                  left="Collateralization Ratio"
                  right={collateralizationRatioForDisplay}
                />
                <TableRow
                  left="Liquidation Price"
                  right={maximumLockedPriceForLiquidationForDisplay}
                />
              </tbody>
            </table>
          </div>
          <div className="w-full divider"></div>
          <div className="w-full p-2">
            <table className="w-full">
              <tbody>
                <TableRow
                  left="Minimum Collateralization Ratio"
                  right={minCollateralizationForDisplay}
                />
                <TableRow
                  left="Liquidation Ratio"
                  right={liquidationRatioForDisplay}
                />
                <TableRow left="Stability Fee" right={stabilityFeeForDisplay} />
                <TableRow left="Minting Fee" right={creationFeeForDisplay} />
              </tbody>
            </table>
          </div>
          {vaultLimitWarning}
        </div>
        <div
          className={clsx(
            'transition mt-3 mx-3 p-6 rounded-b-10 bg-opacity-[0.15]',
            canCreateVault ? 'bg-interPurple' : '',
          )}
        >
          <button
            onClick={confirmVaultCreation}
            disabled={!canCreateVault}
            className="btn-submit"
          >
            {createButtonLabel}
          </button>
        </div>
      </div>
      <VaultCreationDialog
        isOpen={isVaultCreationDialogOpen}
        onClose={() => setIsVaultCreationDialogOpen(false)}
      />
      <ProvisionSmartWalletNoticeDialog
        isOpen={isProvisionDialogOpen}
        onClose={() => setIsProvisionDialogOpen(false)}
        onConfirm={createVault}
      />
    </>
  );
};

export default NewVaultOfferSummary;
