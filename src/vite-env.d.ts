/// <reference types="vite/client" />

declare module 'marshal-contexts' {
  export const makeImportContext;
}

declare module '@agoric/casting' {
  export const makeLeader;
  export const makeFollower;
  export const iterateLatest;
}
