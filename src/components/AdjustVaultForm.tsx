import ErrorWarning from 'svg/error-warning';
import AmountInput from './AmountInput';
import StyledDropdown from './StyledDropdown';

const AdjustVaultForm = () => {
  return (
    <div className="bg-white font-serif p-8 shadow-[0_40px_40px_-14px_rgba(116,116,116,0.25)] rounded-[20px] w-full">
      <div className="font-bold mb-4">Adjust Collateral</div>
      <div className="mb-12 grid grid-cols-2 gap-10">
        <div className="text-[#9193A5] text-sm col-span-2 lg:col-span-1">
          Deposit additional collateral or withdraw your existing collateral.
          Select No Action to leave collateral unchanged.
        </div>
        <div className="col-span-2 lg:col-span-1">
          <div className="mb-6">
            <StyledDropdown
              selection="No Action"
              choices={['No Action']}
              onSelection={() => {
                console.log('Handle Action Selected');
              }}
              label="Action"
            />
          </div>
          <AmountInput disabled label="Available Balance" />
          <AmountInput
            onChange={() => {
              console.log('Handle Amount Change');
            }}
            label="Amount"
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
              selection="No Action"
              choices={['No Action']}
              onSelection={() => {
                console.log('Handle Action Selected');
              }}
              label="Action"
            />
          </div>
          <AmountInput disabled label="Available Balance" />
          <AmountInput
            onChange={() => {
              console.log('Handle Amount Change');
            }}
            label="Amount"
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
