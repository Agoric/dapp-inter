import { useAtomValue } from 'jotai';
import { displayFunctionsAtom } from 'store/app';
import { Ratio } from 'store/vaults';
import { makeRatio } from '@agoric/zoe/src/contractSupport';
import StyledInput from './StyledInput';

type Props = {
  value?: Ratio | null;
  label?: string;
  error?: string;
  onChange: (value: Ratio) => void;
  disabled?: boolean;
};

const AmountInput = ({
  value,
  onChange,
  label,
  error,
  disabled = false,
}: Props) => {
  const { displayPercent, getDecimalPlaces } =
    useAtomValue(displayFunctionsAtom) ?? {};

  const displayValue = value?.numerator?.value
    ? displayPercent && displayPercent(value, 0)
    : '';

  const hasDisplayInfo =
    value && getDecimalPlaces && displayPercent && getDecimalPlaces;

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = ev => {
    if (!hasDisplayInfo) {
      console.warn('Cannot update ratio without display info.', ev);
      return;
    }

    const numeratorBrand = value.numerator.brand;
    const denominatorBrand = value.denominator.brand;
    const numeratorDecimals = getDecimalPlaces(numeratorBrand);
    const denominatorDecimals = getDecimalPlaces(denominatorBrand);

    if (!(numeratorDecimals && denominatorDecimals)) {
      return;
    }

    let numeratorValue;
    try {
      numeratorValue =
        (BigInt(ev.target.value || 0) * 10n ** BigInt(numeratorDecimals)) /
        100n;
    } catch {
      return;
    }

    const denominatorValue = 10n ** BigInt(denominatorDecimals);

    onChange(
      makeRatio(
        numeratorValue,
        numeratorBrand,
        denominatorValue,
        denominatorBrand,
      ),
    );
  };

  return (
    <StyledInput
      label={label}
      error={error}
      suffix="%"
      inputProps={{
        type: 'text',
        placeholder: '0',
        disabled: disabled || !hasDisplayInfo,
        value: displayValue,
        onChange: handleInputChange,
      }}
    />
  );
};

export default AmountInput;
