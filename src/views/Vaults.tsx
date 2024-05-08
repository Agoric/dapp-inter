import { motion } from 'framer-motion';
import { useAtomValue, useSetAtom } from 'jotai';
import { appAtom, chainStorageWatcherAtom } from 'store/app';
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

// Package doesn't export types. See:
// https://github.com/jcoreio/react-view-slider.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ViewSlider = ReactViewSlider as unknown as FunctionComponent<any>;

const VaultsBreadcrumb = () => {
  const setMode = useSetAtom(viewModeAtom);

  return (
    <span className="text-secondary">
      <button
        onClick={() => setMode(ViewMode.Manage)}
        aria-label="Go back to vaults"
      >
        Vaults&nbsp;&nbsp;/
      </button>
      &nbsp;&nbsp;
    </span>
  );
};

const PathDescription = ({ mode, adjustVaultKey }: PathDescriptionProps) => {
  if (mode === ViewMode.Edit) {
    if (adjustVaultKey) {
      return (
        <span>
          <VaultsBreadcrumb />
          Adjusting Vault
        </span>
      );
    }

    return (
      <span>
        <VaultsBreadcrumb />
        Creating Vault
      </span>
    );
  }

  if (mode === ViewMode.Manage) {
    return <span className="text-secondary">Vaults</span>;
  }

  return <></>;
};

const errorProps = {
  className: 'overflow-hidden',
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  transition: { type: 'tween' },
};

const Vaults = () => {
  const chainStorageWatcher = useAtomValue(chainStorageWatcherAtom);
  useEffect(() => {
    if (!chainStorageWatcher) return;
    const cleanup = watchVaultFactory();

    return () => {
      cleanup();
    };
  }, [chainStorageWatcher]);

  const { managerIdsLoadingError } = useVaultStore();
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
      <div className="text-alert text-lg mt-4 font-serif font-medium">
        {managerIdsLoadingError && (
          <motion.div {...errorProps}>{managerIdsLoadingError}</motion.div>
        )}
        {watchVbankError && (
          <motion.div {...errorProps}>{watchVbankError}</motion.div>
        )}
      </div>
      <ViewSlider
        renderView={renderView}
        numViews={2}
        activeView={mode}
        style={{ overflow: 'show' }}
        spacing={1.2}
        transitionDuration={500}
        transitionTimingFunction="ease-in-out"
      />
    </MainContentWrapper>
  );
};

export default Vaults;
