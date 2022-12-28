import { useAtomValue } from 'jotai';
import { appAtom, leaderAtom, networkConfigAtom } from 'store/app';
import { useEffect } from 'react';
import { watchVaultFactory } from 'service/vaults';
import CollateralChoices from 'components/CollateralChoices';
import { useVaultStore } from 'store/vaults';

const Vaults = () => {
  const netConfig = useAtomValue(networkConfigAtom);
  const leader = useAtomValue(leaderAtom);

  useEffect(() => {
    if (!leader) return;
    const cleanup = watchVaultFactory(netConfig.url);

    return () => {
      cleanup();
    };
  }, [leader, netConfig]);

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
