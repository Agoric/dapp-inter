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
    case 'ATOM':
      return './cosmos-atom-logo.svg';
    case 'stATOM':
      return './statom.svg';
    case 'stOSMO':
      return './stosmo.svg';
    case 'stTIA':
      return './sttia.svg';
  }
};

// We remove the "Ibc" prefix so e.g. "IbcATOM" becomes "ATOM".
const wellKnownPetnames: Record<string, string> = {
  IbcATOM: 'ATOM',
};

export const displayPetname = (pn: string) =>
  wellKnownPetnames[pn] ?? (Array.isArray(pn) ? pn.join('.') : pn);

export const makeDisplayFunctions = (brandToInfo: Map<Brand, BrandInfo>) => {
  const getDecimalPlaces = (brand: Brand) =>
    brandToInfo.get(brand)?.decimalPlaces;

  const getPetname = (brand?: Brand | null) =>
    (brand && brandToInfo.get(brand)?.petname) ?? '';

  const displayPercent = (ratio: Ratio, placesToShow: number) => {
    try {
      // This util function casts to Number, which can fail for very large
      // values.
      return stringifyRatioAsPercent(ratio, getDecimalPlaces, placesToShow);
    } catch {
      return '0';
    }
  };

  const displayBrandPetname = (brand?: Brand | null) => {
    return displayPetname(getPetname(brand));
  };

  const displayRatio = (ratio: Ratio, placesToShow: number) => {
    return stringifyRatio(ratio, getDecimalPlaces, placesToShow);
  };

  const displayAmount = (
    amount: Amount,
    placesToShow?: number,
    format?: 'usd' | 'locale',
  ) => {
    const decimalPlaces = getDecimalPlaces(amount.brand);
    const parsed = stringifyValue(
      amount.value,
      AssetKind.NAT,
      decimalPlaces,
      placesToShow,
    );

    if (format) {
      const placesShown = parsed.split('.')[1]?.length ?? 0;
      const usdOpts =
        format === 'usd' ? { style: 'currency', currency: 'USD' } : {};

      return new Intl.NumberFormat(navigator.language, {
        minimumFractionDigits: placesShown,
        ...usdOpts,
      }).format(Number(parsed));
    }

    return parsed;
  };

  const displayBrandIcon = (brand?: Brand | null) =>
    getLogoForBrandPetname(getPetname(brand));

  const displayPrice = (price: PriceDescription, placesToShow?: number) => {
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

    return displayAmount(brandOutAmountPerUnitOfBrandIn, placesToShow, 'usd');
  };

  const displayPriceTimestamp = (price: PriceDescription) => {
    assert(price.timestamp, 'price missing timestamp');
    return new Intl.DateTimeFormat(navigator.language, {
      timeStyle: 'medium',
      dateStyle: 'short',
    }).format(new Date(Number(price.timestamp.absValue) * 1000));
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
