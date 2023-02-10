import { signerTarget } from 'config';
import { useSetAtom, useAtomValue } from 'jotai';
import { walletUiHrefAtom } from 'store/app';
import { ViewMode, viewModeAtom } from 'store/vaults';
import ActionsDialog from './ActionsDialog';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const message =
  'Your vault creation request has been successfully submitted. Go to your Agoric Smart Wallet to approve. Once your offer is approved, you will be able to view and manage your vault.';

const VaultCreationDialog = ({ isOpen, onClose }: Props) => {
  const walletUrl = useAtomValue(walletUiHrefAtom);
  const setViewMode = useSetAtom(viewModeAtom);

  const goToWallet = () => {
    window.open(walletUrl, signerTarget);
  };

  const goToVaults = () => {
    onClose();
    setViewMode(ViewMode.Manage);
  };

  return (
    <ActionsDialog
      title="Success: Offer Submitted"
      body={<p>{message}</p>}
      isOpen={isOpen}
      onClose={onClose}
      onPrimaryAction={goToWallet}
      onSecondaryAction={goToVaults}
      primaryActionLabel="Go to wallet"
      secondaryActionLabel="Back to vaults"
    />
  );
};

export default VaultCreationDialog;
