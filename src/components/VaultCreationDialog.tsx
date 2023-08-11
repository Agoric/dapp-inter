import { useSetAtom } from 'jotai';
import { ViewMode, viewModeAtom } from 'store/vaults';
import ActionsDialog from './ActionsDialog';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const message = 'You can manage your vaults from the "My Vaults" view.';

const VaultCreationDialog = ({ isOpen, onClose }: Props) => {
  const setViewMode = useSetAtom(viewModeAtom);

  const goToVaults = () => {
    onClose();
    setViewMode(ViewMode.Manage);
  };

  return (
    <ActionsDialog
      title="Success: Vault Created"
      body={<p>{message}</p>}
      isOpen={isOpen}
      onClose={onClose}
      primaryAction={{ action: goToVaults, label: 'Manage my Vaults' }}
      secondaryAction={{ action: onClose, label: 'Create Another Vault' }}
    />
  );
};

export default VaultCreationDialog;
