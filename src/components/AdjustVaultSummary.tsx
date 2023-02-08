import clsx from 'clsx';
import { useAtomValue } from 'jotai';
import { displayFunctionsAtom } from 'store/app';
import { makeRatioFromAmounts } from '@agoric/zoe/src/contractSupport';
import { vaultToAdjustAtom } from 'store/adjustVault';

type TableRowProps = {
  left: string;
  right: string;
};

const TableRow = ({ left, right }: TableRowProps) => {
  return (
    <tr className="text-[13px] leading-[21px]">
      <td className="text-[#A3A5B9] text-left pr-2">{left}</td>
      <td className="text-right text-[#666980] font-black">{right}</td>
    </tr>
  );
};

type TableRowWithArrowProps = {
  label: string;
  left: string;
  right: string;
};

const TableRowWithArrow = ({ label, left, right }: TableRowWithArrowProps) => {
  return (
    <tr className="text-[13px] leading-[21px]">
      <td className="text-[#A3A5B9] text-left">{label}</td>
      <td className="text-[#666980] font-black px-2">{left}</td>
      <td className="text-[#666980] font-black px-2">&#8594;</td>
      <td className="text-right text-[#666980] font-black">{right}</td>
    </tr>
  );
};

const AdjustVaultSummary = () => {
  const canMakeOffer = true;
  const adjustButtonLabel = 'Make Offer';

  // We shouldn't ever see this component before display functions are loaded,
  // so we don't need more graceful fallbacks. Just don't crash.
  const { displayAmount, displayBrandPetname, displayPercent } = useAtomValue(
    displayFunctionsAtom,
  ) ?? {
    displayAmount: () => '',
    displayBrandPetname: () => '',
    displayPercent: () => '',
  };

  const vaultToAdjust = useAtomValue(vaultToAdjustAtom);
  if (!vaultToAdjust) {
    // The vault should already be loaded before showing this component, so no
    // need for a nice loading state.
    return <div>Loading...</div>;
  }

  const { totalLockedValue, totalDebt, locked, params } = vaultToAdjust;

  const collateralizationRatio = makeRatioFromAmounts(
    totalLockedValue,
    totalDebt,
  );

  return (
    <div className="w-full pt-[28px] pb-3 bg-white rounded-[10px] shadow-[0_22px_34px_0_rgba(116,116,116,0.25)]">
      <div className="px-8">
        <h3 className="mb-4 font-serif text-[22px] font-extrabold leading-[35px]">
          Vault Summary
        </h3>
        <h4 className="font-serif font-bold leading-[26px]">Confirm Details</h4>
        <div className="w-full p-2">
          <table className="w-full">
            <tbody>
              <TableRowWithArrow
                label="Depositing"
                left={`${displayAmount(
                  locked,
                  2,
                  'locale',
                )} ${displayBrandPetname(locked.brand)}`}
                right="--"
              />
              <TableRowWithArrow
                label="Borrowing"
                left={`${displayAmount(
                  totalDebt,
                  2,
                  'locale',
                )} ${displayBrandPetname(totalDebt.brand)}`}
                right="--"
              />
              <TableRowWithArrow
                label="Collateralization Ratio"
                left={`${displayPercent(collateralizationRatio, 0)}%`}
                right="--"
              />
            </tbody>
          </table>
        </div>
        <div className="w-full h-[1px] bg-[#D8D8D8]"></div>
        <div className="w-full p-2">
          <table className="w-full">
            <tbody>
              <TableRow left="Min. Collateralization Ratio" right="--" />
              <TableRow
                left="Liquidation Ratio"
                right={`${displayPercent(params.liquidationMargin, 0)}%`}
              />
              <TableRow
                left="Interest Rate"
                right={`${displayPercent(params.interestRate, 2)}%`}
              />
            </tbody>
          </table>
        </div>
      </div>
      <div
        className={clsx(
          'transition mt-3 mx-3 p-6 rounded-b-[10px]',
          canMakeOffer ? 'bg-[#F3EFF9]' : '',
        )}
      >
        <button
          className={clsx(
            'transition w-full py-3 text-white font-extrabold text-sm rounded-[6px]',
            canMakeOffer
              ? 'bg-interPurple shadow-[0px_13px_20px_-6px_rgba(125,50,222,0.25)] hover:opacity-80 active:opacity-70'
              : 'bg-[#C1C3D7] cursor-not-allowed',
          )}
        >
          {adjustButtonLabel}
        </button>
      </div>
    </div>
  );
};

export default AdjustVaultSummary;
