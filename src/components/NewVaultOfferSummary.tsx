import { AmountMath } from '@agoric/ertp';
import clsx from 'clsx';
import { useAtomValue } from 'jotai';
import { useMemo, useState } from 'react';
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

type TableRowProps = {
  left: string;
  right: string;
};

const TableRow = ({ left, right }: TableRowProps) => {
  return (
    <tr className="text-[13px] leading-[21px]">
      <td className="text-secondary">{left}</td>
      <td className="text-right text-alternative font-black">{right}</td>
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

  const { displayAmount, displayBrandPetname, displayPercent } =
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
                <TableRow left="Stability Fee" right={stabilityFeeForDisplay} />
                <TableRow
                  left="Minimum Collateralization Ratio"
                  right={minCollateralizationForDisplay}
                />
              </tbody>
            </table>
          </div>
          <div className="w-full divider"></div>
          <div className="w-full p-2">
            <table className="w-full">
              <tbody>
                <TableRow left="Minting Fee" right={creationFeeForDisplay} />
                <TableRow
                  left="Liquidation Ratio"
                  right={liquidationRatioForDisplay}
                />
                <TableRow
                  left="Collateralization Ratio"
                  right={collateralizationRatioForDisplay}
                />
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
