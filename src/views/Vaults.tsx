import { useAtomValue } from 'jotai';
import { appAtom, leaderAtom, networkConfigAtom } from 'store/app';
import { useCallback, useEffect, useState } from 'react';
import { watchVaultFactory } from 'service/vaults';
import CollateralChoices from 'components/CollateralChoices';
import ManageVaults from 'components/ManageVaults';
import MainContentCard from 'components/MainContentCard';
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

  const subheader = (
    <div className="h-full flex flex-row items-center">
      <div className="ml-16 h-fit">
        <span className="font-medium font-serif text-[#736D6D] mr-2">
          IST Outstanding
        </span>
        <span className="font-bold font-serif text-mineShaft">$ --</span>
      </div>
      <div className="ml-16 h-fit">
        <span className="font-medium font-serif text-[#736D6D] mr-2">
          Total Value Locked
        </span>
        <span className="font-bold font-serif text-mineShaft">$ --</span>
      </div>
    </div>
  );

  return (
    <MainContentCard subheader={subheader}>
      <div className="w-full flex justify-end">
        <button
          className="text-[#f9fafe] text-xs uppercase flex flex-row justify-center items-center p-3 bg-interPurple rounded-md shadow-[0_10px_14px_-4px_rgba(183,135,245,0.3)]"
          onClick={buttonProps.onClick}
        >
          {buttonProps.text}
        </button>
      </div>
      {managerIdsLoadingError && <div>{managerIdsLoadingError}</div>}
      {watchVbankError && <div>{watchVbankError}</div>}
      {content}
    </MainContentCard>
  );
};

export default Vaults;
