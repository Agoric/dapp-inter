import { useState } from 'react';
import { isAppVersionOutdatedAtom } from 'store/app';
import { useAtomValue } from 'jotai';
import ActionsDialog from './ActionsDialog';
import { vaultStoreAtom } from 'store/vaults';
import { currentlyVisitedHash } from 'utils/ipfs';

const AppVersionDialog = () => {
  const [hasDismissed, setHasDismissed] = useState(false);
  const isAppVersionOutdated = useAtomValue(isAppVersionOutdatedAtom);
  const { vaultFactoryParams } = useAtomValue(vaultStoreAtom);
  const { referencedUI } = vaultFactoryParams ?? {};

  const proceed = () => {
    const current = currentlyVisitedHash();

    assert(referencedUI, 'Referenced UI must be defined');

    // Reuse current gateway, else default to cloudflare.
    if (current) {
      window.location.href = window.location.href.replace(
        current,
        referencedUI,
      );
    } else {
      window.location.href = `https://${referencedUI}.ipfs.cf-ipfs.com`;
    }
  };

  const dismiss = () => setHasDismissed(true);

  const body = (
    <div className="mt-2 p-1 max-h-96 overflow-y-auto">
      <p>Note: You are using an old version of the app.</p>
    </div>
  );

  return (
    <ActionsDialog
      title="New App Version Available"
      body={body}
      isOpen={!hasDismissed && isAppVersionOutdated}
      primaryAction={{ action: proceed, label: 'Go to Newest Version' }}
      secondaryAction={{ action: dismiss, label: 'Keep using Old Version' }}
      onClose={() => {
        /* force open until user acknowledges */
      }}
      initialFocusPrimary
    />
  );
};

export default AppVersionDialog;
