import { useVaultStore } from 'store/vaults';
import VaultSummary from 'components/VaultSummary';
import { chainConnectionAtom, displayFunctionsAtom } from 'store/app';
import { useAtomValue } from 'jotai';

const ManageVaults = () => {
  const vaults = useVaultStore(state => state.vaults);
  const chainConnection = useAtomValue(chainConnectionAtom);
  const displayFunctions = useAtomValue(displayFunctionsAtom);

  if (!chainConnection) {
    return <p>Connect your wallet to manage your vaults.</p>;
  }

  if (vaults?.size === 0) {
    return <p>You have not opened any vaults yet.</p>;
  }

  if (!(vaults && displayFunctions)) {
    return <p>Loading your vaults...</p>;
  }

  const content = [...vaults.entries()].map(([offerId]) => (
    <VaultSummary key={offerId} offerId={offerId} />
  ));

  return <div className="flex gap-4 flex-wrap p-1">{content}</div>;
};

export default ManageVaults;
