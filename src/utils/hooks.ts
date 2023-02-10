import { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { displayFunctionsAtom, pursesAtom } from 'store/app';
import type { Amount, Brand } from '@agoric/ertp/src/types';

export const usePurseBalanceDisplay = (brand?: Brand<'nat'> | null) => {
  const purses = useAtomValue(pursesAtom);

  const { displayBrandPetname, displayAmount } =
    useAtomValue(displayFunctionsAtom) ?? {};

  return useMemo(() => {
    if (!(displayAmount && displayBrandPetname && brand)) {
      return '0.00';
    }
    const purse = purses?.find(p => p.brand === brand);
    if (!purse) {
      return '0.00 ' + displayBrandPetname(brand);
    }
    return `${displayAmount(
      purse.currentAmount as Amount<'nat'>,
      2,
      'locale',
    )} ${displayBrandPetname(brand)}`;
  }, [brand, displayAmount, displayBrandPetname, purses]);
};

export const usePurseForBrand = (brand?: Brand<'nat'> | null) => {
  const purses = useAtomValue(pursesAtom);

  return purses?.find(p => p.brand === brand);
};
