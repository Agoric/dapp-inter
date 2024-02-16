import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { rpcNodeAtom } from 'store/app';
import { querySwingsetParams } from 'utils/swingsetParams';
import ActionsDialog from './ActionsDialog';

const useSmartWalletFeeQuery = (rpc: string | null) => {
  const [smartWalletFee, setFee] = useState<bigint | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchParams = async () => {
      assert(rpc);
      try {
        const params = await querySwingsetParams(rpc);
        console.debug('swingset params', params);
        const beansPerSmartWallet = params.params.beansPerUnit.find(
          ({ key }: { key: string }) => key === 'smartWalletProvision',
        )?.beans;
        const feeUnit = params.params.beansPerUnit.find(
          ({ key }: { key: string }) => key === 'feeUnit',
        )?.beans;
        setFee(BigInt(beansPerSmartWallet) / BigInt(feeUnit));
      } catch (e) {
        setError(e as Error);
      }
    };

    if (rpc) {
      fetchParams();
    }
  }, [rpc]);

  return { smartWalletFee, error };
};

type Props = {
  onConfirm: () => void;
  isOpen: boolean;
  onClose: () => void;
};

const ProvisionSmartWalletNoticeDialog = ({
  onConfirm,
  isOpen,
  onClose,
}: Props) => {
  const rpc = useAtomValue(rpcNodeAtom);
  const { smartWalletFee, error: _smartWalletFeeError } =
    useSmartWalletFeeQuery(rpc);

  const smartWalletFeeForDisplay = smartWalletFee
    ? smartWalletFee + ' IST'
    : null;

  const body = (
    <span>
      To interact with contracts on the Agoric chain, a smart wallet must be
      created for your account. As an anti-spam measure, you will need{' '}
      {smartWalletFeeForDisplay && <b>{smartWalletFeeForDisplay}</b>} to fund
      its provision which will be deposited into the reserve pool. Click
      &quot;Proceed&quot; to provision wallet and submit transaction.
    </span>
  );

  return (
    <ActionsDialog
      body={body}
      isOpen={isOpen}
      title="Smart Wallet Required"
      primaryAction={{ label: 'Proceed', action: onConfirm }}
      secondaryAction={{
        label: 'Go Back',
        action: onClose,
      }}
      onClose={onClose}
      initialFocusPrimary={true}
    />
  );
};

export default ProvisionSmartWalletNoticeDialog;
