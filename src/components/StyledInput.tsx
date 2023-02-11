import clsx from 'clsx';
import React, { forwardRef, ReactElement, Ref } from 'react';

type Props = {
  label?: string;
  error?: string;
  prefix?: ReactElement;
  suffix?: string;
  inputProps?: React.DetailedHTMLProps<
    React.InputHTMLAttributes<HTMLInputElement>,
    HTMLInputElement
  >;
};

const StyledInput = (
  { label, error, inputProps, suffix, prefix }: Props,
  ref: Ref<HTMLInputElement>,
) => (
  <div>
    <div className="uppercase text-[#F4CCAE] text-xs font-medium my-[2px] h-5">
      {label}
    </div>
    <div
      className={clsx(
        'w-64 transition rounded p-[2px] bg-gradient-to-r shadow-[0_12px_20px_-8px_#F0F0F0] focus-within:shadow-[0_12px_20px_-8px_rgba(255,83,0,0.2)]',
        inputProps?.disabled
          ? 'from-[#D9D9D9] to-[#A8A8A8]'
          : 'from-[#FF7A1A] to-[#FFD81A]',
      )}
    >
      <div className="bg-white flex flex-row rounded-sm">
        {prefix && (
          <div className="p-2 pr-1 rounded-l-sm text-sm bg-white text-gray-400">
            {prefix}
          </div>
        )}
        <input
          {...inputProps}
          ref={ref}
          className={clsx(
            'appearance-none p-3 w-full bg-white outline-none text-sm font-medium placeholder:font-normal placeholder:text-gray-400 text-right align-middle',
            suffix ? 'rounded-r-none' : 'rounded-r-sm',
            prefix ? 'rounded-l-none' : 'rounded-l-sm',
            inputProps?.disabled && 'text-gray-400',
          )}
        ></input>
        {suffix && (
          <div className="p-3 pl-1 rounded-r-sm text-sm bg-white text-gray-400">
            {suffix}
          </div>
        )}
      </div>
    </div>
    <div className="text-[#E22951] font-serif text-sm mt-2 h-5">{error}</div>
  </div>
);

export default forwardRef(StyledInput);
