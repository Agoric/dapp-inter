import { useAtomValue } from 'jotai';
import { appAtom, leaderAtom, networkConfigAtom } from 'store/app';
import { useCallback, useEffect, useState } from 'react';
import { watchVaultFactory } from 'service/vaults';
import CollateralChoices from 'components/CollateralChoices';
import ManageVaults from 'components/ManageVaults';
import { useVaultStore } from 'store/vaults';

enum Mode {
  Create,
  Manage,
}

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

  const { managerIdsLoadingError, vaultManagerIds } = useVaultStore();
  const { watchVbankError, brandToInfo } = useAtomValue(appAtom);
  const [mode, setMode] = useState(Mode.Create);

  const contentForMode = {
    [Mode.Create]: () => (
      <>
        {!managerIdsLoadingError &&
          !watchVbankError &&
          !(vaultManagerIds && brandToInfo) && (
            <div>Loading collateral choices...</div>
          )}
        {vaultManagerIds && brandToInfo && <CollateralChoices />}
      </>
    ),
    [Mode.Manage]: () => <ManageVaults />,
  };
  const content = contentForMode[mode]();

  const manageVaultsButtonProps = {
    text: 'Manage Vaults',
    onClick: useCallback(() => setMode(Mode.Manage), [setMode]),
  };
  const createVaultButtonProps = {
    text: 'Add New Vault',
    onClick: useCallback(() => setMode(Mode.Create), [setMode]),
  };
  const buttonPropsForMode = {
    [Mode.Create]: manageVaultsButtonProps,
    [Mode.Manage]: createVaultButtonProps,
  };
  const buttonProps = buttonPropsForMode[mode];

  return (
    <>
      <h1>Vaults</h1>
      <div className="w-full flex justify-end">
        <button
          className="text-gray-50 font-medium text-xs uppercase flex flex-row justify-center items-center p-3 bg-purple-400 rounded-md"
          onClick={buttonProps.onClick}
        >
          {buttonProps.text}
        </button>
      </div>
      {managerIdsLoadingError && <div>{managerIdsLoadingError}</div>}
      {watchVbankError && <div>{watchVbankError}</div>}
      {content}
    </>
  );
};

export default Vaults;
