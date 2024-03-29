import { useState } from 'react';
import {
  isDisclaimerDialogShowingAtom,
  latestDisclaimerIndex,
  localStorageStore,
  walletServiceAtom,
} from 'store/app';
import { useAtom, useAtomValue } from 'jotai';
import { useStore } from 'zustand';
import ActionsDialog from './ActionsDialog';
import { disclaimerHref } from 'config';

const DisclaimerDialog = () => {
  const walletService = useAtomValue(walletServiceAtom);
  const { setlatestDisclaimerAgreedIndex } = useStore(localStorageStore);
  const [isDisclaimerDialogShowing, setIsDisclaimerDialogShowing] = useAtom(
    isDisclaimerDialogShowingAtom,
  );
  const [isChecked, setIsChecked] = useState(false);

  const proceed = () => {
    setlatestDisclaimerAgreedIndex(latestDisclaimerIndex);
    setIsDisclaimerDialogShowing(false);
    walletService.connect(false);
  };

  const body = (
    <div className="mt-2 p-1 max-h-96 overflow-y-auto">
      <p>
        The Inter Protocol Vaults expansion is operating in its soft launch
        period. These contracts contain new functionality operating on a novel
        smart contracting platform and should be considered experimental. Do not
        deposit funds you are not prepared to lose.
      </p>
      <div className="mt-4">
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
              className="text-blue-500 hover:text-blue-700 underline transition"
              target="inter_psm_disclaimer"
              href={disclaimerHref}
            >
              Disclaimer
            </a>
            .
          </span>
        </label>
      </div>
    </div>
  );

  return (
    <ActionsDialog
      title="Disclaimer"
      body={body}
      isOpen={isDisclaimerDialogShowing}
      primaryAction={{ action: proceed, label: 'Proceed' }}
      primaryActionDisabled={!isChecked}
      onClose={() => {
        /* force open until terms agreed */
      }}
    />
  );
};

export default DisclaimerDialog;
