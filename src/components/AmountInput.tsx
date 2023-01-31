import clsx from 'clsx';

type InputProps = {
  label?: string;
  error?: string;
  isDisabled?: boolean;
};

const AmountInput = ({ label, error, isDisabled = false }: InputProps) => {
  return (
    <div>
      <div className="uppercase text-[#F4CCAE] text-xs leading-[19px] my-[2px]">
        {label}
      </div>
      <div
        className={clsx(
          'w-fit transition rounded p-[2px] bg-gradient-to-r shadow-[0_12px_20px_-8px_#F0F0F0] focus-within:shadow-[0_12px_20px_-8px_rgba(255,83,0,0.2)]',
          isDisabled
            ? 'from-[#D9D9D9] to-[#A8A8A8]'
            : 'from-[#FF7A1A] to-[#FFD81A]',
        )}
      >
        <input
          type="number"
          placeholder="0.00"
          min="0"
          disabled={isDisabled}
          className="p-2 bg-white rounded-sm outline-none text-sm font-medium w-64 placeholder:font-normal text-right"
        ></input>
      </div>
      <div className="text-[#E22951] font-serif text-sm mt-2">{error}</div>
    </div>
  );
};

export default AmountInput;
