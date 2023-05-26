import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  adjustVaultErrorsAtom,
  CollateralAction,
  collateralActionAtom,
  debtInputAmountAtom,
  DebtAction,
  debtActionAtom,
  collateralInputAmountAtom,
  vaultAfterAdjustmentAtom,
  vaultToAdjustAtom,
  debtInputValueAtom,
  collateralInputValueAtom,
} from 'store/adjustVault';
import { displayFunctionsAtom, pursesAtom } from 'store/app';
import ErrorWarning from 'svg/error-warning';
import AmountInput from './AmountInput';
import StyledDropdown from './StyledDropdown';
import { PursesJSONState } from '@agoric/wallet-backend';
import CloseVaultDialog from './CloseVaultDialog';
import { useState } from 'react';
import { maxIstToMintFromVault } from 'utils/vaultMath';
import AssetTransferButton from './AssetTransferButton';

const AdjustVaultForm = () => {
  const displayFunctions = useAtomValue(displayFunctionsAtom);
  assert(
    displayFunctions,
    'Adjust vault requires display functions to be loaded',
  );
  const { displayBrandPetname, displayPercent } = displayFunctions;

  const vaultToAdjust = useAtomValue(vaultToAdjustAtom);
  const vaultAfterAdjustment = useAtomValue(vaultAfterAdjustmentAtom);

  const [debtAction, setDebtAction] = useAtom(debtActionAtom);
  const [collateralAction, setCollateralAction] = useAtom(collateralActionAtom);

  const setDebtInputValue = useSetAtom(debtInputValueAtom);
  const setCollateralInputValue = useSetAtom(collateralInputValueAtom);
  const debtInputAmount = useAtomValue(debtInputAmountAtom);
  const collateralInputAmount = useAtomValue(collateralInputAmountAtom);

  const purses = useAtomValue(pursesAtom);
  const collateralPurse = purses?.find(
    p => p.brand === vaultToAdjust?.locked.brand,
  ) as PursesJSONState<'nat'> | undefined;
  const debtPurse = purses?.find(
    p => p.brand === vaultToAdjust?.totalDebt.brand,
  ) as PursesJSONState<'nat'> | undefined;

  const { collateralError, debtError } = useAtomValue(adjustVaultErrorsAtom);

  const [isCloseVaultDialogOpen, setIsCloseVaultDialogOpen] = useState(false);

  const isActive = vaultToAdjust?.vaultState === 'active';

  const onMaxCollateralClicked = () => {
    assert(collateralAction === CollateralAction.Deposit);

    if (!collateralPurse) {
      /* no-op */
      return;
    }

    setCollateralInputValue(collateralPurse.currentAmount.value);
  };

  const onMaxDebtClicked = () => {
    assert(debtAction === DebtAction.Mint);
    if (!(vaultToAdjust && vaultAfterAdjustment)) {
      /* no-op */
      return;
    }

    const { params, metrics, totalDebt, collateralPrice, lockedPrice } =
      vaultToAdjust;
    const { newLocked } = vaultAfterAdjustment;

    setDebtInputValue(
      maxIstToMintFromVault(
        params.debtLimit,
        metrics.totalDebt,
        totalDebt,
        params.mintFee,
        newLocked,
        collateralPrice,
        params.inferredMinimumCollateralization,
        lockedPrice,
      ),
    );
  };

  const collateralBrand = vaultToAdjust?.locked.brand;

  const depositLabel = collateralBrand
    ? `Deposit ${displayBrandPetname(collateralBrand)}`
    : 'Deposit funds';

  return (
    <>
      <div className="bg-white font-serif p-8 shadow-card rounded-20 w-full">
        <div className="font-bold mb-4">Adjust Collateral</div>
        <div className="grid grid-cols-2 gap-10">
          <div className="text-secondary text-sm col-span-2 lg:col-span-1">
            Deposit additional collateral or withdraw your existing collateral.
            Select “No Action” to leave collateral unchanged.
          </div>
          <div className="col-span-2 lg:col-span-1">
            <div className="mb-6">
              <StyledDropdown
                selection={collateralAction}
                choices={[
                  CollateralAction.None,
                  CollateralAction.Deposit,
                  CollateralAction.Withdraw,
                ]}
                onSelection={setCollateralAction}
                label="Select Action"
              />
            </div>
            <AmountInput
              disabled
              label="Available Purse Balance"
              suffix={displayBrandPetname(vaultToAdjust?.locked.brand)}
              value={collateralPurse?.currentAmount?.value}
              brand={collateralPurse?.brand}
            />
            <AmountInput
              brand={vaultToAdjust?.locked.brand}
              value={collateralInputAmount?.value}
              onChange={setCollateralInputValue}
              label="Amount"
              disabled={collateralAction === CollateralAction.None}
              error={collateralError}
              actionLabel={
                collateralAction === CollateralAction.Deposit
                  ? 'Max'
                  : undefined
              }
              onAction={onMaxCollateralClicked}
            />
          </div>
        </div>
        <AssetTransferButton className="mb-8" message={depositLabel} />
        <div className="w-full divider-gradient"></div>
        <div className="mt-8 font-bold mb-4">Adjust Debt</div>
        <div className="mb-4 grid grid-cols-2 gap-10">
          <div className="text-secondary text-sm col-span-2 lg:col-span-1">
            Mint additional IST or repay your existing IST debt. Select “No
            Action” to leave debt unchanged.
            <p className="mt-4 italic font-serif text-sm leading-[22px]">
              {debtAction === DebtAction.Mint &&
                vaultToAdjust?.params &&
                `A minting fee of ${displayPercent(
                  vaultToAdjust?.params.mintFee,
                  2,
                )}%
          will be charged upon vault creation.`}
            </p>
          </div>
          <div className="col-span-2 lg:col-span-1">
            <div className="mb-6">
              <StyledDropdown
                selection={debtAction}
                choices={[DebtAction.None, DebtAction.Mint, DebtAction.Repay]}
                onSelection={setDebtAction}
                label="Select Action"
              />
            </div>
            <AmountInput
              disabled
              label="Available Purse Balance"
              value={debtPurse?.currentAmount?.value}
              brand={debtPurse?.brand}
              suffix={displayBrandPetname(vaultToAdjust?.totalDebt.brand)}
            />
            <AmountInput
              onChange={setDebtInputValue}
              value={debtInputAmount?.value}
              brand={vaultToAdjust?.totalDebt.brand}
              label="Amount"
              disabled={debtAction === DebtAction.None}
              error={debtError}
              actionLabel={debtAction === DebtAction.Mint ? 'Max' : undefined}
              onAction={onMaxDebtClicked}
            />
          </div>
        </div>
        {isActive && (
          <button
            onClick={() => setIsCloseVaultDialogOpen(true)}
            className="text-btn-xs flex items-center gap-3 transition text-alert rounded-md border-2 border-solid border-alert h-8 px-4 font-bold text-xs bg-alert bg-opacity-0 hover:bg-opacity-10 active:bg-opacity-20"
          >
            <span className="fill-alert">
              <ErrorWarning />
            </span>
            Close Out Vault
          </button>
        )}
      </div>
      <CloseVaultDialog
        isOpen={isCloseVaultDialogOpen}
        onClose={() => setIsCloseVaultDialogOpen(false)}
        vaultOfferId={vaultToAdjust?.createdByOfferId}
        totalCollateral={vaultToAdjust?.locked}
        totalDebt={vaultToAdjust?.totalDebt}
      />
    </>
  );
};

export default AdjustVaultForm;
