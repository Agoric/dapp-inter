import {
  stringifyRatioAsPercent,
  stringifyRatio,
  stringifyValue,
} from '@agoric/ui-components';
import { AssetKind, AmountMath } from '@agoric/ertp';
import {
  floorMultiplyBy,
  makeRatioFromAmounts,
} from '@agoric/zoe/src/contractSupport';
import type { BrandInfo } from 'store/app';
import type { PriceDescription, Ratio } from 'store/vaults';
import type { Brand, Amount } from '@agoric/ertp/src/types';

const getLogoForBrandPetname = (brandPetname: string) => {
  switch (brandPetname) {
    case 'IST':
      return './IST.png';
    case 'IbcATOM':
      return './cosmos-atom-logo.svg';
  }
};

// We remove the "Ibc" prefix so e.g. "IbcATOM" becomes "ATOM".
const wellKnownPetnames: Record<string, string> = {
  IbcATOM: 'ATOM',
};

export const displayPetname = (pn: string) =>
  wellKnownPetnames[pn] ?? (Array.isArray(pn) ? pn.join('.') : pn);
export const addCommas = (stringifiedValue: string) => {
  const [whole, decimals] = stringifiedValue.split('.');
  const figures = whole.split('');

  const chunks = [];
  const chunkSize = 3;
  let currentChunk = '';

  while (figures.length) {
    for (let i = 0; i < chunkSize && figures.length; i++) {
      currentChunk = figures.pop() + currentChunk;
    }
    chunks.push(currentChunk);
    currentChunk = '';
  }

  return chunks.reverse().join(',') + (decimals ? '.' + decimals : '');
};

export const makeDisplayFunctions = (brandToInfo: Map<Brand, BrandInfo>) => {
  const getDecimalPlaces = (brand: Brand) =>
    brandToInfo.get(brand)?.decimalPlaces;

  const getPetname = (brand?: Brand | null) =>
    (brand && brandToInfo.get(brand)?.petname) ?? '';

  const displayPercent = (ratio: Ratio, placesToShow: number) => {
    return stringifyRatioAsPercent(ratio, getDecimalPlaces, placesToShow);
  };

  const displayBrandPetname = (brand?: Brand | null) => {
    return displayPetname(getPetname(brand));
  };

  const displayRatio = (ratio: Ratio, placesToShow: number) => {
    return stringifyRatio(ratio, getDecimalPlaces, placesToShow);
  };

  const displayAmount = (amount: Amount, placesToShow?: number) => {
    const decimalPlaces = getDecimalPlaces(amount.brand);
    return stringifyValue(
      amount.value,
      AssetKind.NAT,
      decimalPlaces,
      placesToShow,
    );
  };

  const displayBrandIcon = (brand?: Brand | null) =>
    getLogoForBrandPetname(getPetname(brand));

  const displayPrice = (price: PriceDescription) => {
    const { amountIn, amountOut } = price;
    const { brand: brandIn } = amountIn;
    const brandInDecimals = getDecimalPlaces(brandIn);
    assert(brandInDecimals);

    const unitAmountOfBrandIn = AmountMath.make(
      brandIn,
      10n ** BigInt(brandInDecimals),
    );

    const brandOutAmountPerUnitOfBrandIn = floorMultiplyBy(
      unitAmountOfBrandIn,
      makeRatioFromAmounts(amountOut, amountIn),
    );

    return '$' + addCommas(displayAmount(brandOutAmountPerUnitOfBrandIn));
  };

  const displayPriceTimestamp = (price: PriceDescription) => {
    return new Date(Number(price.timestamp) * 1000).toUTCString();
  };

  return {
    displayPriceTimestamp,
    displayPercent,
    displayBrandPetname,
    displayRatio,
    displayAmount,
    getDecimalPlaces,
    displayBrandIcon,
    displayPrice,
  };
};
