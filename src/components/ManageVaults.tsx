import { useVaultStore } from 'store/vaults';
import VaultSummary from 'components/VaultSummary';
import { useAtomValue } from 'jotai';
import { displayFunctionsAtom } from 'store/app';

const ManageVaults = () => {
  const vaults = useVaultStore(state => state.vaults);
  const displayFunctions = useAtomValue(displayFunctionsAtom);
  const content = displayFunctions ? (
    [...vaults.entries()].map(([key]) => (
      <VaultSummary key={key} vaultKey={key} />
    ))
  ) : (
    <p>Loading...</p>
  );

  return (
    <>
      <h2>Manage vaults:</h2>
      <div className="flex gap-4 flex-wrap p-1">{content}</div>
    </>
  );
};

export default ManageVaults;
