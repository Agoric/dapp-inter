import { useCallback } from 'react';
import { useVaultStore, ViewMode, viewModeAtom } from 'store/vaults';
import { useSetAtom } from 'jotai';
import CollateralChoice from 'components/CollateralChoice';
import ConfigureNewVault from 'components/ConfigureNewVault';
import NewVaultOfferSummary from 'components/NewVaultOfferSummary';

const CreateVault = () => {
  const setMode = useSetAtom(viewModeAtom);
  const { vaultManagerIds } = useVaultStore();

  const buttonProps = {
    text: 'Cancel',
    onClick: useCallback(() => setMode(ViewMode.Manage), [setMode]),
  };

  return (
    <>
      <div className="flex justify-between mt-6 flex-wrap gap-4">
        <div className="font-serif font-medium text-2xl">
          Creating New Vault
        </div>
        <button
          className="transition mr-1 text-[#A3A5B9] uppercase rounded-[6px] border-2 border-solid border-[#A3A5B9] py-2 px-7 leading-[14px] font-semibold text-xs bg-[#A3A5B9] bg-opacity-0 hover:bg-opacity-10 active:bg-opacity-20"
          onClick={buttonProps.onClick}
        >
          {buttonProps.text}
        </button>
      </div>
      <div className="mt-16 grid grid-cols-11 lg:gap-x-[51px]">
        <div className="col-span-11 lg:col-span-7">
          <div className="font-serif font-medium text-2xl mb-8">
            Choose Collateral
          </div>
          <div className="flex flex-row flex-wrap gap-[18.5px]">
            {vaultManagerIds &&
              vaultManagerIds.map(id => <CollateralChoice key={id} id={id} />)}
          </div>
          <ConfigureNewVault />
        </div>
        <div className="mt-8 col-span-11 lg:col-span-4 lg:mt-0">
          <NewVaultOfferSummary />
        </div>
      </div>
    </>
  );
};

export default CreateVault;
