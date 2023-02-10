import { useAtom, useAtomValue } from 'jotai';
import {
  adjustVaultErrorsAtom,
  CollateralAction,
  collateralActionAtom,
  collateralDeltaValueAtom,
  DebtAction,
  debtActionAtom,
  debtDeltaValueAtom,
  vaultToAdjustAtom,
} from 'store/adjustVault';
import { displayFunctionsAtom, pursesAtom } from 'store/app';
import ErrorWarning from 'svg/error-warning';
import AmountInput from './AmountInput';
import StyledDropdown from './StyledDropdown';
import { PursesJSONState } from '@agoric/wallet-backend';
import CloseVaultDialog from './CloseVaultDialog';
import { useState } from 'react';

const AdjustVaultForm = () => {
  const displayFunctions = useAtomValue(displayFunctionsAtom);
  assert(
    displayFunctions,
    'Adjust vault requires display functions to be loaded',
  );
  const { displayBrandPetname } = displayFunctions;

  const vaultToAdjust = useAtomValue(vaultToAdjustAtom);

  const [debtAction, setDebtAction] = useAtom(debtActionAtom);
  const [collateralAction, setCollateralAction] = useAtom(collateralActionAtom);

  const [debtDeltaValue, setDebtDeltaValue] = useAtom(debtDeltaValueAtom);
  const [collateralDeltaValue, setCollateralDeltaValue] = useAtom(
    collateralDeltaValueAtom,
  );

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

  return (
    <>
      <div className="bg-white font-serif p-8 shadow-[0_40px_40px_-14px_rgba(116,116,116,0.25)] rounded-[20px] w-full">
        <div className="font-bold mb-4">Adjust Collateral</div>
        <div className="mb-12 grid grid-cols-2 gap-10">
          <div className="text-[#9193A5] text-sm col-span-2 lg:col-span-1">
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
                label="Action"
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
              value={collateralDeltaValue}
              onChange={setCollateralDeltaValue}
              label="Amount"
              disabled={collateralAction === CollateralAction.None}
              error={collateralError}
            />
          </div>
        </div>
        <div className="w-full h-[1px] bg-gradient-to-r from-[#FF7B1B] to-[#FFD91B] opacity-30"></div>
        <div className="mt-8 font-bold mb-4">Adjust Debt</div>
        <div className="mb-12 grid grid-cols-2 gap-10">
          <div className="text-[#9193A5] text-sm col-span-2 lg:col-span-1">
            Borrow additional IST or repay your existing IST debt. Select “No
            Action” to leave debt unchanged.
          </div>
          <div className="col-span-2 lg:col-span-1">
            <div className="mb-6">
              <StyledDropdown
                selection={debtAction}
                choices={[DebtAction.None, DebtAction.Borrow, DebtAction.Repay]}
                onSelection={setDebtAction}
                label="Action"
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
              onChange={setDebtDeltaValue}
              value={debtDeltaValue}
              brand={vaultToAdjust?.totalDebt.brand}
              label="Amount"
              disabled={debtAction === DebtAction.None}
              error={debtError}
            />
          </div>
        </div>
        {isActive && (
          <button
            onClick={() => setIsCloseVaultDialogOpen(true)}
            className="text-btn-xs flex items-center gap-3 transition text-[#E22951] rounded-[6px] border-2 border-solid border-[#E22951] h-8 px-4 leading-[14px] font-bold text-xs bg-[#E22951] bg-opacity-0 hover:bg-opacity-10 active:bg-opacity-20"
          >
            <span className="fill-[#E22951]">
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
