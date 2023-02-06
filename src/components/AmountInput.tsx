import { useState } from 'react';
import { useAtomValue } from 'jotai';
import { displayFunctionsAtom } from 'store/app';
import { stringifyValue, parseAsValue } from '@agoric/ui-components';
import { AssetKind } from '@agoric/ertp';
import type { Brand } from '@agoric/ertp/src/types';
import StyledInput from './StyledInput';

type Props = {
  value?: bigint | null;
  label?: string;
  error?: string;
  brand?: Brand | null;
  onChange?: (value: bigint) => void;
  disabled?: boolean;
};

const AmountInput = ({
  value,
  onChange,
  brand,
  label,
  error,
  disabled = false,
}: Props) => {
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
    const str = ev.target?.value?.replace('-', '').replace('e', '');
    setFieldString(str);

    const parsed = parseAsValue(str, AssetKind.NAT, decimalPlaces);
    onChange && onChange(parsed);
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

  return (
    <StyledInput
      label={label}
      error={error}
      inputProps={{
        type: 'number',
        placeholder: '0.00',
        min: '0',
        disabled,
        value: displayString,
        onChange: handleInputChange,
      }}
    />
  );
};

export default AmountInput;
