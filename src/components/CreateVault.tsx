import { useCallback } from 'react';
import { useVaultStore, ViewMode, viewModeAtom } from 'store/vaults';
import { useAtomValue, useSetAtom } from 'jotai';
import CollateralChoice, {
  SkeletonCollateralChoice,
} from 'components/CollateralChoice';
import ConfigureNewVault from 'components/ConfigureNewVault';
import NewVaultOfferSummary from 'components/NewVaultOfferSummary';
import { displayFunctionsAtom } from 'store/app';

const CreateVault = () => {
  const displayFunctions = useAtomValue(displayFunctionsAtom);
  const setMode = useSetAtom(viewModeAtom);
  const { vaultManagerIds } = useVaultStore();

  const buttonProps = {
    text: 'Back to vaults',
    onClick: useCallback(() => setMode(ViewMode.Manage), [setMode]),
  };

  return (
    <>
      <div className="flex justify-between mt-4 flex-wrap gap-4">
        <div className="font-serif font-medium text-2xl">Choose Collateral</div>
        <button
          className="text-btn-xs transition mr-1 text-[#A3A5B9] rounded-md border-2 border-solid border-[#A3A5B9] py-3 px-7 leading-[14px] font-bold text-xs bg-gray-500 bg-opacity-0 hover:bg-opacity-10 active:bg-opacity-20"
          onClick={buttonProps.onClick}
        >
          {buttonProps.text}
        </button>
      </div>
      <div className="mt-8 grid grid-cols-11 lg:gap-x-[51px]">
        <div className="col-span-11 lg:col-span-7">
          <div className="flex flex-row flex-wrap gap-[18.5px]">
            {vaultManagerIds && displayFunctions ? (
              vaultManagerIds.map(id => (
                <CollateralChoice
                  key={id}
                  id={id}
                  displayFunctions={displayFunctions}
                />
              ))
            ) : (
              <SkeletonCollateralChoice />
            )}
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
