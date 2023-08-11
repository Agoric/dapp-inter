import { useSetAtom } from 'jotai';
import { ViewMode, viewModeAtom } from 'store/vaults';
import ActionsDialog from './ActionsDialog';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const message = "Your vault's balances have been updated.";

const VaultAdjustmentDialog = ({ isOpen, onClose }: Props) => {
  const setViewMode = useSetAtom(viewModeAtom);

  const goToVaults = () => {
    onClose();
    setViewMode(ViewMode.Manage);
  };

  return (
    <ActionsDialog
      title="Success: Vault Adjusted"
      body={<p>{message}</p>}
      isOpen={isOpen}
      onClose={onClose}
      primaryAction={{ action: goToVaults, label: 'Back to my vaults' }}
      secondaryAction={{ action: onClose, label: 'Adjust more' }}
    />
  );
};

export default VaultAdjustmentDialog;
