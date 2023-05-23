import { AmountMath } from '@agoric/ertp';
import clsx from 'clsx';
import { useAtomValue } from 'jotai';
import { useMemo, useState } from 'react';
import { makeOpenVaultOffer } from 'service/vaults';
import { displayFunctionsAtom, offerSignerAtom } from 'store/app';
import {
  collateralizationRatioAtom,
  inputErrorsAtom,
  selectedCollateralIdAtom,
  valueToLockAtom,
  valueToReceiveAtom,
} from 'store/createVault';
import { useVaultStore } from 'store/vaults';
import VaultCreationDialog from './VaultCreationDialog';

type TableRowProps = {
  left: string;
  right: string;
};

const TableRow = ({ left, right }: TableRowProps) => {
  return (
    <tr className="text-[13px] leading-[21px]">
      <td className="text-[#A3A5B9]">{left}</td>
      <td className="text-right text-[#666980] font-black">{right}</td>
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
  const offerSigner = useAtomValue(offerSignerAtom);

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

  const interestRateForDisplay =
    displayPercent && selectedParams
      ? `${displayPercent(selectedParams.interestRate, 2)}%`
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
    !vaultLimitReached &&
    offerSigner?.isDappApproved;

  const createVault = async () => {
    await makeOpenVaultOffer(depositAmount, mintAmount);
    setIsVaultCreationDialogOpen(true);
  };

  const vaultLimitWarning =
    userVaultCount >= vaultLimitWarningThreshold ? (
      <div className="my-2 text-interOrange font-serif text-xs">
        This account has created {userVaultCount} vaults. There is a limit of
        150 vaults per account.
      </div>
    ) : null;

  const createButtonLabel = useMemo(() => {
    if (!offerSigner?.addOffer) {
      return 'Connect Wallet';
    }
    if (vaultLimitReached) {
      return 'Vault Limit Reached';
    }
    if (!offerSigner?.isDappApproved) {
      return 'Enable Dapp in Wallet';
    }

    return 'Create Vault';
  }, [offerSigner, vaultLimitReached]);

  return (
    <>
      <div className="pt-[28px] pb-3 bg-white rounded-[10px] shadow-[0_22px_34px_0_rgba(116,116,116,0.25)]">
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
                <TableRow left="Stability Fee" right={interestRateForDisplay} />
                <TableRow
                  left="Minimum Collateralization Ratio"
                  right={minCollateralizationForDisplay}
                />
              </tbody>
            </table>
          </div>
          <div className="w-full h-[1px] bg-[#D8D8D8]"></div>
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
            'transition mt-3 mx-3 p-6 rounded-b-[10px]',
            canCreateVault ? 'bg-[#F3EFF9]' : '',
          )}
        >
          <button
            onClick={createVault}
            disabled={!canCreateVault}
            className={clsx(
              'transition w-full py-3 text-white font-extrabold text-sm rounded-[6px]',
              canCreateVault
                ? 'bg-interPurple shadow-[0px_13px_20px_-6px_rgba(125,50,222,0.25)] hover:opacity-80 active:opacity-70'
                : 'bg-[#C1C3D7] cursor-not-allowed',
            )}
          >
            {createButtonLabel}
          </button>
        </div>
      </div>
      <VaultCreationDialog
        isOpen={isVaultCreationDialogOpen}
        onClose={() => setIsVaultCreationDialogOpen(false)}
      />
    </>
  );
};

export default NewVaultOfferSummary;
