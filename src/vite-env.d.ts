/// <reference types="vite/client" />

declare module '@agoric/ui-components' {
  export const parseAsValue;
  export const stringifyValue;
  export const stringifyRatioAsPercent;
  export const stringifyRatio;
}

declare module '@agoric/wallet-backend' {
  export type PursesJSONState<T extends AssetKind> = {
    brand: import('@agoric/ertp').Brand;
    /** The board ID for this purse's brand */
    brandBoardId: string;
    /** The board ID for the deposit-only facet of this purse */
    depositBoardId?: string;
    /** The petname for this purse's brand */
    brandPetname: Petname;
    /** The petname for this purse */
    pursePetname: Petname;
    /** The brand's displayInfo */
    displayInfo: unknown;
    /** The purse's current balance */
    value: unknown;
    currentAmountSlots: unknown;
    currentAmount: Amount<T>;
  };
}

declare module '@agoric/inter-protocol/src/interest-math' {
  export const calculateCurrentDebt: (
    debtSnapshot: Amount<'nat'>,
    stabilityFeeSnapshot: Ratio,
    currentCompoundedStabilityFee: Ratio,
  ) => Amount<'nat'>;
}

declare module '@agoric/inter-protocol/src/vaultFactory/math' {
  export const calculateMinimumCollateralization: (
    liquidationMargin: Ratio,
    liquidationPadding: Ratio,
  ) => Ratio;
}

declare module 'react-view-slider' {
  export const ViewSlider;
}

declare module '@agoric/cosmic-proto/swingset/query.js' {
  export const QueryClientImpl;
  export const QueryParamsResponse;
}
