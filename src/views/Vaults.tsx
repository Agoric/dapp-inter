import { useAtomValue } from 'jotai';
import { appAtom, leaderAtom, networkConfigAtom } from 'store/app';
import { useEffect } from 'react';
import { watchVaultFactory } from 'service/vaults';
import CollateralChoices from 'components/CollateralChoices';
import ManageVaults from 'components/ManageVaults';
import MainContentCard from 'components/MainContentCard';
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

  const { managerIdsLoadingError, vaultManagerIds } = useVaultStore();
  const { watchVbankError, brandToInfo } = useAtomValue(appAtom);
  const mode = useAtomValue(viewModeAtom);

  const contentForMode = {
    [ViewMode.Create]: () => (
      <>
        {!managerIdsLoadingError &&
          !watchVbankError &&
          !(vaultManagerIds && brandToInfo) && (
            <div>Loading collateral choices...</div>
          )}
        {vaultManagerIds && brandToInfo && <CollateralChoices />}
      </>
    ),
    [ViewMode.Manage]: () => <ManageVaults />,
  };
  const content = contentForMode[mode]();

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
      <div className="font-medium text-[15px] h-4">
        <PathDescription mode={mode} />
      </div>
      {managerIdsLoadingError && <div>{managerIdsLoadingError}</div>}
      {watchVbankError && <div>{watchVbankError}</div>}
      {content}
    </MainContentCard>
  );
};

export default Vaults;
