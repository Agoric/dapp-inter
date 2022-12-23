/// <reference types="vite/client" />

declare module 'utils/marshal-contexts' {
  export const makeImportContext;
}

declare module '@agoric/casting' {
  export const makeLeader;
  export const makeFollower;
  export const iterateLatest;
}

declare module '@agoric/ui-components' {
  export const parseAsValue;
  export const stringifyValue;
  export const stringifyRatioAsPercent;
  export const stringifyRatio;
}

declare module '@agoric/wallet/api/src/marshal-contexts' {
  export const makeImportContext;
}
