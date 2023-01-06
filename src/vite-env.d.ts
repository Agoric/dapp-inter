/// <reference types="vite/client" />

declare module '@agoric/ui-components' {
  export const parseAsValue;
  export const stringifyValue;
  export const stringifyRatioAsPercent;
  export const stringifyRatio;
}

declare module '@agoric/wallet/api/src/marshal-contexts' {
  export const makeImportContext;
}

declare module '@agoric/web-components' {
  export const makeAgoricKeplrConnection;
  export const AgoricKeplrConnectionErrors;
  export const BridgeProtocol;
}

declare module '@agoric/web-components/react' {
  export const makeReactAgoricWalletConnection;
  export const makeReactDappWalletBridge;
}

declare module '@agoric/wallet-backend' {
  export type PursesJSONState = {
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
    currentAmount: unknown;
  };
}
