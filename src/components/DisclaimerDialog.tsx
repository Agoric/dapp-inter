import { useState } from 'react';
import {
  isDisclaimerDialogShowingAtom,
  latestDisclaimerIndex,
  localStorageStore,
  networkConfigAtom,
  walletServiceAtom,
} from 'store/app';
import { useAtom, useAtomValue } from 'jotai';
import { useStore } from 'zustand';
import ActionsDialog from './ActionsDialog';
import { disclaimerHref } from 'config';

const DisclaimerDialog = () => {
  const walletService = useAtomValue(walletServiceAtom);
  const { url } = useAtomValue(networkConfigAtom);
  const { setlatestDisclaimerAgreedIndex } = useStore(localStorageStore);
  const [isDisclaimerDialogShowing, setIsDisclaimerDialogShowing] = useAtom(
    isDisclaimerDialogShowingAtom,
  );
  const [isChecked, setIsChecked] = useState(false);

  const proceed = () => {
    setlatestDisclaimerAgreedIndex(latestDisclaimerIndex);
    setIsDisclaimerDialogShowing(false);
    walletService.connect(url, false);
  };

  const body = (
    <div className="mt-2 p-1 max-h-96 overflow-y-auto">
      <label className="cursor-pointer">
        <input
          type="checkbox"
          className="accent-purple-500 cursor-pointer mr-2"
          checked={isChecked}
          onClick={() => setIsChecked(isChecked => !isChecked)}
        />
        <span>
          By clicking here you are indicating that you have read and agree to
          our{' '}
          <a
            className="text-blue-500 hover:text-blue-700 underline transition-colors"
            target="inter_psm_disclaimer"
            href={disclaimerHref}
          >
            Disclaimer
          </a>
          .
        </span>
      </label>
    </div>
  );

  return (
    <ActionsDialog
      title="Disclaimer"
      body={body}
      isOpen={isDisclaimerDialogShowing}
      onPrimaryAction={proceed}
      primaryActionLabel="Proceed"
      primaryActionDisabled={!isChecked}
      onClose={() => {
        /* force open until terms agreed */
      }}
    />
  );
};

export default DisclaimerDialog;
