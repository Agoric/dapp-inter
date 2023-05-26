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
    <div className="input-label">{label}</div>
    <div
      className={clsx(
        'input-wrapper w-64',
        inputProps?.disabled ? 'graydient' : 'inter-gradient',
      )}
    >
      <div className="bg-white flex flex-row rounded-sm">
        {prefix && (
          <div className="p-2 pr-1 rounded-l-sm text-sm bg-white text-secondary">
            {prefix}
          </div>
        )}
        <input
          {...inputProps}
          ref={ref}
          className={clsx(
            'appearance-none p-3 w-full bg-white outline-none text-sm font-medium placeholder:font-normal placeholder:text-secondary text-right align-middle',
            suffix ? 'rounded-r-none' : 'rounded-r-sm',
            prefix ? 'rounded-l-none' : 'rounded-l-sm',
            inputProps?.disabled && 'text-secondary',
          )}
        ></input>
        {suffix && (
          <div className="p-3 pl-1 rounded-r-sm text-sm bg-white text-secondary">
            {suffix}
          </div>
        )}
      </div>
    </div>
    <div className="text-alert font-serif text-sm mt-2 h-5">{error}</div>
  </div>
);

export default forwardRef(StyledInput);
