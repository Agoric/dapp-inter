import { useAtomValue } from 'jotai';
import { networkConfigAtom } from 'store/app';
import { fetchRPCAddr, fetchVstorageKeys } from 'util';
import { useQuery } from 'react-query';
import { useEffect } from 'react';

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
  });
  if (vaultFactoryKeys.isError) {
    console.error(vaultFactoryKeys.error);
  }

  const isLoading =
    (vaultFactoryKeys.isLoading || vaultFactoryKeys.isIdle) && !rpcAddr.isError;

  const managerIds = (vaultFactoryKeys.data?.children ?? []).filter(
    (child: string) => child.startsWith('manager'),
  );

  useEffect(() => {
    if (!managerIds.length) return;
    // TODO: Use casting to watch each managers metrics and governed params, storing data in jotai.
  }, [managerIds]);

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
