import { signerTarget } from 'config';
import { useSetAtom, useAtomValue } from 'jotai';
import { walletUiHrefAtom } from 'store/app';
import { ViewMode, viewModeAtom } from 'store/vaults';
import BaseDialog from './BaseDialog';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const VaultAdjustmentDialog = ({ isOpen, onClose }: Props) => {
  const walletUrl = useAtomValue(walletUiHrefAtom);
  const setViewMode = useSetAtom(viewModeAtom);

  const goToWallet = () => {
    window.open(walletUrl, signerTarget);
  };

  const goToVaults = () => {
    onClose();
    setViewMode(ViewMode.Manage);
  };

  const message =
    'Your vault adjustment request has been successfully submitted. Go to your Agoric Smart Wallet to approve.';

  return (
    <BaseDialog
      title="Success: Offer Submitted"
      message={message}
      isOpen={isOpen}
      onClose={onClose}
      onPrimaryAction={goToWallet}
      onSecondaryAction={goToVaults}
      primaryActionLabel="Go to wallet"
      secondaryActionLabel="Back to vaults"
    />
  );
};

export default VaultAdjustmentDialog;
