import { useAtomValue } from 'jotai';
import { appAtom, leaderAtom, networkConfigAtom } from 'store/app';
import { useEffect } from 'react';
import { watchVaultFactory } from 'service/vaults';
import CreateVault from 'components/CreateVault';
import ManageVaults from 'components/ManageVaults';
import MainContentWrapper from 'components/MainContentWrapper';
import { useVaultStore, viewModeAtom, ViewMode } from 'store/vaults';

type PathDescriptionProps = { mode: ViewMode };

const PathDescription = ({ mode }: PathDescriptionProps) => {
  if (mode === ViewMode.Create) {
    return (
      <span>
        <span className="text-[#9193A5]">Vaults&nbsp;&nbsp;/&nbsp;&nbsp;</span>
        Creating Vault
      </span>
    );
  }

  if (mode === ViewMode.Manage) {
    return <span className="text-[#9193A5]">Vaults</span>;
  }

  return <></>;
};

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

  const { managerIdsLoadingError, vaultFactoryInstanceHandleLoadingError } =
    useVaultStore();
  const { watchVbankError } = useAtomValue(appAtom);
  const mode = useAtomValue(viewModeAtom);

  const contentForMode = {
    [ViewMode.Create]: () => <CreateVault />,
    [ViewMode.Manage]: () => <ManageVaults />,
  };
  const content = contentForMode[mode]();

  return (
    <MainContentWrapper>
      <div className="font-medium text-[15px] h-4">
        <PathDescription mode={mode} />
      </div>
      <div className="text-red-600 text-lg mt-4">
        <div>{vaultFactoryInstanceHandleLoadingError}</div>
        <div>{managerIdsLoadingError}</div>
        <div>{watchVbankError}</div>
      </div>
      {content}
    </MainContentWrapper>
  );
};

export default Vaults;
