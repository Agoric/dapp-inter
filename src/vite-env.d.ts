/// <reference types="vite/client" />

declare module '@agoric/casting' {
  export type Leader = unknown;
  export const makeFollower;
  export const iterateLatest;
  export const makeLeader;
}

declare module '@agoric/wallet-backend/src/marshal-contexts' {
  export const makeImportContext;
}
