import clsx from 'clsx';

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

const NewVaultOfferSummary = () => {
  const isDisabled = true;

  return (
    <div className="pt-[28px] pb-3 bg-white rounded-[10px] shadow-[0_22px_34px_0_rgba(116,116,116,0.25)]">
      <div className="px-8">
        <h3 className="mb-4 font-serif text-[22px] font-extrabold leading-[35px]">
          Offer Summary
        </h3>
        <h4 className="font-serif font-bold leading-[26px]">Confirm Details</h4>
        <div className="w-full p-2">
          <table className="w-full">
            <tbody>
              <TableRow left="Depositing" right="--" />
              <TableRow left="Borrowing" right="--" />
              <TableRow left="Interest Rate" right="--" />
              <TableRow left="Minimum Collateralization Ratio" right="--" />
            </tbody>
          </table>
        </div>
        <div className="w-full h-[1px] bg-[#D8D8D8]"></div>
        <div className="w-full p-2">
          <table className="w-full">
            <tbody>
              <TableRow left="Vault Creation Fee" right="--" />
              <TableRow left="Liquidation Ratio" right="--" />
              <TableRow left="Collateralization Ratio" right="--" />
            </tbody>
          </table>
        </div>
      </div>
      <div
        className={clsx(
          'transition mt-3 mx-3 p-6 rounded-b-[10px]',
          isDisabled ? '' : 'bg-[#F3EFF9]',
        )}
      >
        <button
          className={clsx(
            'transition w-full py-3 text-white font-extrabold text-sm rounded-[6px]',
            isDisabled
              ? 'bg-[#C1C3D7] cursor-not-allowed'
              : 'bg-interPurple shadow-[0px_13px_20px_-6px_rgba(125,50,222,0.25)] hover:opacity-80 active:opacity-70',
          )}
        >
          Create Vault
        </button>
      </div>
    </div>
  );
};

export default NewVaultOfferSummary;
