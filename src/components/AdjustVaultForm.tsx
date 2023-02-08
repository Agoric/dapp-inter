import { useAtom, useAtomValue } from 'jotai';
import {
  CollateralAction,
  collateralActionAtom,
  DebtAction,
  debtActionAtom,
  vaultToAdjustAtom,
} from 'store/adjustVault';
import { displayFunctionsAtom, pursesAtom } from 'store/app';
import ErrorWarning from 'svg/error-warning';
import AmountInput from './AmountInput';
import StyledDropdown from './StyledDropdown';
import type { Amount } from '@agoric/ertp/src/types';

const AdjustVaultForm = () => {
  // We shouldn't ever see this component before display functions are loaded,
  // so we don't need more graceful fallbacks. Just don't crash.
  const { displayBrandPetname } = useAtomValue(displayFunctionsAtom) ?? {
    displayBrandPetname: () => '',
  };

  const vaultToAdjust = useAtomValue(vaultToAdjustAtom);

  const [debtAction, setDebtAction] = useAtom(debtActionAtom);
  const [collateralAction, setCollateralAction] = useAtom(collateralActionAtom);

  const purses = useAtomValue(pursesAtom);
  const collateralPurse =
    purses && purses.find(p => p.brand === vaultToAdjust?.locked.brand);
  const debtPurse =
    purses && purses.find(p => p.brand === vaultToAdjust?.totalDebt.brand);

  return (
    <div className="bg-white font-serif p-8 shadow-[0_40px_40px_-14px_rgba(116,116,116,0.25)] rounded-[20px] w-full">
      <div className="font-bold mb-4">Adjust Collateral</div>
      <div className="mb-12 grid grid-cols-2 gap-10">
        <div className="text-[#9193A5] text-sm col-span-2 lg:col-span-1">
          Deposit additional collateral or withdraw your existing collateral.
          Select &quot;No Action&quot; to leave collateral unchanged.
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
            label="Available Balance"
            suffix={displayBrandPetname(vaultToAdjust?.locked.brand)}
            value={
              (collateralPurse?.currentAmount as Amount<'nat'> | undefined)
                ?.value
            }
            brand={collateralPurse?.brand}
          />
          <AmountInput
            onChange={() => {
              // TODO
              console.log('Handle Amount Change');
            }}
            label="Amount"
            disabled={collateralAction === CollateralAction.None}
          />
        </div>
      </div>
      <div className="w-full h-[1px] bg-gradient-to-r from-[#FF7B1B] to-[#FFD91B] opacity-30"></div>
      <div className="mt-8 font-bold mb-4">Adjust Debt</div>
      <div className="mb-12 grid grid-cols-2 gap-10">
        <div className="text-[#9193A5] text-sm col-span-2 lg:col-span-1">
          Borrow additional IST or repay your existing IST debt. Select &quot;No
          Action&quot; to leave debt unchanged.
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
            label="Available Balance"
            value={
              (debtPurse?.currentAmount as Amount<'nat'> | undefined)?.value
            }
            brand={debtPurse?.brand}
            suffix={displayBrandPetname(vaultToAdjust?.totalDebt.brand)}
          />
          <AmountInput
            onChange={() => {
              console.log('Handle Amount Change');
            }}
            label="Amount"
            disabled={debtAction === DebtAction.None}
          />
        </div>
      </div>
      <button className="text-btn-xs flex items-center gap-3 transition text-[#E22951] rounded-[6px] border-2 border-solid border-[#E22951] h-8 px-4 leading-[14px] font-bold text-xs bg-[#E22951] bg-opacity-0 hover:bg-opacity-10 active:bg-opacity-20">
        <span className="fill-[#E22951]">
          <ErrorWarning />
        </span>
        Close Out Vault
      </button>
    </div>
  );
};

export default AdjustVaultForm;
