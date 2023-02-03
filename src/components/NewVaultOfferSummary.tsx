import { AmountMath } from '@agoric/ertp';
import clsx from 'clsx';
import { useAtomValue } from 'jotai';
import { useMemo, useState } from 'react';
import { makeOpenVaultOffer } from 'service/vaults';
import { displayFunctionsAtom, offerSignerAtom } from 'store/app';
import {
  collateralizationRatioAtom,
  selectedCollateralIdAtom,
  valueToLockAtom,
  valueToReceiveAtom,
  VaultCreationErrors,
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

type Props = {
  inputErrors: VaultCreationErrors;
};

const NewVaultOfferSummary = ({ inputErrors }: Props) => {
  const { collateralizationRatioError, toLockError, toReceiveError } =
    inputErrors;

  const selectedCollateralId = useAtomValue(selectedCollateralIdAtom);
  const valueToReceive = useAtomValue(valueToReceiveAtom);
  const valueToLock = useAtomValue(valueToLockAtom);
  const collateralizationRatio = useAtomValue(collateralizationRatioAtom);
  const offerSigner = useAtomValue(offerSignerAtom);

  const { displayAmount, displayBrandPetname, displayPercent } =
    useAtomValue(displayFunctionsAtom) ?? {};

  const { metrics, params, factoryParams } = useVaultStore(vaults => ({
    metrics: vaults.vaultMetrics,
    params: vaults.vaultGovernedParams,
    factoryParams: vaults.vaultFactoryParams,
  }));

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
      ? `${displayAmount(depositAmount, 2, true)} ${displayBrandPetname(
          collateralBrand,
        )}`
      : '--';

  const borrowAmount =
    valueToReceive && debtBrand && AmountMath.make(debtBrand, valueToReceive);

  const borrowAmountForDisplay =
    displayAmount && displayBrandPetname && borrowAmount
      ? `${displayAmount(borrowAmount, 2, true)} ${displayBrandPetname(
          debtBrand,
        )}`
      : '--';

  const interestRateForDisplay =
    displayPercent && selectedParams
      ? `${displayPercent(selectedParams.interestRate, 2)}%`
      : '--';

  const creationFeeForDisplay =
    displayPercent && selectedParams
      ? `${displayPercent(selectedParams.loanFee, 2)}%`
      : '--';

  const liquidationRatioForDisplay =
    displayPercent && selectedParams
      ? `${displayPercent(selectedParams.liquidationMargin, 0)}%`
      : '--';

  const collateralizationRatioForDisplay =
    displayPercent && collateralizationRatio
      ? `${displayPercent(collateralizationRatio, 0)}%`
      : '--';

  const hasErrors =
    collateralizationRatioError || toLockError || toReceiveError;

  const canCreateVault =
    !hasErrors &&
    selectedMetrics &&
    selectedParams &&
    factoryParams &&
    depositAmount &&
    borrowAmount &&
    offerSigner?.isDappApproved;

  const createVault = async () => {
    await makeOpenVaultOffer(depositAmount, borrowAmount);
    setIsVaultCreationDialogOpen(true);
  };

  const createButtonLabel = useMemo(() => {
    if (!offerSigner?.addOffer) {
      return 'Connect Wallet';
    }
    if (!offerSigner?.isDappApproved) {
      return 'Enable Dapp in Wallet';
    }

    return 'Create Vault';
  }, [offerSigner]);

  return (
    <>
      <div className="pt-[28px] pb-3 bg-white rounded-[10px] shadow-[0_22px_34px_0_rgba(116,116,116,0.25)]">
        <div className="px-8">
          <h3 className="mb-4 font-serif text-[22px] font-extrabold leading-[35px]">
            Offer Summary
          </h3>
          <h4 className="font-serif font-bold leading-[26px]">
            Confirm Details
          </h4>
          <div className="w-full p-2">
            <table className="w-full">
              <tbody>
                <TableRow left="Depositing" right={depositAmountForDisplay} />
                <TableRow left="Borrowing" right={borrowAmountForDisplay} />
                <TableRow left="Interest Rate" right={interestRateForDisplay} />
                <TableRow left="Minimum Collateralization Ratio" right="--" />
              </tbody>
            </table>
          </div>
          <div className="w-full h-[1px] bg-[#D8D8D8]"></div>
          <div className="w-full p-2">
            <table className="w-full">
              <tbody>
                <TableRow
                  left="Vault Creation Fee"
                  right={creationFeeForDisplay}
                />
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
