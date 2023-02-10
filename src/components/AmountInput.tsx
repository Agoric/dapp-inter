import { forwardRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { displayFunctionsAtom } from 'store/app';
import { stringifyValue, parseAsValue } from '@agoric/ui-components';
import { AssetKind } from '@agoric/ertp';
import StyledInput from './StyledInput';
import type { Brand } from '@agoric/ertp/src/types';
import type { Ref } from 'react';
import clsx from 'clsx';

const noop = () => {
  /* no-op */
};

type Props = {
  value?: bigint | null;
  label?: string;
  error?: string;
  brand?: Brand | null;
  suffix?: string;
  actionLabel?: string;
  onChange?: (value: bigint) => void;
  onAction?: () => void;
  disabled?: boolean;
};

const AmountInput = (
  {
    value,
    brand,
    label,
    error,
    suffix,
    actionLabel,
    onChange = noop,
    onAction = noop,
    disabled = false,
  }: Props,
  ref: Ref<HTMLInputElement>,
) => {
  const { getDecimalPlaces } = useAtomValue(displayFunctionsAtom) ?? {};

  const decimalPlaces =
    (brand && getDecimalPlaces && getDecimalPlaces(brand)) ?? 0;

  const amountString = stringifyValue(value, AssetKind.NAT, decimalPlaces);

  const [fieldString, setFieldString] = useState(
    value === null ? '' : amountString,
  );

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = ev => {
    // Inputs with type "number" allow these characters which don't apply to
    // Amounts, just strip them.
    const str = ev.target?.value
      ?.replace('-', '')
      .replace('e', '')
      .replace('E', '');
    setFieldString(str);

    try {
      const parsed = parseAsValue(str, AssetKind.NAT, decimalPlaces);
      onChange(parsed);
    } catch {
      console.warn('Invalid input', str);
    }
  };

  // Use the `fieldString` as an input buffer so the user can type values that
  // would be overwritten by `stringifyValue`. For example, if the current
  // input is "1.05", and you tried to change it to "1.25", on hitting
  // backspace, `stringifyValue` would change it from "1.0" to "1.00",
  // preventing you from ever editing it. Only let `amountString` override
  // `fieldString` if the controlled input is trying to change it to a truly
  // different value.
  const displayString =
    value === parseAsValue(fieldString, AssetKind.NAT, decimalPlaces)
      ? fieldString
      : amountString;

  const prefix = actionLabel ? (
    <button
      className={clsx(
        'rounded bg-gray-100 py-1 px-2 transition font-medium font-sans',
        disabled ? '' : 'hover:text-mineShaft hover:bg-gray-200',
      )}
      onClick={onAction}
      disabled={disabled}
    >
      {actionLabel}
    </button>
  ) : undefined;

  return (
    <StyledInput
      label={label}
      error={error}
      prefix={prefix}
      suffix={suffix}
      inputProps={{
        type: 'number',
        placeholder: '0.00',
        min: '0',
        disabled,
        value: displayString,
        onChange: handleInputChange,
      }}
      ref={ref}
    />
  );
};

export default forwardRef(AmountInput);
