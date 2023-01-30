import { useMemo } from 'react';
import { useVaultStore } from 'store/vaults';
import { useAtomValue } from 'jotai';
import { displayFunctionsAtom } from 'store/app';
import SkeletonVaultSummary from 'components/SkeletonVaultSummary';

type Props = {
  vaultKey: string;
};

const VaultSummary = ({ vaultKey }: Props) => {
  const { vaults, errors } = useVaultStore(state => ({
    vaults: state.vaults,
    errors: state.vaultErrors,
  }));
  const vault = vaults?.get(vaultKey);
  const error = errors.get(vaultKey);
  const displayFunctions = useAtomValue(displayFunctionsAtom);

  return useMemo(() => {
    assert(vault, `Cannot render summary for nonexistent vault ${vaultKey}`);
    assert(
      displayFunctions,
      `Cannot render summary for vault ${vaultKey} - missing vbank asset info.`,
    );
    const { displayAmount, displayBrandPetname } = displayFunctions;

    if (error) {
      return (
        <div className="p-4 pt-2 border border-black border-solid">
          <h3>{vaultKey}</h3>
          <p>Error: {error.toString()}</p>
        </div>
      );
    }

    if (vault.isLoading) {
      return <SkeletonVaultSummary />;
    }

    assert(vault.locked, 'Vault must be loading still');

    // TODO: Calculate and display total debt correctly.
    return (
      <div className="p-4 pt-2 border border-black border-solid">
        <h3>{vaultKey}</h3>
        <p>Status: {vault.vaultState}</p>
        <p>
          Locked: {displayAmount(vault.locked)}{' '}
          {displayBrandPetname(vault.locked.brand)}
        </p>
      </div>
    );
  }, [vault, error, vaultKey, displayFunctions]);
};

export default VaultSummary;
