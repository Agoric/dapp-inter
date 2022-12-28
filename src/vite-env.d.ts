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
