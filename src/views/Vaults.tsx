import { useAtomValue } from 'jotai';
import { appAtom, leaderAtom, networkConfigAtom } from 'store/app';
import { FunctionComponent, useEffect } from 'react';
import { watchVaultFactory } from 'service/vaults';
import AdjustVault from 'components/AdjustVault';
import CreateVault from 'components/CreateVault';
import ManageVaults from 'components/ManageVaults';
import MainContentWrapper from 'components/MainContentWrapper';
import {
  useVaultStore,
  viewModeAtom,
  ViewMode,
  vaultKeyToAdjustAtom,
} from 'store/vaults';
import ReactViewSlider from 'react-view-slider';
import type { VaultKey } from 'store/vaults';

type PathDescriptionProps = { mode: ViewMode; adjustVaultKey: VaultKey | null };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ViewSlider = ReactViewSlider as unknown as FunctionComponent<any>;

const PathDescription = ({ mode, adjustVaultKey }: PathDescriptionProps) => {
  if (mode === ViewMode.Edit && adjustVaultKey) {
    return (
      <span>
        <span className="text-[#9193A5]">Vaults&nbsp;&nbsp;/&nbsp;&nbsp;</span>
        Adjusting Vault
      </span>
    );
  }

  if (mode === ViewMode.Edit) {
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
  const adjustVaultKey = useAtomValue(vaultKeyToAdjustAtom);

  const renderView = ({ index }: { index: ViewMode }) => {
    const contentForMode = {
      [ViewMode.Manage]: () => <ManageVaults />,
      [ViewMode.Edit]: () =>
        adjustVaultKey ? <AdjustVault /> : <CreateVault />,
    };
    return contentForMode[index]();
  };

  return (
    <MainContentWrapper>
      <div className="font-medium text-[15px] h-4">
        <PathDescription mode={mode} adjustVaultKey={adjustVaultKey} />
      </div>
      <div className="text-red-600 text-lg mt-4">
        <div>{vaultFactoryInstanceHandleLoadingError}</div>
        <div>{managerIdsLoadingError}</div>
        <div>{watchVbankError}</div>
      </div>
      <ViewSlider
        renderView={renderView}
        numViews={2}
        activeView={mode}
        style={{ overflow: 'show' }}
        spacing={1.5}
        transitionDuration={400}
        transitionTimingFunction="ease-in-out"
      />
    </MainContentWrapper>
  );
};

export default Vaults;
