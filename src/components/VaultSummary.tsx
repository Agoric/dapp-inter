import { useMemo } from 'react';
import { useVaultStore } from 'store/vaults';
import { useAtomValue } from 'jotai';
import { displayFunctionsAtom } from 'store/app';
import type { VaultKey } from 'store/vaults';

type Props = {
  id: VaultKey;
};

const VaultSummary = ({ id }: Props) => {
  const { vaults, errors } = useVaultStore(state => ({
    vaults: state.vaults,
    errors: state.vaultErrors,
  }));
  const vault = vaults.get(id);
  const error = errors.get(id);
  const displayFunctions = useAtomValue(displayFunctionsAtom);

  return useMemo(() => {
    assert(vault, `Cannot render summary for nonexistent vault ${id}`);
    assert(
      displayFunctions,
      `Cannot render summary for vault ${id} - missing vbank asset info.`,
    );
    const { displayAmount, displayBrandPetname } = displayFunctions;

    if (error) {
      return (
        <div className="p-4 pt-2 border border-black border-solid">
          <h3>{id}</h3>
          <p>Error: {error.toString()}</p>
        </div>
      );
    }

    // TODO: Calculate and display total debt correctly.
    return (
      <div className="p-4 pt-2 border border-black border-solid">
        <h3>{id}</h3>
        <p>Status: {vault.vaultState}</p>
        <p>
          Locked: {displayAmount(vault.locked)}{' '}
          {displayBrandPetname(vault.locked.brand)}
        </p>
      </div>
    );
  }, [vault, error, id, displayFunctions]);
};

export default VaultSummary;
