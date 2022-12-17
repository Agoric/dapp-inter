import { iterateLatest, makeFollower, Leader } from '@agoric/casting';

import type { Marshal } from '@endo/marshal';

declare type VaultSetters = {
  setManagers: (managers: [string, unknown][]) => void;
  setManagerMetrics: (metrics: [string, unknown][]) => void;
  setManagerParams: (params: [string, unknown][]) => void;
};

export const watchMetrics = async (
  leader: Leader,
  unserializer: Marshal<any>,
  managerId: string,
  setters: VaultSetters,
) => {
  const spec = `:published.vaultFactory.${managerId}.governance`;
  const f = makeFollower(spec, leader, { unserializer });

  for await (const { value } of iterateLatest(f)) {
    console.log(`update ${spec}`, value);
    setters.setManagerParams([[managerId, value.current]]);
  }
};

export const watchParams = async (
  leader: Leader,
  unserializer: Marshal<any>,
  managerId: string,
  setters: VaultSetters,
) => {
  const spec = `:published.vaultFactory.${managerId}.metrics`;
  const f = makeFollower(spec, leader, { unserializer });

  for await (const { value } of iterateLatest(f)) {
    console.log(`update ${spec}`, value);
    setters.setManagerMetrics([[managerId, value]]);
  }
};

export const watchVaultManager = async (
  leader: Leader,
  unserializer: Marshal<any>,
  managerId: string,
  setters: VaultSetters,
) => {
  const spec = `:published.vaultFactory.${managerId}`;
  const f = makeFollower(spec, leader, { unserializer });

  watchMetrics(leader, unserializer, managerId, setters);
  watchParams(leader, unserializer, managerId, setters);

  for await (const { value } of iterateLatest(f)) {
    console.log(`update ${spec}`, value);
    setters.setManagers([[managerId, value]]);
  }
};
