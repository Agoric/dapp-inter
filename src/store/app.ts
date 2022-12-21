import { networkConfigs } from 'config';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { makeImportContext } from 'marshal-contexts';
import { makeLeader } from '@agoric/casting';

export const networkConfigAtom = atomWithStorage(
  'agoric-network-config',
  networkConfigs.mainnet,
);

export const importContextAtom = atom(() => makeImportContext());

export const leaderAtom = atom(get => makeLeader(get(networkConfigAtom).url));
