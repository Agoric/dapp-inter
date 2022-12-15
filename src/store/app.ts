import { networkConfigs } from 'config';
import { atomWithStorage } from 'jotai/utils';

export const networkConfigAtom = atomWithStorage(
  'agoric-network-config',
  networkConfigs.mainnet,
);
