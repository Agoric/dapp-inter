import { useAtomValue } from 'jotai';
import { importContextAtom, leaderAtom, networkConfigAtom } from 'store/app';
import { useEffect } from 'react';
import { watchVaultFactory } from 'service/vaults';

const Vaults = () => {
  const netConfig = useAtomValue(networkConfigAtom);
  const leader = useAtomValue(leaderAtom);
  const { fromBoard: unserializer } = useAtomValue(importContextAtom);

  useEffect(() => {
    const cleanup = watchVaultFactory(netConfig.url, unserializer, leader);

    return () => {
      cleanup();
    };
  }, [leader, netConfig.url, unserializer]);

  return (
    <>
      <h1>Vaults</h1>
      <div></div>
    </>
  );
};

export default Vaults;
