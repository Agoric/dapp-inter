import clsx from 'clsx';
import type { Amount } from '@agoric/ertp/src/types';
import { useAtomValue } from 'jotai';
import { displayFunctionsAtom } from 'store/app';
import { useVaultStore } from 'store/vaults';
import { makeRatioFromAmounts } from '@agoric/zoe/src/contractSupport';

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

type Props = {
  locked: Amount<'nat'>;
  debt: Amount<'nat'>;
  lockedValue: Amount<'nat'>;
  managerId: string;
};

const AdjustVaultSummary = ({
  locked,
  debt,
  lockedValue,
  managerId,
}: Props) => {
  const canMakeOffer = true;
  const adjustButtonLabel = 'Make Offer';

  const { governedParams } = useVaultStore(state => ({
    governedParams: state.vaultGovernedParams,
  }));

  const params = governedParams.get(managerId);

  const collateralizationRatio = makeRatioFromAmounts(lockedValue, debt);

  const { displayAmount, displayBrandPetname, displayPercent } =
    useAtomValue(displayFunctionsAtom) ?? {};

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
                left={`${displayAmount && displayAmount(locked, 2, 'locale')} ${
                  displayBrandPetname && displayBrandPetname(locked.brand)
                }`}
                right="--"
              />
              <TableRowWithArrow
                label="Borrowing"
                left={`${displayAmount && displayAmount(debt, 2, 'locale')} ${
                  displayBrandPetname && displayBrandPetname(debt.brand)
                }`}
                right="--"
              />
              <TableRowWithArrow
                label="Collateralization Ratio"
                left={`${
                  displayPercent && displayPercent(collateralizationRatio, 0)
                }%`}
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
                right={`${
                  params &&
                  displayPercent &&
                  displayPercent(params.liquidationMargin, 0)
                }%`}
              />
              <TableRow
                left="Interest Rate"
                right={`${
                  params &&
                  displayPercent &&
                  displayPercent(params.interestRate, 2)
                }%`}
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
