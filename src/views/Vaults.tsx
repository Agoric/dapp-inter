import { useAtomValue } from 'jotai';
import { appAtom, leaderAtom, networkConfigAtom } from 'store/app';
import { useCallback, useEffect, useState } from 'react';
import { watchVaultFactory } from 'service/vaults';
import CollateralChoices from 'components/CollateralChoices';
import ManageVaults from 'components/ManageVaults';
import { useVaultStore } from 'store/vaults';

const Modes = {
  create: 0,
  manage: 1,
};

const Vaults = () => {
  const netConfig = useAtomValue(networkConfigAtom);
  const leader = useAtomValue(leaderAtom);
  const [mode, setMode] = useState(Modes.create);

  useEffect(() => {
    if (!leader) return;
    const cleanup = watchVaultFactory(netConfig.url);

    return () => {
      cleanup();
    };
  }, [leader, netConfig]);

  const { managerIdsLoadingError, vaultManagerIds } = useVaultStore();
  const { watchVbankError, brandToInfo } = useAtomValue(appAtom);

  const create = (
    <>
      {!managerIdsLoadingError &&
        !watchVbankError &&
        !(vaultManagerIds && brandToInfo) && (
          <div>Loading collateral choices...</div>
        )}
      {vaultManagerIds && brandToInfo && <CollateralChoices />}
    </>
  );

  const manage = <ManageVaults />;

  const buttonText = (() => {
    switch (mode) {
      case Modes.create:
        return 'Back to Manage Vaults';
      case Modes.manage:
        return 'Add New Vault';
      default:
        return 'Manage Vaults';
    }
  })();

  const content = (() => {
    switch (mode) {
      case Modes.create:
        return create;
      case Modes.manage:
        return manage;
      default:
        return create;
    }
  })();

  const switchMode = useCallback(() => {
    switch (mode) {
      case Modes.create:
        setMode(Modes.manage);
        break;
      case Modes.manage:
        setMode(Modes.create);
        break;
      default:
        setMode(Modes.manage);
    }
  }, [mode]);

  return (
    <>
      <h1>Vaults</h1>
      <div className="w-full flex justify-end">
        <button
          className="text-gray-50 font-medium text-xs uppercase flex flex-row justify-center items-center p-3 bg-purple-400 rounded-md"
          onClick={switchMode}
        >
          {buttonText}
        </button>
      </div>
      {managerIdsLoadingError && <div>{managerIdsLoadingError}</div>}
      {watchVbankError && <div>{watchVbankError}</div>}
      {content}
    </>
  );
};

export default Vaults;
