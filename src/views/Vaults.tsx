import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { importContextAtom, leaderAtom, networkConfigAtom } from 'store/app';
import { fetchRPCAddr, fetchVstorageKeys } from 'utils';
import { useQuery } from 'react-query';
import { useEffect } from 'react';
import {
  managerIdsAtom,
  managerMetricsAtom,
  managerParamsAtom,
  managersAtom,
} from 'store/vaults';
import { watchVaultManager } from 'service/vaults';

const Vaults = () => {
  const netConfig = useAtomValue(networkConfigAtom);
  const rpcAddr = useQuery({
    queryKey: `rpcAddrs:${netConfig?.url}`,
    queryFn: () => fetchRPCAddr(netConfig?.url),
    enabled: !!netConfig?.url,
  });
  if (rpcAddr.isError) {
    console.error(rpcAddr.error);
  }

  const path = 'published.vaultFactory';
  const vaultFactoryKeys = useQuery({
    queryKey: `${path}:${rpcAddr.data}`,
    queryFn: () => fetchVstorageKeys(rpcAddr.data, path),
    enabled: !!rpcAddr.data,
    refetchInterval: 1000 * 60 * 5 /* every 5 minutes */,
  });
  if (vaultFactoryKeys.isError) {
    console.error(vaultFactoryKeys.error);
  }

  const isLoading =
    (vaultFactoryKeys.isLoading || vaultFactoryKeys.isIdle) && !rpcAddr.isError;

  const newManagerIds = (
    (vaultFactoryKeys.data?.children as Array<string>) ?? []
  ).filter((child: string) => child.startsWith('manager'));

  const [setManagers, setManagerMetrics, setManagerParams] = [
    useSetAtom(managersAtom),
    useSetAtom(managerMetricsAtom),
    useSetAtom(managerParamsAtom),
  ];

  const [managerIds, setManagerIds] = useAtom(managerIdsAtom);
  const importContext = useAtomValue(importContextAtom);
  const leader = useAtomValue(leaderAtom);

  useEffect(() => {
    let hasUpdates = false;
    newManagerIds.forEach(managerId => {
      if (!managerIds?.has(managerId)) {
        hasUpdates = true;
        watchVaultManager(leader, importContext.fromBoard, managerId, {
          setManagers,
          setManagerMetrics,
          setManagerParams,
        });
      }
      if (hasUpdates) {
        setManagerIds(new Set(newManagerIds));
      }
    });
  }, [
    newManagerIds,
    managerIds,
    setManagerIds,
    leader,
    importContext.fromBoard,
    setManagers,
    setManagerMetrics,
    setManagerParams,
  ]);

  return (
    <>
      <h1>Vaults</h1>
      <div>
        {isLoading && 'Loading collateral options...'}
        {rpcAddr.isError && (
          <div>Error reading RPC address from netConfig {netConfig?.url}</div>
        )}
        {vaultFactoryKeys.isError && (
          <div>Error querying collaterals from chain via {rpcAddr.data}</div>
        )}
        {!isLoading && !rpcAddr.isError && !vaultFactoryKeys.isError && (
          <div>Collateral Options: {managerIds}</div>
        )}
      </div>
    </>
  );
};

export default Vaults;
