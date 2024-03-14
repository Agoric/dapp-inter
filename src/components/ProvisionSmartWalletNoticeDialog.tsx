import { useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { querySwingsetParams } from 'utils/swingsetParams';
import { displayFunctionsAtom, pursesAtom, rpcNodeAtom } from 'store/app';
import ActionsDialog from './ActionsDialog';
import LeapLiquidityModal, { Direction } from './leap-elements/LiquidityModal';
import type { PursesJSONState } from '@agoric/wallet-backend';

const useSmartWalletFeeQuery = (rpc: string | null) => {
  const [smartWalletFee, setFee] = useState<{
    fee: bigint;
    feeUnit: bigint;
  } | null>(null);
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
        assert(feeUnit);
        setFee({ fee: BigInt(beansPerSmartWallet), feeUnit: BigInt(feeUnit) });
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
    ? String(smartWalletFee.fee / smartWalletFee.feeUnit) + ' IST'
    : null;

  const purses = useAtomValue(pursesAtom);
  const istPurse = purses?.find(p => p.brandPetname === 'IST') as
    | PursesJSONState<'nat'>
    | undefined;
  const { displayAmount, getDecimalPlaces } =
    useAtomValue(displayFunctionsAtom) ?? {};

  const body = (
    <>
      <div>
        To interact with contracts on the Agoric chain, a smart wallet must be
        created for your account. You will need{' '}
        {smartWalletFeeForDisplay && <b>{smartWalletFeeForDisplay}</b>} to fund
        its provision which will be deposited into the reserve pool. Click
        &quot;Proceed&quot; to provision wallet and submit transaction.
      </div>
      <div className="my-4 flex justify-center gap-4">
        {istPurse && displayAmount && (
          <div className="flex items-center">
            <span>
              IST Balance: <b>{displayAmount(istPurse.currentAmount)}</b>
            </span>
          </div>
        )}
        {istPurse && (
          <LeapLiquidityModal
            selectedAsset={istPurse.brand}
            direction={Direction.deposit}
          />
        )}
      </div>
    </>
  );
  const istDecimals =
    istPurse && getDecimalPlaces && getDecimalPlaces(istPurse.brand);

  // "feeUnit" is observed to be 1000000000000n, so when "fee" is 1000000000000n
  // that means 1 IST (after dividing "fee" by "feeUnit"). To convert to uIST,
  // we then multiply by 10^6.
  const denominatedSmartWalletFee =
    istDecimals &&
    smartWalletFee &&
    (smartWalletFee.fee / smartWalletFee.feeUnit) * 10n ** BigInt(istDecimals);

  const hasRequiredFee =
    denominatedSmartWalletFee &&
    istPurse !== undefined &&
    istPurse.currentAmount.value >= denominatedSmartWalletFee;

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
      primaryActionDisabled={!hasRequiredFee}
    />
  );
};

export default ProvisionSmartWalletNoticeDialog;
