import { useAtomValue } from 'jotai';
import {
  appAtom,
  importContextAtom,
  leaderAtom,
  networkConfigAtom,
} from 'store/app';
import { useEffect } from 'react';
import { watchVaultFactory } from 'service/vaults';
import CollateralChoices from 'components/CollateralChoices';
import { useVaultStore } from 'store/vaults';

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

  const { vaultIdsLoadingError, vaultManagerIds } = useVaultStore();
  const { watchVbankError, brandToInfo } = useAtomValue(appAtom);

  return (
    <>
      <h1>Vaults</h1>
      {vaultIdsLoadingError && <div>{vaultIdsLoadingError}</div>}
      {watchVbankError && <div>{watchVbankError}</div>}
      {!vaultIdsLoadingError &&
        !watchVbankError &&
        !(vaultManagerIds && brandToInfo) && (
          <div>Loading collateral choices...</div>
        )}
      {vaultManagerIds && brandToInfo && <CollateralChoices />}
    </>
  );
};

export default Vaults;
