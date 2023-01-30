import { useCallback } from 'react';
import { useVaultStore, ViewMode, viewModeAtom } from 'store/vaults';
import { useSetAtom } from 'jotai';
import CollateralChoice from './CollateralChoice';

const CollateralChoices = () => {
  const setMode = useSetAtom(viewModeAtom);
  const { vaultManagerIds } = useVaultStore();

  const buttonProps = {
    text: 'Back to Manage Vaults',
    onClick: useCallback(() => setMode(ViewMode.Manage), [setMode]),
  };

  return (
    <>
      <div className="flex justify-between mt-6">
        <div className="font-serif font-medium text-2xl">
          Creating New Vault
        </div>
        <button
          className="text-[#f9fafe] text-xs uppercase flex flex-row justify-center items-center p-3 bg-interPurple rounded-md shadow-[0_10px_14px_-4px_rgba(183,135,245,0.3)]"
          onClick={buttonProps.onClick}
        >
          {buttonProps.text}
        </button>
      </div>
      <div className="mt-16 grid grid-cols-11 gap-x-8">
        <div className="col-span-7">
          <div className="font-serif font-medium text-2xl mb-8">
            Collaterals
          </div>
          <div className="flex flex-row flex-wrap gap-[18.5px]">
            {vaultManagerIds &&
              vaultManagerIds.map(id => <CollateralChoice key={id} id={id} />)}
          </div>
        </div>
        <div className="col-span-4"></div>
      </div>
    </>
  );
};

export default CollateralChoices;
