import {
  stringifyRatioAsPercent,
  stringifyRatio,
  stringifyValue,
} from '@agoric/ui-components';
import { AssetKind } from '@agoric/ertp';
import type { BrandInfo } from 'store/app';
import type { PriceDescription, Ratio } from 'store/vaults';
import type { Brand, Amount } from '@agoric/ertp/src/types';

// XXX: Kludge until we get a price authority with the same brands vault
// manager uses https://github.com/Agoric/agoric-sdk/issues/6765.
const PRICE_BRAND_UNIT_AMOUNT = 1_000_000n;
const USD_BRAND_DECIMALS = 6;

const getLogoForBrandPetname = (brandPetname: string) => {
  switch (brandPetname) {
    case 'IST':
      return 'IST.png';
    case 'USDC_axl':
      return 'USDC_axl.png';
    case 'USDC_grv':
      return 'USDC_grv.webp';
    case 'USDT_axl':
      return 'USDT_axl.png';
    case 'USDT_grv':
      return 'USDT_grv.webp';
    case 'DAI_axl':
      return 'DAI_axl.png';
    case 'DAI_grv':
      return 'DAI_grv.png';
    default:
      return 'default.png';
  }
};

export const displayPetname = (pn: Array<string> | string) =>
  Array.isArray(pn) ? pn.join('.') : pn;

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
    const givenUnitsOfBrandIn = price.amountIn.value / PRICE_BRAND_UNIT_AMOUNT;
    const pricePerUnitOfBrandIn = price.amountOut.value / givenUnitsOfBrandIn;
    return (
      '$' +
      stringifyValue(pricePerUnitOfBrandIn, AssetKind.NAT, USD_BRAND_DECIMALS)
    );
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
