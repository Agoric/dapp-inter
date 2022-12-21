import { fetchRPCAddr, fetchVstorageKeys } from 'utils/rpc';
import { useVaultStore } from 'store/vaults';
import { makeFollower, iterateLatest } from '@agoric/casting';
import type { Marshal } from '@endo/marshal';

export const watchVaultFactory = (
  netconfigUrl: string,
  unserializer: Marshal<unknown>,
  leader: unknown,
) => {
  // TODO: Clean up followers when isStopped === true.
  let isStopped = false;

  const makeBoardFollower = (path: string) =>
    makeFollower(path, leader, { unserializer });

  const watchGovernedParams = async (id: string) => {
    const path = `:published.vaultFactory.${id}.governance`;
    const f = makeBoardFollower(path);
    for await (const { value } of iterateLatest(f)) {
      console.debug('got update', path, value);
      useVaultStore.getState().setVaultGovernedParams(id, value.current);
    }
  };

  const watchMetrics = async (id: string) => {
    const path = `:published.vaultFactory.${id}.metrics`;
    const f = makeBoardFollower(path);
    for await (const { value } of iterateLatest(f)) {
      console.debug('got update', path, value);
      useVaultStore.getState().setVaultMetrics(id, value);
    }
  };

  const watchManager = async (id: string) => {
    watchGovernedParams(id);
    watchMetrics(id);

    const path = `:published.vaultFactory.${id}`;
    const f = makeBoardFollower(path);
    for await (const { value } of iterateLatest(f)) {
      console.debug('got update', path, value);
      useVaultStore.getState().setVaultManager(id, value);
    }
  };

  const startWatching = async () => {
    let rpc;
    try {
      rpc = await fetchRPCAddr(netconfigUrl);
    } catch (e) {
      const msg = 'Error fetching RPC address from network config';
      console.error(msg, netconfigUrl, e);
      useVaultStore.setState({ vaultIdsLoadingError: msg });
    }
    if (isStopped) return;

    let managerIds;
    try {
      managerIds = await fetchVstorageKeys(rpc, 'published.vaultFactory').then(
        res =>
          (res.children as string[]).filter(key => key.startsWith('manager')),
      );
      assert(managerIds);
    } catch (e) {
      const msg = 'Error fetching vault managers';
      console.error(msg, e);
      useVaultStore.setState({ vaultIdsLoadingError: msg });
    }
    if (isStopped) return;

    useVaultStore.setState({ vaultManagerIds: managerIds });
    assert(managerIds);
    managerIds.forEach(id =>
      watchManager(id).catch(e => {
        console.error('Error watching vault manager id', id, e);
        useVaultStore.getState().setVaultLoadingError(id, e);
      }),
    );
  };

  startWatching();

  return () => (isStopped = true);
};
