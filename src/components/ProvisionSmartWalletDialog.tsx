import { useAtom, useAtomValue } from 'jotai';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import {
  chainConnectionAtom,
  chainStorageWatcherAtom,
  provisionToastIdAtom,
  smartWalletProvisionedAtom,
} from 'store/app';
import { querySwingsetParams } from 'utils/swingsetParams';
import type { ChainStorageWatcher } from 'store/app';
import ActionsDialog from './ActionsDialog';
import { provisionSmartWallet } from 'service/wallet';

// Increment every time the current terms change.
export const currentTermsIndex = 1;

const feeDenom = 10n ** 6n;

const useSmartWalletFeeQuery = (watcher: ChainStorageWatcher | null) => {
  const [smartWalletFee, setFee] = useState<bigint | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchParams = async () => {
      assert(watcher);
      try {
        const params = await querySwingsetParams(watcher.rpcAddr);
        console.debug('swingset params', params);
        setFee(BigInt(params.params.powerFlagFees[0].fee[0].amount));
      } catch (e) {
        setError(e as Error);
      }
    };

    if (watcher) {
      fetchParams();
    }
  }, [watcher]);

  return { smartWalletFee, error };
};

const ProvisionSmartWalletDialog = () => {
  const chainConnection = useAtomValue(chainConnectionAtom);
  const watcher = useAtomValue(chainStorageWatcherAtom);
  const [provisionToastId, setProvisionToastId] = useAtom(provisionToastIdAtom);
  const smartWalletProvisionRequired = useRef(false);
  const [isSmartWalletProvisioned] = useAtom(smartWalletProvisionedAtom);
  const [shouldBeOpenIfFeeLoaded, setShouldBeOpenIfFeeLoaded] = useState(false);
  const { smartWalletFee, error: smartWalletFeeError } =
    useSmartWalletFeeQuery(watcher);

  useEffect(() => {
    if (
      isSmartWalletProvisioned === false &&
      !smartWalletProvisionRequired.current
    ) {
      smartWalletProvisionRequired.current = true;
      if (smartWalletFeeError) {
        console.error('Swingset params error', smartWalletFeeError);
        toast.error('Error reading smart wallet provisioning fee from chain.');
        return;
      }
      setShouldBeOpenIfFeeLoaded(true);
    } else if (
      isSmartWalletProvisioned &&
      smartWalletProvisionRequired.current
    ) {
      smartWalletProvisionRequired.current = false;
      setShouldBeOpenIfFeeLoaded(false);
      if (provisionToastId) {
        toast.dismiss(provisionToastId);
        setProvisionToastId(undefined);
      }
      toast.success('Smart wallet successfully provisioned.');
    }
  }, [
    isSmartWalletProvisioned,
    provisionToastId,
    setProvisionToastId,
    smartWalletFeeError,
    smartWalletFee,
  ]);

  const smartWalletFeeForDisplay = smartWalletFee
    ? smartWalletFee / feeDenom + ' BLD'
    : null;

  const provision = () => {
    assert(chainConnection);
    provisionSmartWallet(chainConnection, setProvisionToastId);
    setShouldBeOpenIfFeeLoaded(false);
  };

  const body = (
    <span>
      To interact with contracts on the Agoric chain, a smart wallet must be
      created for your account. As an anti-spam measure, you will need{' '}
      {smartWalletFeeForDisplay && <b>{smartWalletFeeForDisplay}</b>} to fund
      its provision which will be deposited to the community fund.
    </span>
  );

  return (
    <ActionsDialog
      body={body}
      isOpen={shouldBeOpenIfFeeLoaded && smartWalletFeeForDisplay !== null}
      title="Smart Wallet Required"
      primaryAction={{ label: 'Provision Now', action: provision }}
      secondaryAction={{
        label: 'Back to App',
        action: () => setShouldBeOpenIfFeeLoaded(false),
      }}
      onClose={() => setShouldBeOpenIfFeeLoaded(false)}
      initialFocusPrimary={true}
    />
  );
};

export default ProvisionSmartWalletDialog;
